<?php

namespace App\Services;

use App\Models\HubRequest;
use Illuminate\Support\Facades\DB;

/**
 * Read-side correlation by trace_id: given a request (or any anchoring trace),
 * fetch every event in the same project that shares the trace_id and return
 * them sorted chronologically with offsets relative to the earliest event in
 * the trace, ready for waterfall rendering.
 *
 * Indexes: relies on (project_id, trace_id) on each source table. Without
 * those, this query degrades fast on a busy DB.
 */
class TraceTimelineService
{
    private const PER_SOURCE_LIMIT = 200;

    /**
     * @return array{
     *     events: list<array<string, mixed>>,
     *     trace_id: ?string,
     *     total_duration_ms: int,
     *     truncated_sources: array<string, int>
     * }
     */
    public function forRequest(HubRequest $request): array
    {
        if ($request->trace_id === null) {
            return [
                'events' => [],
                'trace_id' => null,
                'total_duration_ms' => (int) ($request->duration_ms ?? 0),
                'truncated_sources' => [],
            ];
        }

        return $this->forTrace($request->project_id, $request->trace_id);
    }

    /**
     * @return array{
     *     events: list<array<string, mixed>>,
     *     trace_id: ?string,
     *     total_duration_ms: int,
     *     truncated_sources: array<string, int>
     * }
     */
    public function forTrace(int $projectId, string $traceId): array
    {
        $truncated = [];
        $events = [];

        foreach ($this->sources() as $source) {
            $rows = DB::table($source['table'])
                ->where('project_id', $projectId)
                ->where('trace_id', $traceId)
                ->orderBy('sent_at')
                ->limit(self::PER_SOURCE_LIMIT)
                ->get();

            if ($rows->count() === self::PER_SOURCE_LIMIT) {
                $totalForTrace = (int) DB::table($source['table'])
                    ->where('project_id', $projectId)
                    ->where('trace_id', $traceId)
                    ->count();

                if ($totalForTrace > self::PER_SOURCE_LIMIT) {
                    $truncated[$source['type']] = $totalForTrace - self::PER_SOURCE_LIMIT;
                }
            }

            foreach ($rows as $row) {
                $events[] = $this->normalize($source, $row);
            }
        }

        usort($events, fn (array $a, array $b) => $a['start_ms'] <=> $b['start_ms']);

        $traceStartMs = $events[0]['start_ms'] ?? 0;
        $traceEndMs = $traceStartMs;

        foreach ($events as &$event) {
            $event['offset_ms'] = $event['start_ms'] - $traceStartMs;
            $endMs = $event['start_ms'] + (int) ($event['duration_ms'] ?? 0);
            if ($endMs > $traceEndMs) {
                $traceEndMs = $endMs;
            }
        }
        unset($event);

        return [
            'events' => $events,
            'trace_id' => $traceId,
            'total_duration_ms' => max(1, $traceEndMs - $traceStartMs),
            'truncated_sources' => $truncated,
        ];
    }

    /**
     * @return list<array{type: string, table: string}>
     */
    private function sources(): array
    {
        return [
            ['type' => 'request', 'table' => 'hub_requests'],
            ['type' => 'query', 'table' => 'hub_queries'],
            ['type' => 'log', 'table' => 'hub_logs'],
            ['type' => 'job', 'table' => 'hub_jobs'],
            ['type' => 'outgoing_http', 'table' => 'hub_outgoing_http'],
            ['type' => 'cache', 'table' => 'hub_cache'],
            ['type' => 'mail', 'table' => 'hub_mails'],
            ['type' => 'notification', 'table' => 'hub_notifications'],
            ['type' => 'exception', 'table' => 'hub_exceptions'],
        ];
    }

    /**
     * @param  array{type: string, table: string}  $source
     * @return array<string, mixed>
     */
    private function normalize(array $source, object $row): array
    {
        $sentAt = $row->sent_at;
        $sentMs = (int) (strtotime($sentAt) * 1000);

        // Many event types have a duration; the "start" time is sent_at minus
        // the duration so the waterfall bar's right edge aligns with sent_at
        // (the moment we emitted the event). For instant events (logs, cache
        // aggregates, exceptions) duration is 0 and start == sent_at.
        $durationMs = match ($source['type']) {
            'request', 'query', 'job', 'outgoing_http' => (int) ($row->duration_ms ?? 0),
            default => 0,
        };

        $startMs = $sentMs - $durationMs;

        $base = [
            'id' => $source['type'].':'.$row->id,
            'type' => $source['type'],
            'occurred_at' => $sentAt,
            'start_ms' => $startMs,
            'offset_ms' => 0, // recomputed by caller after sorting
            'duration_ms' => $durationMs,
            'summary' => '',
            'severity' => 'info',
            'details' => [],
        ];

        return match ($source['type']) {
            'request' => array_merge($base, [
                'summary' => sprintf(
                    '%s %s → %d in %sms',
                    $row->method,
                    $row->uri,
                    $row->status_code,
                    $this->formatDuration($row->duration_ms),
                ),
                'severity' => $row->status_code >= 500
                    ? 'error'
                    : ($row->status_code >= 400 ? 'warning' : 'success'),
                'details' => [
                    'duration_ms' => (float) $row->duration_ms,
                    'status_code' => (int) $row->status_code,
                    'route_name' => $row->route_name,
                    'ip' => $row->ip,
                    'user_id' => $row->user_id,
                ],
            ]),
            'query' => array_merge($base, [
                'summary' => sprintf(
                    '%s (%sms)%s%s',
                    $this->truncate((string) $row->sql, 120),
                    $this->formatDuration($row->duration_ms),
                    (int) $row->is_slow ? ' · slow' : '',
                    (int) $row->is_n_plus_one ? ' · N+1' : '',
                ),
                'severity' => (int) $row->is_slow || (int) $row->is_n_plus_one
                    ? 'warning'
                    : 'info',
                'details' => [
                    'sql' => $row->sql,
                    'duration_ms' => (float) $row->duration_ms,
                    'connection' => $row->connection,
                    'file' => $row->file,
                    'line' => $row->line,
                    'is_slow' => (bool) $row->is_slow,
                    'is_n_plus_one' => (bool) $row->is_n_plus_one,
                ],
            ]),
            'log' => array_merge($base, [
                'summary' => sprintf(
                    '%s: %s',
                    $row->level,
                    $this->truncate((string) $row->message, 140),
                ),
                'severity' => match (strtolower((string) $row->level)) {
                    'emergency', 'alert', 'critical', 'error' => 'error',
                    'warning' => 'warning',
                    default => 'info',
                },
                'details' => [
                    'level' => $row->level,
                    'channel' => $row->channel,
                    'message' => $row->message,
                    'context' => $row->context,
                ],
            ]),
            'job' => array_merge($base, [
                'summary' => sprintf(
                    '%s · %s%s',
                    $row->job_class,
                    $row->status,
                    $row->duration_ms !== null
                        ? ' in '.$this->formatDuration($row->duration_ms).'ms'
                        : '',
                ),
                'severity' => match (strtolower((string) $row->status)) {
                    'failed' => 'error',
                    'released', 'retrying' => 'warning',
                    'processed', 'completed' => 'success',
                    default => 'info',
                },
                'details' => [
                    'job_class' => $row->job_class,
                    'queue' => $row->queue,
                    'connection' => $row->connection,
                    'status' => $row->status,
                    'attempt' => $row->attempt,
                    'duration_ms' => $row->duration_ms !== null ? (float) $row->duration_ms : null,
                    'error_message' => $row->error_message,
                ],
            ]),
            'outgoing_http' => array_merge($base, [
                'summary' => sprintf(
                    '%s %s → %s%s',
                    $row->method,
                    $this->truncate((string) $row->url, 100),
                    $row->status_code !== null ? (string) $row->status_code : 'no response',
                    $row->duration_ms !== null
                        ? ' in '.$this->formatDuration($row->duration_ms).'ms'
                        : '',
                ),
                'severity' => (int) $row->failed
                    ? 'error'
                    : ($row->status_code !== null && $row->status_code >= 500 ? 'error'
                        : ($row->status_code !== null && $row->status_code >= 400 ? 'warning' : 'success')),
                'details' => [
                    'host' => $row->host,
                    'url' => $row->url,
                    'duration_ms' => $row->duration_ms !== null ? (float) $row->duration_ms : null,
                    'status_code' => $row->status_code !== null ? (int) $row->status_code : null,
                    'failed' => (bool) $row->failed,
                    'error_message' => $row->error_message,
                ],
            ]),
            'cache' => array_merge($base, [
                'summary' => sprintf(
                    'cache · %s · %d hits / %d misses (rate %s%%)',
                    $row->store,
                    (int) $row->hits,
                    (int) $row->misses,
                    $row->hit_rate !== null ? round((float) $row->hit_rate * 100) : '–',
                ),
                'severity' => 'info',
                'details' => [
                    'store' => $row->store,
                    'hits' => (int) $row->hits,
                    'misses' => (int) $row->misses,
                    'writes' => (int) $row->writes,
                    'forgets' => (int) $row->forgets,
                    'hit_rate' => $row->hit_rate !== null ? (float) $row->hit_rate : null,
                ],
            ]),
            'mail' => array_merge($base, [
                'summary' => sprintf(
                    '%s · %s%s',
                    $row->status,
                    $row->mailable ?: 'mail',
                    $row->to ? ' to '.$row->to : '',
                ),
                'severity' => strtolower((string) $row->status) === 'failed' ? 'error' : 'success',
                'details' => [
                    'mailable' => $row->mailable,
                    'subject' => $row->subject,
                    'to' => $row->to,
                    'status' => $row->status,
                    'error_message' => $row->error_message,
                ],
            ]),
            'notification' => array_merge($base, [
                'summary' => sprintf(
                    '%s · %s · %s',
                    $row->status,
                    $row->channel,
                    $row->notification_class,
                ),
                'severity' => strtolower((string) $row->status) === 'failed' ? 'error' : 'success',
                'details' => [
                    'notification_class' => $row->notification_class,
                    'channel' => $row->channel,
                    'notifiable_type' => $row->notifiable_type,
                    'notifiable_id' => $row->notifiable_id,
                    'status' => $row->status,
                    'error_message' => $row->error_message,
                ],
            ]),
            'exception' => array_merge($base, [
                'summary' => sprintf(
                    '%s: %s',
                    $row->exception_class,
                    $this->truncate((string) $row->message, 160),
                ),
                'severity' => match (strtolower((string) ($row->severity ?? 'error'))) {
                    'critical', 'error' => 'error',
                    'warning' => 'warning',
                    default => 'info',
                },
                'details' => [
                    'id' => (int) $row->id,
                    'exception_class' => $row->exception_class,
                    'message' => $row->message,
                    'file' => $row->file,
                    'line' => $row->line,
                    'severity' => $row->severity,
                ],
            ]),
            default => $base,
        };
    }

    private function truncate(string $value, int $max): string
    {
        return mb_strlen($value) > $max
            ? mb_substr($value, 0, $max - 1).'…'
            : $value;
    }

    private function formatDuration(float|int|null $ms): string
    {
        if ($ms === null) {
            return '0';
        }

        return number_format((float) $ms, 0);
    }
}

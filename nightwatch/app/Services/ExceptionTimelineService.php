<?php

namespace App\Services;

use App\Models\HubException;
use Illuminate\Support\Facades\DB;

/**
 * Read-side correlation: given an exception, fetch every relevant telemetry
 * event in the same project that happened within ±N seconds of the exception
 * and return them sorted chronologically in a normalized shape the React side
 * can render uniformly.
 *
 * Eight sources are queried (requests, queries, logs, jobs, outgoing_http,
 * cache, mails, notifications). Each query is capped at LIMIT 50 so a single
 * chatty source can't bloat the page payload. If a cap is hit we surface a
 * "+N more not shown" indicator alongside the timeline.
 *
 * The whole thing relies on (project_id, sent_at) composite indexes per
 * source table — without those, a busy production DB would degrade fast.
 */
class ExceptionTimelineService
{
    private const PER_SOURCE_LIMIT = 50;

    /**
     * @return array{
     *     events: list<array<string, mixed>>,
     *     window_seconds: int,
     *     center_at: string,
     *     truncated_sources: array<string, int>
     * }
     */
    public function forException(HubException $exception, int $windowSeconds = 30): array
    {
        $center = $exception->sent_at;

        if ($center === null) {
            return [
                'events' => [],
                'window_seconds' => $windowSeconds,
                'center_at' => '',
                'truncated_sources' => [],
            ];
        }

        $start = $center->copy()->subSeconds($windowSeconds);
        $end = $center->copy()->addSeconds($windowSeconds);
        $centerMs = (int) ($center->getTimestamp() * 1000 + (int) $center->format('v'));

        $truncated = [];
        $events = [];

        foreach ($this->sources() as $source) {
            $rows = DB::table($source['table'])
                ->where('project_id', $exception->project_id)
                ->whereBetween('sent_at', [$start, $end])
                ->orderBy('sent_at')
                ->limit(self::PER_SOURCE_LIMIT)
                ->get();

            // Surface "+N more" when we're at the cap so the UI can show the
            // user there's hidden volume.
            if ($rows->count() === self::PER_SOURCE_LIMIT) {
                $totalInWindow = (int) DB::table($source['table'])
                    ->where('project_id', $exception->project_id)
                    ->whereBetween('sent_at', [$start, $end])
                    ->count();

                if ($totalInWindow > self::PER_SOURCE_LIMIT) {
                    $truncated[$source['type']] = $totalInWindow - self::PER_SOURCE_LIMIT;
                }
            }

            foreach ($rows as $row) {
                $events[] = $this->normalize($source, $row, $centerMs);
            }
        }

        usort($events, fn (array $a, array $b) => $a['offset_ms'] <=> $b['offset_ms']);

        return [
            'events' => $events,
            'window_seconds' => $windowSeconds,
            'center_at' => $center->toIso8601String(),
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
        ];
    }

    /**
     * Normalize a raw row from any source table into the common shape the
     * React component consumes. Each branch picks a one-line summary, a
     * severity hue, and any source-specific details for the expandable view.
     *
     * @param  array{type: string, table: string}  $source
     * @return array<string, mixed>
     */
    private function normalize(array $source, object $row, int $centerMs): array
    {
        $sentAt = $row->sent_at;
        $sentMs = (int) (strtotime($sentAt) * 1000);

        $base = [
            'id' => $source['type'].':'.$row->id,
            'type' => $source['type'],
            'occurred_at' => $sentAt,
            'offset_ms' => $sentMs - $centerMs,
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

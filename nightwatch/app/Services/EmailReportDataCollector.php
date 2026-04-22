<?php

namespace App\Services;

use App\Models\EmailReport;
use App\Models\HubComposerAudit;
use App\Models\HubException;
use App\Models\HubHealthCheck;
use App\Models\HubJob;
use App\Models\HubNpmAudit;
use App\Models\HubOutgoingHttp;
use App\Models\HubQuery;
use App\Models\HubRequest;
use App\Models\Project;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;

/**
 * Aggregates monitoring metrics for a scheduled email report.
 *
 * Every query in here is bounded by the report window (sent_at >= since) and
 * uses the composite (project_id, sent_at) indexes already present on the
 * hub_* tables, so the cost stays flat as the dataset grows.
 */
class EmailReportDataCollector
{
    private const WINDOW_HOURS = [
        'daily' => 24,
        'weekly' => 24 * 7,
        'monthly' => 24 * 30,
    ];

    private const TOP_N = 5;

    /**
     * @return array{
     *     window: array{label: string, from: string, to: string},
     *     scope: array{all: bool, projects: list<array{id:int,name:string,environment:string,status:string}>},
     *     summary: array<string, int|float>,
     *     sections: array<string, mixed>
     * }
     */
    public function collect(EmailReport $report): array
    {
        $hours = self::WINDOW_HOURS[$report->frequency] ?? 24;
        $to = CarbonImmutable::now();
        $since = $to->subHours($hours);

        $projects = $this->resolveProjects($report);
        $scopedIds = $report->project_scope === 'selected'
            ? array_map(static fn (Project $p) => $p->id, $projects)
            : null;

        $sections = $report->sections ?: EmailReport::DEFAULT_SECTIONS;

        return [
            'window' => [
                'label' => $report->frequency,
                'from' => $since->toIso8601String(),
                'to' => $to->toIso8601String(),
            ],
            'scope' => [
                'all' => $report->project_scope === 'all',
                'projects' => array_map(static fn (Project $p) => [
                    'id' => $p->id,
                    'name' => $p->name,
                    'environment' => $p->environment,
                    'status' => $p->status,
                ], $projects),
            ],
            'summary' => $this->buildSummary($since, $scopedIds),
            'sections' => $this->buildSections($sections, $since, $scopedIds),
        ];
    }

    /**
     * @return list<Project>
     */
    private function resolveProjects(EmailReport $report): array
    {
        $query = Project::query()->orderBy('name');

        if ($report->project_scope === 'selected') {
            $ids = array_map('intval', $report->project_ids ?? []);
            if ($ids === []) {
                return [];
            }
            $query->whereIn('id', $ids);
        }

        return $query->get()->all();
    }

    /**
     * @param  list<int>|null  $scopedIds
     * @return array<string, int|float>
     */
    private function buildSummary(CarbonImmutable $since, ?array $scopedIds): array
    {
        $requestStats = $this->scope(HubRequest::query(), $scopedIds)
            ->where('sent_at', '>=', $since)
            ->selectRaw('COUNT(*) as total, AVG(duration_ms) as avg_duration, SUM(CASE WHEN status_code >= 500 THEN 1 ELSE 0 END) as failed')
            ->first();

        return [
            'total_exceptions' => $this->scope(HubException::query(), $scopedIds)
                ->where('sent_at', '>=', $since)
                ->count(),
            'critical_exceptions' => $this->scope(HubException::query(), $scopedIds)
                ->where('sent_at', '>=', $since)
                ->whereIn('severity', ['critical', 'emergency', 'alert'])
                ->count(),
            'total_requests' => (int) ($requestStats->total ?? 0),
            'failed_requests' => (int) ($requestStats->failed ?? 0),
            'avg_response_time_ms' => (int) round((float) ($requestStats->avg_duration ?? 0)),
            'failed_jobs' => $this->scope(HubJob::query(), $scopedIds)
                ->where('sent_at', '>=', $since)
                ->where('status', 'failed')
                ->count(),
            'slow_queries' => $this->scope(HubQuery::query(), $scopedIds)
                ->where('sent_at', '>=', $since)
                ->where('is_slow', true)
                ->count(),
            'failed_outgoing_http' => $this->scope(HubOutgoingHttp::query(), $scopedIds)
                ->where('sent_at', '>=', $since)
                ->where('failed', true)
                ->count(),
            'health_failures' => $this->scope(HubHealthCheck::query(), $scopedIds)
                ->where('sent_at', '>=', $since)
                ->whereIn('status', ['critical', 'error', 'failed'])
                ->count(),
        ];
    }

    /**
     * @param  list<string>  $sections
     * @param  list<int>|null  $scopedIds
     * @return array<string, mixed>
     */
    private function buildSections(array $sections, CarbonImmutable $since, ?array $scopedIds): array
    {
        $out = [];
        $wanted = array_flip($sections);

        if (isset($wanted['exceptions'])) {
            $out['exceptions'] = $this->topExceptions($since, $scopedIds);
        }

        if (isset($wanted['requests'])) {
            $out['requests'] = $this->slowestRequests($since, $scopedIds);
        }

        if (isset($wanted['queries'])) {
            $out['queries'] = $this->slowestQueries($since, $scopedIds);
        }

        if (isset($wanted['jobs'])) {
            $out['jobs'] = $this->failedJobs($since, $scopedIds);
        }

        if (isset($wanted['audits'])) {
            $out['audits'] = $this->auditSummary($since, $scopedIds);
        }

        if (isset($wanted['health_checks'])) {
            $out['health_checks'] = $this->healthFailures($since, $scopedIds);
        }

        if (isset($wanted['outgoing_http'])) {
            $out['outgoing_http'] = $this->outgoingHttpFailures($since, $scopedIds);
        }

        return $out;
    }

    /**
     * @param  list<int>|null  $scopedIds
     * @return list<array{exception_class:string,severity:string,count:int,last_seen:string|null}>
     */
    private function topExceptions(CarbonImmutable $since, ?array $scopedIds): array
    {
        $rows = $this->scope(HubException::query(), $scopedIds)
            ->where('sent_at', '>=', $since)
            ->selectRaw('exception_class, severity, COUNT(*) as occurrences, MAX(sent_at) as last_seen')
            ->groupBy('exception_class', 'severity')
            ->orderByDesc('occurrences')
            ->limit(self::TOP_N)
            ->get();

        return $rows->map(fn ($r) => [
            'exception_class' => (string) $r->exception_class,
            'severity' => (string) $r->severity,
            'count' => (int) $r->occurrences,
            'last_seen' => $r->last_seen ? (string) $r->last_seen : null,
        ])->all();
    }

    /**
     * @param  list<int>|null  $scopedIds
     * @return list<array<string, mixed>>
     */
    private function slowestRequests(CarbonImmutable $since, ?array $scopedIds): array
    {
        $rows = $this->scope(HubRequest::query(), $scopedIds)
            ->where('sent_at', '>=', $since)
            ->orderByDesc('duration_ms')
            ->limit(self::TOP_N)
            ->get(['method', 'uri', 'status_code', 'duration_ms', 'sent_at']);

        return $rows->map(fn ($r) => [
            'method' => (string) $r->method,
            'uri' => (string) $r->uri,
            'status_code' => $r->status_code !== null ? (int) $r->status_code : null,
            'duration_ms' => (float) $r->duration_ms,
            'sent_at' => (string) $r->sent_at,
        ])->all();
    }

    /**
     * @param  list<int>|null  $scopedIds
     * @return list<array<string, mixed>>
     */
    private function slowestQueries(CarbonImmutable $since, ?array $scopedIds): array
    {
        $rows = $this->scope(HubQuery::query(), $scopedIds)
            ->where('sent_at', '>=', $since)
            ->orderByDesc('duration_ms')
            ->limit(self::TOP_N)
            ->get(['sql', 'duration_ms', 'is_n_plus_one', 'connection', 'sent_at']);

        return $rows->map(fn ($r) => [
            'sql' => (string) $r->sql,
            'duration_ms' => (float) $r->duration_ms,
            'is_n_plus_one' => (bool) $r->is_n_plus_one,
            'connection' => (string) $r->connection,
            'sent_at' => (string) $r->sent_at,
        ])->all();
    }

    /**
     * @param  list<int>|null  $scopedIds
     * @return list<array<string, mixed>>
     */
    private function failedJobs(CarbonImmutable $since, ?array $scopedIds): array
    {
        $rows = $this->scope(HubJob::query(), $scopedIds)
            ->where('sent_at', '>=', $since)
            ->where('status', 'failed')
            ->selectRaw('job_class, queue, COUNT(*) as occurrences, MAX(sent_at) as last_seen')
            ->groupBy('job_class', 'queue')
            ->orderByDesc('occurrences')
            ->limit(self::TOP_N)
            ->get();

        return $rows->map(fn ($r) => [
            'job_class' => (string) $r->job_class,
            'queue' => (string) $r->queue,
            'count' => (int) $r->occurrences,
            'last_seen' => $r->last_seen ? (string) $r->last_seen : null,
        ])->all();
    }

    /**
     * @param  list<int>|null  $scopedIds
     * @return array<string, mixed>
     */
    private function auditSummary(CarbonImmutable $since, ?array $scopedIds): array
    {
        $composer = $this->scope(HubComposerAudit::query(), $scopedIds)
            ->where('sent_at', '>=', $since)
            ->selectRaw('SUM(advisories_count) as advisories, SUM(abandoned_count) as abandoned, COUNT(*) as runs')
            ->first();

        $npm = $this->scope(HubNpmAudit::query(), $scopedIds)
            ->where('sent_at', '>=', $since)
            ->selectRaw('SUM(total_vulnerabilities) as total, SUM(critical_count) as critical, SUM(high_count) as high, SUM(moderate_count) as moderate, SUM(low_count) as low, SUM(info_count) as info, COUNT(*) as runs')
            ->first();

        return [
            'composer' => [
                'runs' => (int) ($composer->runs ?? 0),
                'advisories' => (int) ($composer->advisories ?? 0),
                'abandoned' => (int) ($composer->abandoned ?? 0),
            ],
            'npm' => [
                'runs' => (int) ($npm->runs ?? 0),
                'total' => (int) ($npm->total ?? 0),
                'critical' => (int) ($npm->critical ?? 0),
                'high' => (int) ($npm->high ?? 0),
                'moderate' => (int) ($npm->moderate ?? 0),
                'low' => (int) ($npm->low ?? 0),
                'info' => (int) ($npm->info ?? 0),
            ],
        ];
    }

    /**
     * @param  list<int>|null  $scopedIds
     * @return list<array<string, mixed>>
     */
    private function healthFailures(CarbonImmutable $since, ?array $scopedIds): array
    {
        $rows = $this->scope(HubHealthCheck::query(), $scopedIds)
            ->where('sent_at', '>=', $since)
            ->whereIn('status', ['critical', 'error', 'failed'])
            ->selectRaw('check_name, status, COUNT(*) as occurrences, MAX(sent_at) as last_seen')
            ->groupBy('check_name', 'status')
            ->orderByDesc('occurrences')
            ->limit(self::TOP_N)
            ->get();

        return $rows->map(fn ($r) => [
            'check_name' => (string) $r->check_name,
            'status' => (string) $r->status,
            'count' => (int) $r->occurrences,
            'last_seen' => $r->last_seen ? (string) $r->last_seen : null,
        ])->all();
    }

    /**
     * @param  list<int>|null  $scopedIds
     * @return list<array<string, mixed>>
     */
    private function outgoingHttpFailures(CarbonImmutable $since, ?array $scopedIds): array
    {
        $rows = $this->scope(HubOutgoingHttp::query(), $scopedIds)
            ->where('sent_at', '>=', $since)
            ->where('failed', true)
            ->selectRaw('host, COUNT(*) as occurrences, MAX(sent_at) as last_seen')
            ->groupBy('host')
            ->orderByDesc('occurrences')
            ->limit(self::TOP_N)
            ->get();

        return $rows->map(fn ($r) => [
            'host' => (string) $r->host,
            'count' => (int) $r->occurrences,
            'last_seen' => $r->last_seen ? (string) $r->last_seen : null,
        ])->all();
    }

    /**
     * @template T of \Illuminate\Database\Eloquent\Model
     *
     * @param  Builder<T>  $query
     * @param  list<int>|null  $scopedIds
     * @return Builder<T>
     */
    private function scope(Builder $query, ?array $scopedIds): Builder
    {
        if ($scopedIds === null) {
            return $query;
        }

        if ($scopedIds === []) {
            return $query->whereRaw('1 = 0');
        }

        return $query->whereIn('project_id', $scopedIds);
    }
}

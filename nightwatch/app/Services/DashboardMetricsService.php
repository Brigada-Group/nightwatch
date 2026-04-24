<?php

namespace App\Services;

use App\Models\HubException;
use App\Models\HubHealthCheck;
use App\Models\HubJob;
use App\Models\HubRequest;
use App\Models\Project;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class DashboardMetricsService
{
    private const ERROR_SEVERITIES = ['error', 'critical'];

    private const WARNING_SEVERITIES = ['warning', 'info', 'debug'];

    public const CACHE_KEY = 'dashboard:overview';

    private const CACHE_TTL_SECONDS = 5;

    private const FILTERED_PROJECTS_LIMIT = 50;

    /**
     * @return array{
     *     stats: array<string, int|float>,
     *     recent_projects: list<array<string, mixed>>,
     *     incident_flow: list<array<string, int|string>>,
     *     incident_volume: list<array<string, int|string>>,
     *     throughput_chart: list<array{value: int}>,
     *     bugs_chart: list<array{value: int}>,
     *     running_checks_chart: list<array{value: int}>,
     *     filter_active: bool
     * }
     */
    public function overview(?DashboardFilters $filters = null, ?array $teamProjectIds = null): array
    {
        $filters ??= new DashboardFilters;
        $teamScopeSuffix = $teamProjectIds !== null
            ? ':team:'.md5((string) json_encode(array_values($teamProjectIds)))
            : '';
        $cacheKey = self::CACHE_KEY.$filters->cacheSuffix().$teamScopeSuffix;

        return Cache::remember(
            $cacheKey,
            self::CACHE_TTL_SECONDS,
            fn () => $this->compute($filters, $teamProjectIds)
        );
    }

    /**
     * Projects that sent a heartbeat, HTTP request, exception, or log in the window.
     *
     * @param  list<int>|null  $scopedIds  Null means "all projects".
     */
    private function countProjectsWithTelemetryInWindow(CarbonImmutable $since, ?array $scopedIds): int
    {
        $query = Project::query()
            ->where(function ($q) use ($since): void {
                $q->where(function ($b) use ($since): void {
                    $b->whereNotNull('last_heartbeat_at')
                        ->where('last_heartbeat_at', '>=', $since);
                })
                    ->orWhereHas('requests', fn ($r) => $r->where('sent_at', '>=', $since))
                    ->orWhereHas('exceptions', fn ($e) => $e->where('sent_at', '>=', $since))
                    ->orWhereHas('logs', fn ($l) => $l->where('sent_at', '>=', $since));
            });

        if ($scopedIds !== null) {
            $query->whereIn('id', $scopedIds);
        }

        return $query->count();
    }

    private function compute(DashboardFilters $filters, ?array $teamProjectIds): array
    {
        $since24h = CarbonImmutable::now()->subHours(24);
        $since7d = CarbonImmutable::now()->subDays(7)->startOfDay();

        $scopedIds = $this->resolveScopedIds($filters, $teamProjectIds);

        $stats = $this->buildStats($since24h, $filters, $scopedIds);
        $recent_projects = $this->buildProjectList($since24h, $filters, $scopedIds);

        $incidentFlow = $this->hourlyExceptionSeries($since24h, $scopedIds);
        $incidentVolume = array_map(fn (array $row) => [
            'time' => $row['time'],
            'errors' => $row['exceptions'],
            'warnings' => $row['warnings'],
        ], $incidentFlow);

        $throughputChart = $this->hourlyRequestCountSeries($since24h, $scopedIds);
        $runningChecksChart = $this->hourlyDistinctProjectsWithRequests($since24h, $scopedIds);
        $bugsChart = $this->dailyExceptionCountSeries(7, $since7d, $scopedIds);

        return [
            'stats' => $stats,
            'recent_projects' => $recent_projects,
            'incident_flow' => $incidentFlow,
            'incident_volume' => $incidentVolume,
            'throughput_chart' => $throughputChart,
            'bugs_chart' => $bugsChart,
            'running_checks_chart' => $runningChecksChart,
            'filter_active' => $filters->isActive(),
        ];
    }

    /**
     * @return list<int>
     */
    private function resolveProjectIds(DashboardFilters $filters): array
    {
        return $this->applyProjectFilters(Project::query(), $filters)
            ->pluck('id')
            ->map(static fn ($id) => (int) $id)
            ->all();
    }

    
    private function resolveScopedIds(DashboardFilters $filters, ?array $teamProjectIds): ?array
    {
        if ($teamProjectIds === null) {
            return $filters->isActive() ? $this->resolveProjectIds($filters) : null;
        }

        if ($teamProjectIds === []) {
            return [];
        }

        $baseQuery = Project::query()->whereIn('id', $teamProjectIds);
        
        if ($filters->isActive()) {
            $baseQuery = $this->applyProjectFilters($baseQuery, $filters);
        }

        return $baseQuery->pluck('id')
            ->map(static fn ($id) => (int) $id)
            ->all();
    }

    /**
     * @param  Builder<Project>  $query
     * @return Builder<Project>
     */
    private function applyProjectFilters(Builder $query, DashboardFilters $filters): Builder
    {
        if ($filters->search !== null) {
            $query->where('name', 'like', '%'.$filters->search.'%');
        }

        if ($filters->statuses !== []) {
            $query->whereIn('status', $filters->statuses);
        }

        if ($filters->environments !== []) {
            $query->whereIn('environment', $filters->environments);
        }

        return $query;
    }

    /**
     * @param  list<int>|null  $scopedIds
     * @return array<string, int|float>
     */
    private function buildStats(CarbonImmutable $since24h, DashboardFilters $filters, ?array $scopedIds): array
    {
        $requestStats = $this->scopeByProject(HubRequest::query(), $scopedIds)
            ->where('sent_at', '>=', $since24h)
            ->selectRaw('COUNT(*) as total, AVG(duration_ms) as avg_duration')
            ->first();

        $projectBase = Project::query();
        if ($scopedIds !== null) {
            if ($scopedIds === []) {
                $projectBase->whereRaw('1 = 0');
            } else {
                $projectBase->whereIn('id', $scopedIds);
            }
        } else {
            $projectBase = $this->applyProjectFilters($projectBase, $filters);
        }
        $criticalProjectsQuery = (clone $projectBase)->where('status', 'critical');

        return [
            'total_projects' => $scopedIds !== null ? count($scopedIds) : Project::count(),
            'active_projects' => $this->countProjectsWithTelemetryInWindow($since24h, $scopedIds),
            'critical_projects' => $criticalProjectsQuery->count(),
            'total_exceptions_24h' => $this->scopeByProject(HubException::query(), $scopedIds)
                ->where('sent_at', '>=', $since24h)
                ->count(),
            'total_requests_24h' => (int) ($requestStats->total ?? 0),
            'avg_response_time_24h' => (int) round((float) ($requestStats->avg_duration ?? 0)),
            'failed_jobs_24h' => $this->scopeByProject(HubJob::query(), $scopedIds)
                ->where('sent_at', '>=', $since24h)
                ->where('status', 'failed')
                ->count(),
            'health_check_failures' => $this->scopeByProject(HubHealthCheck::query(), $scopedIds)
                ->where('sent_at', '>=', $since24h)
                ->whereIn('status', ['critical', 'error', 'failed'])
                ->count(),
        ];
    }

    /**
     * @param  list<int>|null  $scopedIds
     * @return list<array<string, mixed>>
     */
    private function buildProjectList(CarbonImmutable $since24h, DashboardFilters $filters, ?array $scopedIds): array
    {
        $query = $this->applyProjectFilters(Project::query(), $filters)
            ->withCount([
                'exceptions as exceptions_24h' => fn ($q) => $q->where('sent_at', '>=', $since24h),
                'requests as requests_24h' => fn ($q) => $q->where('sent_at', '>=', $since24h),
                'logs as logs_24h' => fn ($q) => $q->where('sent_at', '>=', $since24h),
            ])
            ->orderByDesc('last_heartbeat_at')
            ->orderByDesc('id')
            ->limit($filters->isActive() ? self::FILTERED_PROJECTS_LIMIT : 10);

        if ($scopedIds !== null) {
            if ($scopedIds === []) {
                $query->whereRaw('1 = 0');
            } else {
                $query->whereIn('id', $scopedIds);
            }
        }

        return $query->get()
            ->map(fn (Project $p) => [
                'id' => $p->id,
                'name' => $p->name,
                'status' => $p->status,
                'environment' => $p->environment,
                'last_heartbeat_at' => $p->last_heartbeat_at?->toIso8601String(),
                'exceptions_24h' => (int) $p->exceptions_24h,
                'requests_24h' => (int) $p->requests_24h,
                'logs_24h' => (int) $p->logs_24h,
            ])
            ->values()
            ->all();
    }

    /**
     * @template T of \Illuminate\Database\Eloquent\Model
     *
     * @param  Builder<T>  $query
     * @param  list<int>|null  $scopedIds
     * @return Builder<T>
     */
    private function scopeByProject(Builder $query, ?array $scopedIds): Builder
    {
        if ($scopedIds === null) {
            return $query;
        }

        if ($scopedIds === []) {
            return $query->whereRaw('1 = 0');
        }

        return $query->whereIn('project_id', $scopedIds);
    }

    /**
     * @param  list<int>|null  $scopedIds
     * @return list<array{time: string, exceptions: int, warnings: int}>
     */
    private function hourlyExceptionSeries(CarbonImmutable $since24h, ?array $scopedIds): array
    {
        $start = CarbonImmutable::now()->subHours(23)->startOfHour();

        $rows = $this->scopeByProject(HubException::query(), $scopedIds)
            ->where('sent_at', '>=', $since24h)
            ->selectRaw($this->hourlyBucketExpression('sent_at').' as bucket, severity, COUNT(*) as total')
            ->groupBy('bucket', 'severity')
            ->get();

        /** @var array<string, array{errors: int, warnings: int}> $counts */
        $counts = [];
        foreach ($rows as $row) {
            $key = (string) $row->bucket;
            $sev = strtolower((string) $row->severity);
            $total = (int) $row->total;
            $counts[$key] ??= ['errors' => 0, 'warnings' => 0];

            if (in_array($sev, self::WARNING_SEVERITIES, true)) {
                $counts[$key]['warnings'] += $total;
            } else {
                $counts[$key]['errors'] += $total;
            }
        }

        $buckets = [];
        for ($i = 0; $i < 24; $i++) {
            $bucketStart = $start->addHours($i);
            $key = $bucketStart->format('Y-m-d H');
            $row = $counts[$key] ?? ['errors' => 0, 'warnings' => 0];
            $buckets[] = [
                'time' => $bucketStart->format('H:00'),
                'exceptions' => $row['errors'],
                'warnings' => $row['warnings'],
            ];
        }

        return $buckets;
    }

    /**
     * @param  list<int>|null  $scopedIds
     * @return list<array{value: int}>
     */
    private function hourlyRequestCountSeries(CarbonImmutable $since24h, ?array $scopedIds): array
    {
        $start = CarbonImmutable::now()->subHours(23)->startOfHour();

        $rows = $this->scopeByProject(HubRequest::query(), $scopedIds)
            ->where('sent_at', '>=', $since24h)
            ->selectRaw($this->hourlyBucketExpression('sent_at').' as bucket, COUNT(*) as total')
            ->groupBy('bucket')
            ->pluck('total', 'bucket');

        return $this->fillHourlyBuckets($start, 24, fn (string $key) => (int) ($rows[$key] ?? 0));
    }

    /**
     * @param  list<int>|null  $scopedIds
     * @return list<array{value: int}>
     */
    private function hourlyDistinctProjectsWithRequests(CarbonImmutable $since24h, ?array $scopedIds): array
    {
        $start = CarbonImmutable::now()->subHours(23)->startOfHour();

        $rows = $this->scopeByProject(HubRequest::query(), $scopedIds)
            ->where('sent_at', '>=', $since24h)
            ->selectRaw($this->hourlyBucketExpression('sent_at').' as bucket, COUNT(DISTINCT project_id) as total')
            ->groupBy('bucket')
            ->pluck('total', 'bucket');

        return $this->fillHourlyBuckets($start, 24, fn (string $key) => (int) ($rows[$key] ?? 0));
    }

    /**
     * @param  list<int>|null  $scopedIds
     * @return list<array{value: int}>
     */
    private function dailyExceptionCountSeries(int $days, CarbonImmutable $since, ?array $scopedIds): array
    {
        $rows = $this->scopeByProject(HubException::query(), $scopedIds)
            ->where('sent_at', '>=', $since)
            ->selectRaw($this->dailyBucketExpression('sent_at').' as bucket, COUNT(*) as total')
            ->groupBy('bucket')
            ->pluck('total', 'bucket');

        $out = [];
        for ($i = $days - 1; $i >= 0; $i--) {
            $day = CarbonImmutable::now()->subDays($i)->startOfDay();
            $key = $day->format('Y-m-d');
            $out[] = ['value' => (int) ($rows[$key] ?? 0)];
        }

        return $out;
    }

    /**
     * @param  callable(string): int  $valueFor
     * @return list<array{value: int}>
     */
    private function fillHourlyBuckets(CarbonImmutable $start, int $hours, callable $valueFor): array
    {
        $out = [];
        for ($i = 0; $i < $hours; $i++) {
            $bucketStart = $start->addHours($i);
            $out[] = ['value' => $valueFor($bucketStart->format('Y-m-d H'))];
        }

        return $out;
    }

    private function hourlyBucketExpression(string $column): string
    {
        return match (DB::connection()->getDriverName()) {
            'sqlite' => "strftime('%Y-%m-%d %H', {$column})",
            'mysql', 'mariadb' => "DATE_FORMAT({$column}, '%Y-%m-%d %H')",
            'pgsql' => "to_char({$column}, 'YYYY-MM-DD HH24')",
            'sqlsrv' => "FORMAT({$column}, 'yyyy-MM-dd HH')",
            default => "strftime('%Y-%m-%d %H', {$column})",
        };
    }

    private function dailyBucketExpression(string $column): string
    {
        return match (DB::connection()->getDriverName()) {
            'sqlite' => "strftime('%Y-%m-%d', {$column})",
            'mysql', 'mariadb' => "DATE_FORMAT({$column}, '%Y-%m-%d')",
            'pgsql' => "to_char({$column}, 'YYYY-MM-DD')",
            'sqlsrv' => "FORMAT({$column}, 'yyyy-MM-dd')",
            default => "strftime('%Y-%m-%d', {$column})",
        };
    }
}

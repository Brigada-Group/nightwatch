<?php

namespace App\Services;

use App\Models\HubException;
use App\Models\HubHealthCheck;
use App\Models\HubJob;
use App\Models\HubRequest;
use App\Models\Project;
use Carbon\CarbonInterface;
use Illuminate\Support\Collection;

class DashboardMetricsService
{
    private const ERROR_SEVERITIES = ['error', 'critical'];

    private const WARNING_SEVERITIES = ['warning', 'info', 'debug'];

    /**
     * @return array{
     *     stats: array<string, int|float>,
     *     recent_projects: list<array<string, mixed>>,
     *     incident_flow: list<array<string, int|string>>,
     *     incident_volume: list<array<string, int|string>>,
     *     throughput_chart: list<array{value: int}>,
     *     bugs_chart: list<array{value: int}>,
     *     running_checks_chart: list<array{value: int}>
     * }
     */
    public function overview(): array
    {
        $since24h = now()->subHours(24);
        $since7d = now()->subDays(7)->startOfDay();

        $stats = [
            'total_projects' => Project::count(),
            'active_projects' => Project::query()
                ->whereNotNull('last_heartbeat_at')
                ->where('last_heartbeat_at', '>=', $since24h)
                ->count(),
            'critical_projects' => Project::where('status', 'critical')->count(),
            'total_exceptions_24h' => HubException::where('sent_at', '>=', $since24h)->count(),
            'total_requests_24h' => HubRequest::where('sent_at', '>=', $since24h)->count(),
            'avg_response_time_24h' => (int) round(
                (float) (HubRequest::where('sent_at', '>=', $since24h)->avg('duration_ms') ?? 0),
            ),
            'failed_jobs_24h' => HubJob::where('sent_at', '>=', $since24h)->where('status', 'failed')->count(),
            'health_check_failures' => HubHealthCheck::where('sent_at', '>=', $since24h)
                ->whereIn('status', ['critical', 'error', 'failed'])
                ->count(),
        ];

        $recent_projects = Project::query()
            ->withCount([
                'exceptions as exceptions_24h' => fn ($q) => $q->where('sent_at', '>=', $since24h),
                'requests as requests_24h' => fn ($q) => $q->where('sent_at', '>=', $since24h),
            ])
            ->orderByDesc('last_heartbeat_at')
            ->orderByDesc('id')
            ->limit(10)
            ->get()
            ->map(fn (Project $p) => [
                'id' => $p->id,
                'name' => $p->name,
                'status' => $p->status,
                'environment' => $p->environment,
                'last_heartbeat_at' => $p->last_heartbeat_at?->toIso8601String(),
                'exceptions_24h' => (int) $p->exceptions_24h,
                'requests_24h' => (int) $p->requests_24h,
            ])
            ->values()
            ->all();

        $exceptionTimes = HubException::query()
            ->where('sent_at', '>=', $since24h)
            ->get(['sent_at', 'severity']);

        $requestTimes = HubRequest::query()
            ->where('sent_at', '>=', $since24h)
            ->pluck('sent_at');

        $incidentFlow = $this->hourlyExceptionSeries($exceptionTimes);
        $incidentVolume = array_map(fn (array $row) => [
            'time' => $row['time'],
            'errors' => $row['exceptions'],
            'warnings' => $row['warnings'],
        ], $incidentFlow);

        $throughputChart = $this->hourlyCountSeries($requestTimes);
        $runningChecksChart = $this->hourlyDistinctProjectsWithRequests($since24h);

        $exceptionDaily = HubException::query()
            ->where('sent_at', '>=', $since7d)
            ->pluck('sent_at');

        $bugsChart = $this->dailyCountSeries(7, $exceptionDaily);

        return [
            'stats' => $stats,
            'recent_projects' => $recent_projects,
            'incident_flow' => $incidentFlow,
            'incident_volume' => $incidentVolume,
            'throughput_chart' => $throughputChart,
            'bugs_chart' => $bugsChart,
            'running_checks_chart' => $runningChecksChart,
        ];
    }

    
    private function hourlyExceptionSeries(Collection $exceptions): array
    {
        $start = now()->subHours(23)->startOfHour();
        /** @var array<string, array{errors: int, warnings: int}> $counts */
        $counts = [];

        foreach ($exceptions as $ex) {
            $key = $ex->sent_at->copy()->startOfHour()->format('Y-m-d H');
            if (! isset($counts[$key])) {
                $counts[$key] = ['errors' => 0, 'warnings' => 0];
            }
            $sev = strtolower((string) $ex->severity);
            if (in_array($sev, self::ERROR_SEVERITIES, true)) {
                $counts[$key]['errors']++;
            } elseif (in_array($sev, self::WARNING_SEVERITIES, true)) {
                $counts[$key]['warnings']++;
            } else {
                $counts[$key]['errors']++;
            }
        }

        $buckets = [];
        for ($i = 0; $i < 24; $i++) {
            $bucketStart = $start->copy()->addHours($i);
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

    private function hourlyCountSeries(Collection $times): array
    {
        $start = now()->subHours(23)->startOfHour();
        $out = [];

        for ($i = 0; $i < 24; $i++) {
            $bucketStart = $start->copy()->addHours($i);
            $bucketEnd = $bucketStart->copy()->endOfHour();
            $count = $times->filter(
                fn ($t) => $t >= $bucketStart && $t <= $bucketEnd,
            )->count();
            $out[] = ['value' => $count];
        }

        return $out;
    }

    
    private function hourlyDistinctProjectsWithRequests(CarbonInterface $since24h): array
    {
        $rows = HubRequest::query()
            ->where('sent_at', '>=', $since24h)
            ->get(['project_id', 'sent_at']);

        $start = now()->subHours(23)->startOfHour();
        $out = [];

        for ($i = 0; $i < 24; $i++) {
            $bucketStart = $start->copy()->addHours($i);
            $bucketEnd = $bucketStart->copy()->endOfHour();
            $n = $rows
                ->filter(fn ($r) => $r->sent_at >= $bucketStart && $r->sent_at <= $bucketEnd)
                ->pluck('project_id')
                ->unique()
                ->count();
            $out[] = ['value' => $n];
        }

        return $out;
    }

    
    private function dailyCountSeries(int $days, Collection $times): array
    {
        $out = [];
        for ($i = $days - 1; $i >= 0; $i--) {
            $day = now()->subDays($i)->startOfDay();
            $end = $day->copy()->endOfDay();
            $count = $times->filter(fn ($t) => $t >= $day && $t <= $end)->count();
            $out[] = ['value' => $count];
        }

        return $out;
    }
}

<?php

namespace App\Services;

use App\Models\HubRequest;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;

class RequestInsightsService
{
    public const TOP_ENDPOINTS = 10;

    private const PERCENTILE_SAMPLE_CAP = 5000;

    /**
     * Hourly-bucketed counts of 2xx / 3xx / 4xx / 5xx responses.
     *
     * @return list<array{time: string, c2xx: int, c3xx: int, c4xx: int, c5xx: int}>
     */
    public function statusClassSeries(CarbonImmutable $since, ?int $projectId, array $allowedProjectIds): array
    {
        $bucketExpr = InsightsSqlDialect::hourlyBucket('sent_at');

        $records = $this->scope(HubRequest::query(), $projectId, $allowedProjectIds)
            ->where('sent_at', '>=', $since)
            ->selectRaw(
                "{$bucketExpr} as bucket, ".
                'SUM(CASE WHEN status_code BETWEEN 200 AND 299 THEN 1 ELSE 0 END) as c2xx, '.
                'SUM(CASE WHEN status_code BETWEEN 300 AND 399 THEN 1 ELSE 0 END) as c3xx, '.
                'SUM(CASE WHEN status_code BETWEEN 400 AND 499 THEN 1 ELSE 0 END) as c4xx, '.
                'SUM(CASE WHEN status_code >= 500 THEN 1 ELSE 0 END) as c5xx'
            )
            ->groupBy('bucket')
            ->get()
            ->keyBy('bucket');

        $hours = max(1, (int) $since->diffInHours(CarbonImmutable::now()));
        $start = CarbonImmutable::now()->subHours($hours - 1)->startOfHour();

        $out = [];
        for ($i = 0; $i < $hours; $i++) {
            $bucketStart = $start->addHours($i);
            $key = $bucketStart->format('Y-m-d H');
            $row = $records->get($key);
            $out[] = [
                'time' => $bucketStart->format($hours <= 24 ? 'H:00' : 'M j · H:00'),
                'c2xx' => (int) ($row->c2xx ?? 0),
                'c3xx' => (int) ($row->c3xx ?? 0),
                'c4xx' => (int) ($row->c4xx ?? 0),
                'c5xx' => (int) ($row->c5xx ?? 0),
            ];
        }

        return $out;
    }

    /**
     * P50 / P95 / P99 of duration_ms for the top-N endpoints by traffic.
     *
     * Portable approach: pull up to PERCENTILE_SAMPLE_CAP sorted durations per
     * endpoint and compute percentiles in PHP. Keeps the SQL simple and works
     * on sqlite, mysql and postgres.
     *
     * @return list<array{endpoint: string, requests: int, p50: int, p95: int, p99: int, avg: int}>
     */
    public function latencyPercentiles(CarbonImmutable $since, ?int $projectId, array $allowedProjectIds): array
    {
        $endpointExpr = $this->endpointExpression();

        $topEndpoints = $this->scope(HubRequest::query(), $projectId, $allowedProjectIds)
            ->where('sent_at', '>=', $since)
            ->selectRaw("{$endpointExpr} as endpoint, COUNT(*) as cnt, AVG(duration_ms) as avg_ms")
            ->groupBy('endpoint')
            ->orderByDesc('cnt')
            ->limit(self::TOP_ENDPOINTS)
            ->get();

        $out = [];
        foreach ($topEndpoints as $row) {
            $durations = $this->scope(HubRequest::query(), $projectId, $allowedProjectIds)
                ->where('sent_at', '>=', $since)
                ->whereRaw("{$endpointExpr} = ?", [$row->endpoint])
                ->orderBy('duration_ms')
                ->limit(self::PERCENTILE_SAMPLE_CAP)
                ->pluck('duration_ms')
                ->map(fn ($d) => (float) $d)
                ->all();

            if ($durations === []) {
                continue;
            }

            $out[] = [
                'endpoint' => (string) $row->endpoint,
                'requests' => (int) $row->cnt,
                'p50' => $this->percentile($durations, 0.50),
                'p95' => $this->percentile($durations, 0.95),
                'p99' => $this->percentile($durations, 0.99),
                'avg' => (int) round((float) ($row->avg_ms ?? 0)),
            ];
        }

        return $out;
    }

    /**
     * Error counts (status_code >= 400) bucketed into a 7 × 24 grid of
     * day-of-week × hour-of-day. Lets ops spot recurring bad time windows.
     *
     * @return array{
     *     cells: list<array{dow: int, hour: int, errors: int}>,
     *     max: int
     * }
     */
    public function errorHeatmap(CarbonImmutable $since, ?int $projectId, array $allowedProjectIds): array
    {
        $dowExpr = InsightsSqlDialect::dayOfWeek('sent_at');
        $hourExpr = InsightsSqlDialect::hourOfDay('sent_at');

        $rows = $this->scope(HubRequest::query(), $projectId, $allowedProjectIds)
            ->where('sent_at', '>=', $since)
            ->where('status_code', '>=', 400)
            ->selectRaw("{$dowExpr} as dow, {$hourExpr} as hour, COUNT(*) as errors")
            ->groupBy('dow', 'hour')
            ->get();

        /** @var array<string, int> $lookup */
        $lookup = [];
        $max = 0;
        foreach ($rows as $row) {
            $errors = (int) $row->errors;
            $key = ((int) $row->dow).':'.((int) $row->hour);
            $lookup[$key] = $errors;
            $max = max($max, $errors);
        }

        $cells = [];
        for ($dow = 0; $dow < 7; $dow++) {
            for ($hour = 0; $hour < 24; $hour++) {
                $cells[] = [
                    'dow' => $dow,
                    'hour' => $hour,
                    'errors' => $lookup[$dow.':'.$hour] ?? 0,
                ];
            }
        }

        return ['cells' => $cells, 'max' => $max];
    }

    /**
     * Prefer named routes for grouping. Fall back to the raw URI when a
     * request was not bound to a route (health checks, ad-hoc pings).
     */
    private function endpointExpression(): string
    {
        return match (\Illuminate\Support\Facades\DB::connection()->getDriverName()) {
            'mysql', 'mariadb' => "COALESCE(NULLIF(route_name, ''), uri)",
            'pgsql' => "COALESCE(NULLIF(route_name, ''), uri)",
            default => "COALESCE(NULLIF(route_name, ''), uri)",
        };
    }

    /**
     * @param  Builder<HubRequest>  $query
     * @return Builder<HubRequest>
     */
    private function scope(Builder $query, ?int $projectId, array $allowedProjectIds): Builder
    {
        $query->whereIn('project_id', $allowedProjectIds);

        if ($projectId !== null) {
            $query->where('project_id', $projectId);
        }

        return $query;
    }

    /**
     * Linear-interpolation percentile over a pre-sorted numeric list.
     *
     * @param  list<float>  $sorted
     */
    private function percentile(array $sorted, float $p): int
    {
        $n = count($sorted);
        if ($n === 0) {
            return 0;
        }
        if ($n === 1) {
            return (int) round($sorted[0]);
        }

        $rank = $p * ($n - 1);
        $lo = (int) floor($rank);
        $hi = (int) ceil($rank);
        $frac = $rank - $lo;
        $value = $sorted[$lo] + ($sorted[$hi] - $sorted[$lo]) * $frac;

        return (int) round($value);
    }
}

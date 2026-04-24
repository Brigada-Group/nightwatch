<?php

namespace App\Services;

use App\Models\HubJob;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;

class JobInsightsService
{
    public const TOP_JOB_CLASSES = 10;

    private const PERCENTILE_SAMPLE_CAP = 5000;

    /**
     * Hourly completed/failed job counts for a throughput area chart.
     *
     * @return list<array{time: string, completed: int, failed: int}>
     */
    public function throughputSeries(CarbonImmutable $since, ?int $projectId, array $allowedProjectIds): array
    {
        $bucketExpr = InsightsSqlDialect::hourlyBucket('sent_at');

        $records = $this->scope(HubJob::query(), $projectId, $allowedProjectIds)
            ->where('sent_at', '>=', $since)
            ->selectRaw(
                "{$bucketExpr} as bucket, ".
                "SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed, ".
                "SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed"
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
                'completed' => (int) ($row->completed ?? 0),
                'failed' => (int) ($row->failed ?? 0),
            ];
        }

        return $out;
    }

    /**
     * Retry distribution: how many jobs ended up at attempt 1, 2, 3, or 4+,
     * broken down by final status. Lets you see whether retries are saving
     * jobs or just multiplying load.
     *
     * @return list<array{bucket: string, completed: int, failed: int}>
     */
    public function retryDistribution(CarbonImmutable $since, ?int $projectId, array $allowedProjectIds): array
    {
        $bucketExpr = 'CASE WHEN attempt >= 4 THEN 4 ELSE attempt END';

        $rows = $this->scope(HubJob::query(), $projectId, $allowedProjectIds)
            ->where('sent_at', '>=', $since)
            ->whereNotNull('attempt')
            ->selectRaw("{$bucketExpr} as attempt_bucket, status, COUNT(*) as cnt")
            ->groupBy('attempt_bucket', 'status')
            ->get();

        /** @var array<int, array{completed: int, failed: int}> $agg */
        $agg = [1 => ['completed' => 0, 'failed' => 0], 2 => ['completed' => 0, 'failed' => 0], 3 => ['completed' => 0, 'failed' => 0], 4 => ['completed' => 0, 'failed' => 0]];

        foreach ($rows as $row) {
            $bucket = (int) $row->attempt_bucket;
            if (! isset($agg[$bucket])) {
                continue;
            }
            $status = (string) $row->status;
            if ($status === 'completed') {
                $agg[$bucket]['completed'] = (int) $row->cnt;
            } elseif ($status === 'failed') {
                $agg[$bucket]['failed'] = (int) $row->cnt;
            }
        }

        return [
            ['bucket' => 'Attempt 1', 'completed' => $agg[1]['completed'], 'failed' => $agg[1]['failed']],
            ['bucket' => 'Attempt 2', 'completed' => $agg[2]['completed'], 'failed' => $agg[2]['failed']],
            ['bucket' => 'Attempt 3', 'completed' => $agg[3]['completed'], 'failed' => $agg[3]['failed']],
            ['bucket' => 'Attempt 4+', 'completed' => $agg[4]['completed'], 'failed' => $agg[4]['failed']],
        ];
    }

    /**
     * P50 / P95 / P99 of duration_ms for the top-N job classes by volume.
     *
     * @return list<array{job_class: string, runs: int, p50: int, p95: int, p99: int, avg: int}>
     */
    public function durationPercentiles(CarbonImmutable $since, ?int $projectId, array $allowedProjectIds): array
    {
        $topJobs = $this->scope(HubJob::query(), $projectId, $allowedProjectIds)
            ->where('sent_at', '>=', $since)
            ->whereNotNull('duration_ms')
            ->selectRaw('job_class, COUNT(*) as cnt, AVG(duration_ms) as avg_ms')
            ->groupBy('job_class')
            ->orderByDesc('cnt')
            ->limit(self::TOP_JOB_CLASSES)
            ->get();

        $out = [];
        foreach ($topJobs as $row) {
            $durations = $this->scope(HubJob::query(), $projectId, $allowedProjectIds)
                ->where('sent_at', '>=', $since)
                ->where('job_class', $row->job_class)
                ->whereNotNull('duration_ms')
                ->orderBy('duration_ms')
                ->limit(self::PERCENTILE_SAMPLE_CAP)
                ->pluck('duration_ms')
                ->map(fn ($d) => (float) $d)
                ->all();

            if ($durations === []) {
                continue;
            }

            $out[] = [
                'job_class' => (string) $row->job_class,
                'runs' => (int) $row->cnt,
                'p50' => $this->percentile($durations, 0.50),
                'p95' => $this->percentile($durations, 0.95),
                'p99' => $this->percentile($durations, 0.99),
                'avg' => (int) round((float) ($row->avg_ms ?? 0)),
            ];
        }

        return $out;
    }

    /**
     * @param  Builder<HubJob>  $query
     * @return Builder<HubJob>
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

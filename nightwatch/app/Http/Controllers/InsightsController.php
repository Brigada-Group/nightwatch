<?php

namespace App\Http\Controllers;

use App\Http\Support\ProjectFilterOptions;
use App\Services\JobInsightsService;
use App\Services\RequestInsightsService;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Inertia\Response;

class InsightsController extends Controller
{
    private const CACHE_TTL_SECONDS = 10;

    /** @var array<string, int> hours */
    private const WINDOW_HOURS = [
        '24h' => 24,
        '7d' => 24 * 7,
        '30d' => 24 * 30,
    ];

    public function __construct(
        private readonly RequestInsightsService $requestInsights,
        private readonly JobInsightsService $jobInsights,
    ) {}

    public function index(Request $request): Response
    {
        $tab = $request->query('tab') === 'jobs' ? 'jobs' : 'requests';
        $window = $this->resolveWindow($request->query('window'));
        $projectId = $request->filled('project_id') ? $request->integer('project_id') : null;

        $since = CarbonImmutable::now()->subHours(self::WINDOW_HOURS[$window]);

        $cacheKey = sprintf(
            'insights:%s:%s:%s',
            $tab,
            $window,
            $projectId ?? 'all',
        );

        $data = Cache::remember($cacheKey, self::CACHE_TTL_SECONDS, function () use ($tab, $since, $projectId) {
            if ($tab === 'jobs') {
                return [
                    'throughput' => $this->jobInsights->throughputSeries($since, $projectId),
                    'retry_distribution' => $this->jobInsights->retryDistribution($since, $projectId),
                    'job_durations' => $this->jobInsights->durationPercentiles($since, $projectId),
                ];
            }

            return [
                'status_mix' => $this->requestInsights->statusClassSeries($since, $projectId),
                'latency' => $this->requestInsights->latencyPercentiles($since, $projectId),
                'heatmap' => $this->requestInsights->errorHeatmap($since, $projectId),
            ];
        });

        return Inertia::render('insights/index', [
            'tab' => $tab,
            'window' => $window,
            'filters' => [
                'project_id' => $projectId,
                'window' => $window,
                'tab' => $tab,
            ],
            'projectOptions' => ProjectFilterOptions::all(),
            'windowOptions' => array_keys(self::WINDOW_HOURS),
            'data' => $data,
        ]);
    }

    private function resolveWindow(?string $value): string
    {
        if (is_string($value) && isset(self::WINDOW_HOURS[$value])) {
            return $value;
        }

        return '24h';
    }
}

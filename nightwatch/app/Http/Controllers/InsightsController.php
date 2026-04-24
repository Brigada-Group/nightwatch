<?php

namespace App\Http\Controllers;

use App\Http\Support\ProjectFilterOptions;
use App\Services\JobInsightsService;
use App\Services\CurrentTeam;
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
        private readonly CurrentTeam $currentTeam,
    ) {}

    public function index(Request $request): Response
    {
        $team = $this->currentTeam->for($request->user());
        abort_unless($team !== null, 403);

        $teamProjectIds = $team->projects()->pluck('projects.id')->all();
        $tab = $request->query('tab') === 'jobs' ? 'jobs' : 'requests';
        $window = $this->resolveWindow($request->query('window'));
        $projectId = $request->filled('project_id') ? $request->integer('project_id') : null;

        if ($projectId !== null && ! in_array($projectId, $teamProjectIds, true)) {
            $projectId = null;
        }

        $since = CarbonImmutable::now()->subHours(self::WINDOW_HOURS[$window]);

        $cacheKey = sprintf(
            'insights:%s:%s:%s',
            $tab,
            $window,
            $projectId ?? 'all',
        );

        $data = Cache::remember($cacheKey, self::CACHE_TTL_SECONDS, function () use ($tab, $since, $projectId, $teamProjectIds) {
            if ($tab === 'jobs') {
                return [
                    'throughput' => $this->jobInsights->throughputSeries($since, $projectId, $teamProjectIds),
                    'retry_distribution' => $this->jobInsights->retryDistribution($since, $projectId, $teamProjectIds),
                    'job_durations' => $this->jobInsights->durationPercentiles($since, $projectId, $teamProjectIds),
                ];
            }

            return [
                'status_mix' => $this->requestInsights->statusClassSeries($since, $projectId, $teamProjectIds),
                'latency' => $this->requestInsights->latencyPercentiles($since, $projectId, $teamProjectIds),
                'heatmap' => $this->requestInsights->errorHeatmap($since, $projectId, $teamProjectIds),
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
            'projectOptions' => ProjectFilterOptions::forTeam($team),
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

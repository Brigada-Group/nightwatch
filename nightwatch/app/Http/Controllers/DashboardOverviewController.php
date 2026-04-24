<?php

namespace App\Http\Controllers;

use App\Services\DashboardFilters;
use App\Services\DashboardMetricsService;
use App\Services\CurrentTeam;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardOverviewController extends Controller
{
    public function __invoke(
        Request $request,
        DashboardMetricsService $metrics,
        CurrentTeam $currentTeam,
    ): JsonResponse
    {
        $filters = DashboardFilters::fromRequest($request);
        $team = $currentTeam->for($request->user());
        abort_unless($team !== null, 403);
        $teamProjectIds = $team->projects()->pluck('projects.id')
            ->map(static fn ($id) => (int) $id)
            ->all();

        return response()->json($metrics->overview($filters, $teamProjectIds));
    }
}

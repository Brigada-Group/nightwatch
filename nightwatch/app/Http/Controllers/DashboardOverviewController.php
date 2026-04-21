<?php

namespace App\Http\Controllers;

use App\Services\DashboardFilters;
use App\Services\DashboardMetricsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardOverviewController extends Controller
{
    public function __invoke(Request $request, DashboardMetricsService $metrics): JsonResponse
    {
        $filters = DashboardFilters::fromRequest($request);

        return response()->json($metrics->overview($filters));
    }
}

<?php

namespace App\Http\Controllers;

use App\Services\DashboardMetricsService;
use Illuminate\Http\JsonResponse;

class DashboardOverviewController extends Controller
{
    public function __invoke(DashboardMetricsService $metrics): JsonResponse
    {
        return response()->json($metrics->overview());
    }
}

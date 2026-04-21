<?php

use App\Http\Controllers\DashboardOverviewController;
use App\Http\Controllers\ExceptionsController;
use App\Http\Controllers\HubAuditsController;
use App\Http\Controllers\HubCacheController;
use App\Http\Controllers\HubCommandsController;
use App\Http\Controllers\HubHealthChecksController;
use App\Http\Controllers\HubJobsController;
use App\Http\Controllers\HubLogsController;
use App\Http\Controllers\HubMailController;
use App\Http\Controllers\HubNotificationsController;
use App\Http\Controllers\HubOutgoingHttpController;
use App\Http\Controllers\HubQueriesController;
use App\Http\Controllers\HubRequestsController;
use App\Http\Controllers\HubScheduledTasksController;
use App\Http\Controllers\ProjectsController;
use App\Models\Project;
use App\Services\DashboardFilters;
use App\Services\DashboardMetricsService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    if (Auth::check()) {
        return redirect()->route('dashboard');
    }

    return redirect()->route('login');
})->name('home');

Route::middleware(['auth'])->group(function () {
    Route::get('api/project-ids', function () {
        return Project::pluck('id');
    });

    Route::get('api/dashboard', DashboardOverviewController::class)->name('api.dashboard');

    Route::get('dashboard', function (Request $request, DashboardMetricsService $metrics) {
        $filters = DashboardFilters::fromRequest($request);

        return Inertia::render('dashboard', $metrics->overview($filters));
    })->name('dashboard');

    Route::get('projects', [ProjectsController::class, 'index'])->name('projects.index');
    Route::post('projects', [ProjectsController::class, 'store'])->name('projects.store');
    Route::get('projects/{project}', [ProjectsController::class, 'show'])->name('projects.show');
    Route::patch('projects/{project}', [ProjectsController::class, 'update'])->name('projects.update');
    Route::post('projects/{project}/rotate-token', [ProjectsController::class, 'rotateToken'])->name('projects.rotate-token');
    Route::delete('projects/{project}', [ProjectsController::class, 'destroy'])->name('projects.destroy');
    Route::get('exceptions', [ExceptionsController::class, 'index'])->name('exceptions.index');
    Route::get('hub-requests', [HubRequestsController::class, 'index'])->name('hub-requests.index');
    Route::get('queries', [HubQueriesController::class, 'index'])->name('queries.index');
    Route::get('jobs', [HubJobsController::class, 'index'])->name('jobs.index');
    Route::get('logs', [HubLogsController::class, 'index'])->name('logs.index');
    Route::get('outgoing-http', [HubOutgoingHttpController::class, 'index'])->name('outgoing-http.index');
    Route::get('mail', [HubMailController::class, 'index'])->name('mail.index');
    Route::get('notifications', [HubNotificationsController::class, 'index'])->name('notifications.index');
    Route::get('cache', [HubCacheController::class, 'index'])->name('cache.index');
    Route::get('commands', [HubCommandsController::class, 'index'])->name('commands.index');
    Route::get('scheduled-tasks', [HubScheduledTasksController::class, 'index'])->name('scheduled-tasks.index');
    Route::get('health-checks', [HubHealthChecksController::class, 'index'])->name('health-checks.index');
    Route::get('audits', [HubAuditsController::class, 'index'])->name('audits.index');
    Route::get('audits/{type}/{audit}', [HubAuditsController::class, 'show'])
        ->where('type', 'composer|npm')
        ->where('audit', '[0-9]+')
        ->name('audits.show');
});

require __DIR__.'/settings.php';

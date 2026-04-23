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
use App\Http\Controllers\BillingController;
use App\Http\Controllers\ProjectsController;
use App\Http\Controllers\TeamsController;
use App\Models\Project;
use App\Services\DashboardFilters;
use App\Services\DashboardMetricsService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => ! Auth::check(),
    ]);
})->name('home');

Route::prefix('billing')->group(function () {
    Route::get('success', function (Request $request) {
        $transactionId = (string) $request->query('tx', '');

        return $transactionId !== ''
            ? redirect('/paddle/checkout?_ptxn='.$transactionId)
            : redirect()->route('home');
    })->name('billing.success');
});

Route::prefix('paddle')->group(function () {
    Route::get('checkout', function () {
        return Inertia::render('paddle/checkout');
    })->name('paddle.checkout');
});

Route::middleware(['auth'])->group(function () {
    Route::post('billing/subscribe-checkout', [BillingController::class, 'subscribeCheckout'])
        ->name('billing.subscribe-checkout');

    Route::middleware(['subscribed'])->group(function () {
        Route::controller(TeamsController::class)->group(function () {
            Route::get('teams/create', 'create')->name('teams.create');
            Route::post('teams', 'store')->name('teams.store');
            Route::post('teams/{team}/switch', 'switch')->name('teams.switch');
        });
    });
});

Route::middleware(['auth', 'subscribed', 'team'])->group(function () {
    Route::get('api/project-ids', function () {
        return Project::pluck('id');
    });

    Route::get('api/dashboard', DashboardOverviewController::class)->name('api.dashboard');

    Route::get('dashboard', function (Request $request, DashboardMetricsService $metrics) {
        $filters = DashboardFilters::fromRequest($request);

        return Inertia::render('dashboard', $metrics->overview($filters));
    })->name('dashboard');

    Route::controller(ProjectsController::class)->prefix('projects')->group(function () {
        Route::get('/', 'index')->name('projects.index');
        Route::post('/', 'store')->name('projects.store');
        Route::get('{project}', 'show')->name('projects.show');
        Route::patch('{project}', 'update')->name('projects.update');
        Route::post('{project}/rotate-token', 'rotateToken')->name('projects.rotate-token');
        Route::delete('{project}', 'destroy')->name('projects.destroy');
    });

    Route::controller(ExceptionsController::class)->group(function () {
        Route::get('exceptions', 'index')->name('exceptions.index');
    });

    Route::controller(HubRequestsController::class)->group(function () {
        Route::get('hub-requests', 'index')->name('hub-requests.index');
    });

    Route::controller(HubQueriesController::class)->group(function () {
        Route::get('queries', 'index')->name('queries.index');
    });

    Route::controller(HubJobsController::class)->group(function () {
        Route::get('jobs', 'index')->name('jobs.index');
    });

    Route::controller(HubLogsController::class)->group(function () {
        Route::get('logs', 'index')->name('logs.index');
    });

    Route::controller(HubOutgoingHttpController::class)->group(function () {
        Route::get('outgoing-http', 'index')->name('outgoing-http.index');
    });

    Route::controller(HubMailController::class)->group(function () {
        Route::get('mail', 'index')->name('mail.index');
    });

    Route::controller(HubNotificationsController::class)->group(function () {
        Route::get('notifications', 'index')->name('notifications.index');
    });

    Route::controller(HubCacheController::class)->group(function () {
        Route::get('cache', 'index')->name('cache.index');
    });

    Route::controller(HubCommandsController::class)->group(function () {
        Route::get('commands', 'index')->name('commands.index');
    });

    Route::controller(HubScheduledTasksController::class)->group(function () {
        Route::get('scheduled-tasks', 'index')->name('scheduled-tasks.index');
    });

    Route::controller(HubHealthChecksController::class)->group(function () {
        Route::get('health-checks', 'index')->name('health-checks.index');
    });

    Route::controller(HubAuditsController::class)->prefix('audits')->group(function () {
        Route::get('/', 'index')->name('audits.index');
        Route::get('{type}/{audit}', 'show')
            ->where('type', 'composer|npm')
            ->where('audit', '[0-9]+')
            ->name('audits.show');
    });
});

require __DIR__.'/settings.php';

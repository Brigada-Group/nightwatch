<?php

use App\Http\Controllers\AiConfigController;
use App\Http\Controllers\AlertRulesController;
use App\Http\Controllers\BillingController;
use App\Http\Controllers\ClientErrorEventsController;
use App\Http\Controllers\DashboardOverviewController;
use App\Http\Controllers\EmailReportsController;
use App\Http\Controllers\EmailVerificationCodeController;
use App\Http\Controllers\ExceptionAssignmentsController;
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
use App\Http\Controllers\InsightsController;
use App\Http\Controllers\IssueAssignmentsController;
use App\Http\Controllers\IssuesController;
use App\Http\Controllers\ProjectAssignmentsController;
use App\Http\Controllers\ProjectsController;
use App\Http\Controllers\SuperAdminDashboardController;
use App\Http\Controllers\TeamInvitationLinksController;
use App\Http\Controllers\TeamInvitationsController;
use App\Http\Controllers\TeamJoinController;
use App\Http\Controllers\TeamMembersController;
use App\Http\Controllers\TeamPageController;
use App\Http\Controllers\TasksController;
use App\Http\Controllers\TeamProjectAssignmentsController;
use App\Http\Controllers\TeamsController;
use App\Http\Controllers\WebhookDestinationsController;
use App\Models\Project;
use App\Services\CurrentTeam;
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
    Route::get('/email/verify', [EmailVerificationCodeController::class, 'show'])
        ->name('verification.notice');

    Route::post('/email/verify', [EmailVerificationCodeController::class, 'verify'])
        ->middleware(['throttle:12,1'])
        ->name('verification.verify-code');

    Route::post('/email/verify/resend', [EmailVerificationCodeController::class, 'resend'])
        ->middleware(['throttle:12,1'])
        ->name('verification.send');
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::post('billing/subscribe-checkout', [BillingController::class, 'subscribeCheckout'])
        ->name('billing.subscribe-checkout');

    Route::controller(TeamsController::class)->group(function () {
        Route::get('teams/create', 'create')->name('teams.create');
        Route::post('teams', 'store')->name('teams.store');
        Route::post('teams/{team}/switch', 'switch')->name('teams.switch');
    });
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('team/invitations/{token}', function (string $token) {
        return Inertia::render('teams/accept-invite', ['token' => $token]);
    })->name('team.invitations.show');

    Route::post('team/invitations/{token}/accept', [TeamInvitationsController::class, 'accept'])
        ->name('team.invitations.accept');
});

Route::middleware(['auth', 'verified', 'super_admin'])->prefix('super-admin')->group(function () {
    Route::get('dashboard', [SuperAdminDashboardController::class, 'dashboard'])->name('super-admin.dashboard');
    Route::get('external-dependencies', [SuperAdminDashboardController::class, 'externalDependencies'])->name('super-admin.external-dependencies');
    Route::get('teams', [SuperAdminDashboardController::class, 'teams'])->name('super-admin.teams.index');
    Route::get('teams/{team}', [SuperAdminDashboardController::class, 'team'])->name('super-admin.teams.show');
    Route::get('projects', [SuperAdminDashboardController::class, 'projects'])->name('super-admin.projects');
    Route::get('retention-config', [SuperAdminDashboardController::class, 'retentionConfig'])->name('super-admin.retention-config');
    Route::post('retention-details', [SuperAdminDashboardController::class, 'storeRetention'])->name('super-admin.retention.store');
    Route::patch('retention-details/{retentionDetail}', [SuperAdminDashboardController::class, 'updateRetention'])->name('super-admin.retention.update');
    Route::delete('retention-details/{retentionDetail}', [SuperAdminDashboardController::class, 'destroyRetention'])->name('super-admin.retention.destroy');

});

Route::middleware(['auth', 'verified', 'team'])->group(function () {

    Route::controller(TeamInvitationsController::class)->group(function () {
        Route::get('team/invitations/search-users', 'searchUsers')->name('team.invitations.search-users');
        Route::post('team/invitations', 'store')->name('team.invitations.store');
    });

    Route::controller(ProjectAssignmentsController::class)->group(function () {
        Route::post('projects/{project}/assignments', 'store')->name('project.assignments.store');
        Route::delete('projects/{project}/assignments/{user}', 'destroy')->name('project.assignments.destroy');
    });

    Route::get('ai-config', [AiConfigController::class, 'show'])->name('ai-config.show');
    Route::patch('ai-config/{project}', [AiConfigController::class, 'update'])->name('ai-config.update');
});

Route::middleware(['auth', 'verified', 'team'])->group(function () {
    Route::get('api/project-ids', function () {
        return Project::pluck('id');
    });

    Route::get('api/dashboard', DashboardOverviewController::class)->name('api.dashboard');

    Route::get('dashboard', function (Request $request, DashboardMetricsService $metrics, CurrentTeam $currentTeam) {
        $team = $currentTeam->for($request->user());
        abort_unless($team !== null, 403);
        $accessibleProjectIds = $currentTeam->accessibleProjectIdsFor($request->user(), $team);

        $filters = DashboardFilters::fromRequest($request);

        return Inertia::render('dashboard', $metrics->overview($filters, $accessibleProjectIds));
    })->name('dashboard');

    Route::get('insights', [InsightsController::class, 'index'])->name('insights.index');

    Route::get('email-reports', [EmailReportsController::class, 'index'])->name('email-reports.index');
    Route::post('email-reports', [EmailReportsController::class, 'store'])->name('email-reports.store');
    Route::patch('email-reports/{emailReport}', [EmailReportsController::class, 'update'])->name('email-reports.update');
    Route::delete('email-reports/{emailReport}', [EmailReportsController::class, 'destroy'])->name('email-reports.destroy');

    Route::get('webhooks', [WebhookDestinationsController::class, 'index'])->name('webhooks.index');
    Route::post('webhooks', [WebhookDestinationsController::class, 'store'])->name('webhooks.store');
    Route::patch('webhooks/{webhookDestination}', [WebhookDestinationsController::class, 'update'])->name('webhooks.update');
    Route::delete('webhooks/{webhookDestination}', [WebhookDestinationsController::class, 'destroy'])->name('webhooks.destroy');

    Route::controller(AlertRulesController::class)->group(function () {
        Route::get('alert-rules', 'index')->name('alert-rules.index');
        Route::post('alert-rules', 'store')->name('alert-rules.store');
        Route::patch('alert-rules/{alertRule}', 'update')
            ->whereNumber('alertRule')
            ->name('alert-rules.update');
        Route::delete('alert-rules/{alertRule}', 'destroy')
            ->whereNumber('alertRule')
            ->name('alert-rules.destroy');
    });

    Route::controller(ProjectsController::class)->prefix('projects')->group(function () {
        Route::get('/', 'index')->name('projects.index');
        Route::post('/', 'store')->name('projects.store');
        Route::get('{project}', 'show')->name('projects.show');
        Route::patch('{project}', 'update')->name('projects.update');
        Route::post('{project}/rotate-token', 'rotateToken')->name('projects.rotate-token');
        Route::post('{project}/start-verification', 'startVerification')
            ->name('projects.start-verification');
        Route::delete('{project}', 'destroy')->name('projects.destroy');
    });

    Route::controller(ExceptionsController::class)->group(function () {
        Route::get('exceptions', 'index')->name('exceptions.index');
        Route::get('exceptions/{exception}', 'show')
            ->whereNumber('exception')
            ->name('exceptions.show');
    });

    Route::controller(TasksController::class)->group(function () {
        Route::get('tasks', 'index')->name('tasks.index');
        Route::patch('tasks/{exception}/status', 'updateStatus')
            ->whereNumber('exception')
            ->name('tasks.update-status');
        Route::patch('tasks/issues/{issue}/status', 'updateIssueStatus')
            ->whereNumber('issue')
            ->name('tasks.update-issue-status');
    });

    Route::controller(ExceptionAssignmentsController::class)->group(function () {
        Route::get('exceptions/{exception}/assignable-users', 'assignableUsers')
            ->whereNumber('exception')
            ->name('exceptions.assignable-users');
        Route::post('exceptions/{exception}/assign', 'assign')
            ->whereNumber('exception')
            ->name('exceptions.assign');
        Route::delete('exceptions/{exception}/assign', 'unassign')
            ->whereNumber('exception')
            ->name('exceptions.unassign');
    });

    Route::controller(IssuesController::class)->group(function () {
        Route::get('issues', 'index')->name('issues.index');
        Route::get('issues/{issue}', 'show')
            ->whereNumber('issue')
            ->name('issues.show');
    });

    Route::controller(IssueAssignmentsController::class)->group(function () {
        Route::get('issues/{issue}/assignable-users', 'assignableUsers')
            ->whereNumber('issue')
            ->name('issues.assignable-users');
        Route::post('issues/{issue}/assign', 'assign')
            ->whereNumber('issue')
            ->name('issues.assign');
        Route::delete('issues/{issue}/assign', 'unassign')
            ->whereNumber('issue')
            ->name('issues.unassign');
    });

    Route::controller(ClientErrorEventsController::class)->group(function () {
        Route::get('client-errors', 'index')->name('client-errors.index');
        Route::get('client-errors/{clientError}', 'show')
            ->whereNumber('clientError')
            ->name('client-errors.show');
    });

    Route::controller(HubRequestsController::class)->group(function () {
        Route::get('hub-requests', 'index')->name('hub-requests.index');
        Route::get('hub-requests/{hubRequest}', 'show')
            ->whereNumber('hubRequest')
            ->name('hub-requests.show');
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

    Route::get('team', [TeamPageController::class, 'index'])->name('team.index');

    Route::get('team/invitation-links', [TeamInvitationLinksController::class, 'index'])
        ->name('team.invitation-links.index');

    Route::post('team/invitation-links', [TeamInvitationLinksController::class, 'store'])
        ->name('team.invitation-links.store');

    Route::post('team/project-assignments', [TeamProjectAssignmentsController::class, 'sync'])
        ->name('team.project-assignments.sync');

    Route::delete('team/members/{teamMember}', [TeamMembersController::class, 'destroy'])
        ->whereNumber('teamMember')
        ->name('team.members.destroy');

    Route::delete('team/invitation-links/{teamInvitationLink}', [TeamInvitationLinksController::class, 'destroy'])
        ->name('team.invitation-links.destroy');

    Route::delete('team/invitation-links/{teamInvitationLink}/purge', [TeamInvitationLinksController::class, 'purgeRevoked'])
        ->name('team.invitation-links.purge-revoked');
});

Route::middleware(['throttle:120,1'])->group(function () {
    Route::get('join/{token}', [TeamJoinController::class, 'show'])
        ->where('token', '[a-f0-9]{64}')
        ->name('team.join.show');
});

Route::middleware(['auth', 'verified', 'throttle:30,1'])->group(function () {
    Route::post('join/{token}/accept', [TeamJoinController::class, 'accept'])
        ->where('token', '[a-f0-9]{64}')
        ->name('team.join.accept');
});

require __DIR__.'/settings.php';

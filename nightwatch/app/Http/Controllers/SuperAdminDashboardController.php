<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreRetentionDetailRequest;
use App\Http\Requests\UpdateRetentionDetailRequest;
use App\Models\RetentionDetail;
use App\Models\Team;
use App\Services\SuperAdminAnalyticsService;
use App\Services\SuperAdminPlatformService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class SuperAdminDashboardController extends Controller
{
    public function __construct(
        private SuperAdminPlatformService $superAdminPlatform,
        private SuperAdminAnalyticsService $superAdminAnalytics
    ) {}

    public function dashboard(): Response
    {
        return Inertia::render('super-admin/dashboard', array_merge(
            $this->superAdminPlatform->dashboardOverview(),
            ['analytics' => $this->superAdminAnalytics->dashboardAnalytics()]
        ));
    }

    public function externalDependencies(): Response
    {
        return Inertia::render('super-admin/external-dependencies', $this->superAdminAnalytics->externalDependenciesPayload());
    }

    public function teams(): Response
    {
        return Inertia::render('super-admin/teams', $this->superAdminPlatform->teamsDirectory());
    }

    public function team(Team $team): Response
    {
        return Inertia::render('super-admin/team-detail', $this->superAdminPlatform->teamDetailPayload($team));
    }

    public function projects(): RedirectResponse
    {
        return redirect()->route('super-admin.dashboard');
    }

    public function retentionConfig(): Response
    {
        return Inertia::render('super-admin/retention-config', $this->superAdminPlatform->retentionConfigPayload());
    }

    public function storeRetention(StoreRetentionDetailRequest $request): RedirectResponse
    {
        $this->superAdminPlatform->createRetentionDetail($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Retention instance created.')]);

        return to_route('super-admin.retention-config');
    }

    public function updateRetention(UpdateRetentionDetailRequest $request, RetentionDetail $retentionDetail): RedirectResponse
    {
        $this->superAdminPlatform->updateRetentionDetail($retentionDetail, $request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Retention settings updated.')]);

        return to_route('super-admin.retention-config');
    }

    public function destroyRetention(RetentionDetail $retentionDetail): RedirectResponse
    {
        $this->superAdminPlatform->deleteRetentionDetail($retentionDetail);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Retention rule deleted.')]);

        return to_route('super-admin.retention-config');
    }
}

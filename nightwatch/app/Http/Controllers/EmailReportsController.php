<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreEmailReportRequest;
use App\Http\Requests\UpdateEmailReportRequest;
use App\Http\Support\ProjectFilterOptions;
use App\Models\EmailReport;
use App\Services\CurrentTeam;
use App\Services\EmailReportService;
use DateTimeZone;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EmailReportsController extends Controller
{
    public function __construct(
        private readonly EmailReportService $service,
        private readonly CurrentTeam $currentTeam,
    ) {}

    public function index(Request $request): Response
    {
        $team = $this->currentTeam->for($request->user());
        abort_unless($team !== null, 403);

        $reports = EmailReport::query()
            ->where('user_id', $request->user()->id)
            ->orderBy('id')
            ->get();

        return Inertia::render('email-reports/index', [
            'reports' => $reports,
            'projectOptions' => ProjectFilterOptions::forTeam($team),
            'timezones' => DateTimeZone::listIdentifiers(),
            'defaults' => [
                'sections' => EmailReport::DEFAULT_SECTIONS,
                'frequencies' => EmailReport::FREQUENCIES,
            ],
        ]);
    }

    public function store(StoreEmailReportRequest $request): RedirectResponse
    {
        $this->service->createForUser($request->user()->id, $request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Email report scheduled.')]);

        return to_route('email-reports.index');
    }

    public function update(UpdateEmailReportRequest $request, EmailReport $emailReport): RedirectResponse
    {
        $this->authorizeOwner($request, $emailReport);

        $this->service->update($emailReport, $request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Email report updated.')]);

        return to_route('email-reports.index');
    }

    public function destroy(Request $request, EmailReport $emailReport): RedirectResponse
    {
        $this->authorizeOwner($request, $emailReport);

        $this->service->delete($emailReport);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Email report removed.')]);

        return to_route('email-reports.index');
    }

    private function authorizeOwner(Request $request, EmailReport $report): void
    {
        abort_unless($report->user_id === $request->user()?->id, 403);
    }
}

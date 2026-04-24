<?php

namespace App\Http\Controllers;

use App\Http\Support\InertiaPaginator;
use App\Http\Support\ProjectFilterOptions;
use App\Models\HubComposerAudit;
use App\Models\HubNpmAudit;
use App\Services\CurrentTeam;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class HubAuditsController extends Controller
{
    public function __construct(
        private readonly CurrentTeam $currentTeam,
    ) {}

    public function index(Request $request): Response
    {
        $team = $this->currentTeam->for($request->user());
        abort_unless($team !== null, 403);

        $teamProjectIds = $team->projects()->pluck('projects.id');
        $perPage = (int) min(50, max(5, $request->integer('per_page', 15)));
        $tab = $request->query('tab') === 'npm' ? 'npm' : 'composer';
        $projectId = $request->filled('project_id') ? $request->integer('project_id') : null;

        $composerQuery = HubComposerAudit::query()
            ->with(['project:id,name'])
            ->whereIn('project_id', $teamProjectIds)
            ->orderByDesc('sent_at');

        $npmQuery = HubNpmAudit::query()
            ->with(['project:id,name'])
            ->whereIn('project_id', $teamProjectIds)
            ->orderByDesc('sent_at');

        if ($projectId !== null) {
            $composerQuery->where('project_id', $projectId);
            $npmQuery->where('project_id', $projectId);
        }

        $composerPaginator = $composerQuery->paginate($perPage, ['*'], 'composer_page')->withQueryString();
        $npmPaginator = $npmQuery->paginate($perPage, ['*'], 'npm_page')->withQueryString();

        return Inertia::render('audits/index', [
            'composerAudits' => InertiaPaginator::props($composerPaginator),
            'npmAudits' => InertiaPaginator::props($npmPaginator),
            'filters' => [
                'project_id' => $projectId,
                'tab' => $tab,
            ],
            'projectOptions' => ProjectFilterOptions::forTeam($team),
        ]);
    }

    public function show(Request $request, string $type, int $audit): Response
    {
        $team = $this->currentTeam->for($request->user());
        abort_unless($team !== null, 403);

        $model = $type === 'npm'
            ? HubNpmAudit::with('project:id,name,environment,team_id')->findOrFail($audit)
            : HubComposerAudit::with('project:id,name,environment,team_id')->findOrFail($audit);

        abort_unless($model->project?->team_id === $team->id, 404);

        return Inertia::render('audits/show', [
            'type' => $type,
            'audit' => $model,
        ]);
    }
}

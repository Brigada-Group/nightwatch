<?php

namespace App\Http\Controllers;

use App\Http\Support\InertiaPaginator;
use App\Http\Support\ProjectFilterOptions;
use App\Models\ClientErrorEvent;
use App\Models\Project;
use App\Services\CurrentTeam;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ClientErrorEventsController extends Controller
{
    public function __construct(
        private readonly CurrentTeam $currentTeam,
    ) {}

    public function index(Request $request): Response
    {
        $team = $this->currentTeam->for($request->user());
        abort_unless($team !== null, 403);

        $accessibleProjectIds = $this->currentTeam->accessibleProjectIdsFor($request->user(), $team);
        $perPage = (int) min(50, max(5, $request->integer('per_page', 15)));

        $query = ClientErrorEvent::query()
            ->with(['project:id,name,project_uuid'])
            ->whereHas('project', fn ($projectQuery) => $projectQuery->whereIn('id', $accessibleProjectIds))
            ->orderByDesc('occurred_at');

        if ($request->filled('project_id')) {
            $project = Project::query()
                ->whereIn('id', $accessibleProjectIds)
                ->whereKey($request->integer('project_id'))
                ->first();

            if ($project !== null) {
                $query->where('project_id', $project->project_uuid);
            } else {
                $query->whereRaw('1 = 0');
            }
        }

        if ($request->filled('severity')) {
            $query->where('severity', (string) $request->query('severity'));
        }

        if ($request->filled('runtime')) {
            $query->where('runtime', (string) $request->query('runtime'));
        }

        $paginator = $query->paginate($perPage)->withQueryString();

        return Inertia::render('client-errors/index', [
            'clientErrors' => InertiaPaginator::props($paginator),
            'filters' => [
                'project_id' => $request->filled('project_id') ? $request->integer('project_id') : null,
                'severity' => $request->filled('severity') ? (string) $request->query('severity') : null,
                'runtime' => $request->filled('runtime') ? (string) $request->query('runtime') : null,
            ],
            'projectOptions' => ProjectFilterOptions::forIds($team, $accessibleProjectIds),
        ]);
    }

    public function show(Request $request, int $clientError): Response
    {
        $team = $this->currentTeam->for($request->user());
        abort_unless($team !== null, 403);

        $accessibleProjectIds = $this->currentTeam->accessibleProjectIdsFor($request->user(), $team);

        $event = ClientErrorEvent::query()
            ->with(['project:id,name,project_uuid'])
            ->whereHas('project', fn ($projectQuery) => $projectQuery->whereIn('id', $accessibleProjectIds))
            ->findOrFail($clientError);

        return Inertia::render('client-errors/show', [
            'event' => $event,
        ]);
    }
}

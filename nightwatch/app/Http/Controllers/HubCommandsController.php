<?php

namespace App\Http\Controllers;

use App\Http\Support\InertiaPaginator;
use App\Http\Support\ProjectFilterOptions;
use App\Models\HubCommand;
use App\Services\CurrentTeam;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class HubCommandsController extends Controller
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

        $query = HubCommand::query()
            ->with(['project:id,name'])
            ->whereIn('project_id', $accessibleProjectIds)
            ->orderByDesc('sent_at');

        if ($request->filled('project_id')) {
            $query->where('project_id', $request->integer('project_id'));
        }

        $paginator = $query->paginate($perPage)->withQueryString();

        return Inertia::render('commands/index', [
            'commands' => InertiaPaginator::props($paginator),
            'filters' => [
                'project_id' => $request->filled('project_id') ? $request->integer('project_id') : null,
            ],
            'projectOptions' => ProjectFilterOptions::forIds($team, $accessibleProjectIds),
        ]);
    }
}

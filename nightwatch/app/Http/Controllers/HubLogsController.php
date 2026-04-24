<?php

namespace App\Http\Controllers;

use App\Http\Support\InertiaPaginator;
use App\Http\Support\ProjectFilterOptions;
use App\Models\HubLog;
use App\Services\CurrentTeam;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class HubLogsController extends Controller
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

        $query = HubLog::query()
            ->with(['project:id,name'])
            ->whereIn('project_id', $teamProjectIds)
            ->orderByDesc('sent_at');

        if ($request->filled('project_id')) {
            $query->where('project_id', $request->integer('project_id'));
        }

        if ($request->filled('level')) {
            $query->where('level', (string) $request->query('level'));
        }

        $paginator = $query->paginate($perPage)->withQueryString();

        return Inertia::render('logs/index', [
            'logs' => InertiaPaginator::props($paginator),
            'filters' => [
                'project_id' => $request->filled('project_id') ? $request->integer('project_id') : null,
                'level' => $request->filled('level') ? (string) $request->query('level') : null,
            ],
            'projectOptions' => ProjectFilterOptions::forTeam($team),
        ]);
    }
}

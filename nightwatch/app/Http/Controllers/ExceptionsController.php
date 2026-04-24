<?php

namespace App\Http\Controllers;

use App\Http\Support\InertiaPaginator;
use App\Http\Support\ProjectFilterOptions;
use App\Models\HubException;
use App\Services\CurrentTeam;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ExceptionsController extends Controller
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

        $query = HubException::query()
            ->with(['project:id,name'])
            ->whereIn('project_id', $teamProjectIds)
            ->orderByDesc('sent_at');

        if ($request->filled('project_id')) {
            $query->where('project_id', $request->integer('project_id'));
        }

        if ($request->filled('severity')) {
            $query->where('severity', (string) $request->query('severity'));
        }

        $paginator = $query->paginate($perPage)->withQueryString();

        return Inertia::render('exceptions/index', [
            'exceptions' => InertiaPaginator::props($paginator),
            'filters' => [
                'project_id' => $request->filled('project_id') ? $request->integer('project_id') : null,
                'severity' => $request->filled('severity') ? (string) $request->query('severity') : null,
            ],
            'projectOptions' => ProjectFilterOptions::forTeam($team),
        ]);
    }
}

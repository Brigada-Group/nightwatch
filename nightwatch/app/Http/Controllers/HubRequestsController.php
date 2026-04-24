<?php

namespace App\Http\Controllers;

use App\Http\Support\InertiaPaginator;
use App\Http\Support\ProjectFilterOptions;
use App\Models\HubRequest;
use App\Services\CurrentTeam;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class HubRequestsController extends Controller
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

        $query = HubRequest::query()
            ->with(['project:id,name'])
            ->whereIn('project_id', $teamProjectIds)
            ->orderByDesc('sent_at');

        if ($request->filled('project_id')) {
            $query->where('project_id', $request->integer('project_id'));
        }

        if ($request->filled('status_code')) {
            $query->where('status_code', $request->integer('status_code'));
        }

        $paginator = $query->paginate($perPage)->withQueryString();

        return Inertia::render('hub-requests/index', [
            'requests' => InertiaPaginator::props($paginator),
            'filters' => [
                'project_id' => $request->filled('project_id') ? $request->integer('project_id') : null,
                'status_code' => $request->filled('status_code') ? $request->integer('status_code') : null,
            ],
            'projectOptions' => ProjectFilterOptions::forTeam($team),
        ]);
    }
}

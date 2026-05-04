<?php

namespace App\Http\Controllers;

use App\Http\Support\InertiaPaginator;
use App\Http\Support\ProjectFilterOptions;
use App\Models\HubRequest;
use App\Services\CurrentTeam;
use App\Services\TraceTimelineService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class HubRequestsController extends Controller
{
    public function __construct(
        private readonly CurrentTeam $currentTeam,
        private readonly TraceTimelineService $traceTimeline,
    ) {}

    public function index(Request $request): Response
    {
        $team = $this->currentTeam->for($request->user());
        abort_unless($team !== null, 403);

        $accessibleProjectIds = $this->currentTeam->accessibleProjectIdsFor($request->user(), $team);
        $perPage = (int) min(50, max(5, $request->integer('per_page', 15)));

        $query = HubRequest::query()
            ->with(['project:id,name'])
            ->whereIn('project_id', $accessibleProjectIds)
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
            'projectOptions' => ProjectFilterOptions::forIds($team, $accessibleProjectIds),
        ]);
    }

    public function show(Request $request, HubRequest $hubRequest): Response
    {
        $team = $this->currentTeam->for($request->user());
        abort_unless($team !== null, 403);

        $accessibleProjectIds = $this->currentTeam->accessibleProjectIdsFor($request->user(), $team);
        abort_unless(in_array($hubRequest->project_id, $accessibleProjectIds, true), 403);

        $hubRequest->load('project:id,name');

        return Inertia::render('hub-requests/show', [
            'request' => [
                'id' => $hubRequest->id,
                'method' => $hubRequest->method,
                'uri' => $hubRequest->uri,
                'route_name' => $hubRequest->route_name,
                'status_code' => $hubRequest->status_code,
                'duration_ms' => (float) $hubRequest->duration_ms,
                'ip' => $hubRequest->ip,
                'user_id' => $hubRequest->user_id,
                'environment' => $hubRequest->environment,
                'server' => $hubRequest->server,
                'trace_id' => $hubRequest->trace_id,
                'sent_at' => optional($hubRequest->sent_at)?->toIso8601String(),
                'project' => $hubRequest->project ? [
                    'id' => $hubRequest->project->id,
                    'name' => $hubRequest->project->name,
                ] : null,
            ],
            'trace' => $this->traceTimeline->forRequest($hubRequest),
        ]);
    }
}

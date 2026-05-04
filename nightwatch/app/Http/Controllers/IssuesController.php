<?php

namespace App\Http\Controllers;

use App\Http\Support\InertiaPaginator;
use App\Http\Support\ProjectFilterOptions;
use App\Models\HubIssue;
use App\Models\HubQuery;
use App\Models\HubRequest;
use App\Services\CurrentTeam;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class IssuesController extends Controller
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

        $query = HubIssue::query()
            ->with(['project:id,name', 'assignee:id,name,email'])
            ->whereIn('project_id', $accessibleProjectIds)
            ->orderByDesc('last_seen_at');

        if ($request->filled('project_id')) {
            $query->where('project_id', $request->integer('project_id'));
        }

        if ($request->filled('source_type')) {
            $query->where('source_type', (string) $request->query('source_type'));
        }

        if ($request->filled('severity')) {
            $query->where('severity', (string) $request->query('severity'));
        }

        if ($request->filled('task_status')) {
            $value = (string) $request->query('task_status');
            if ($value === 'unassigned') {
                $query->whereNull('task_status');
            } else {
                $query->where('task_status', $value);
            }
        }

        $paginator = $query->paginate($perPage)->withQueryString();

        return Inertia::render('issues/index', [
            'issues' => InertiaPaginator::props($paginator),
            'filters' => [
                'project_id' => $request->filled('project_id') ? $request->integer('project_id') : null,
                'source_type' => $request->filled('source_type') ? (string) $request->query('source_type') : null,
                'severity' => $request->filled('severity') ? (string) $request->query('severity') : null,
                'task_status' => $request->filled('task_status') ? (string) $request->query('task_status') : null,
            ],
            'projectOptions' => ProjectFilterOptions::forIds($team, $accessibleProjectIds),
        ]);
    }

    public function show(Request $request, HubIssue $issue): Response
    {
        $user = $request->user();
        $team = $this->currentTeam->for($user);
        abort_unless($team !== null, 403);

        $accessibleProjectIds = $this->currentTeam->accessibleProjectIdsFor($user, $team);
        abort_unless(in_array($issue->project_id, $accessibleProjectIds, true), 403);

        $issue->load([
            'project:id,name,team_id',
            'assignee:id,name,email',
            'assignedBy:id,name,email',
        ]);

        return Inertia::render('issues/show', [
            'issue' => $this->serialize($issue),
            'source' => $this->loadSource($issue),
        ]);
    }

    private function serialize(HubIssue $issue): array
    {
        return [
            'id' => $issue->id,
            'source_type' => $issue->source_type,
            'source_id' => $issue->source_id,
            'summary' => $issue->summary,
            'severity' => $issue->severity,
            'fingerprint' => $issue->fingerprint,
            'is_recurrence' => (bool) $issue->is_recurrence,
            'recurrence_count' => (int) $issue->recurrence_count,
            'first_seen_at' => $issue->first_seen_at?->toIso8601String(),
            'last_seen_at' => $issue->last_seen_at?->toIso8601String(),
            'task_status' => $issue->task_status,
            'task_finished_at' => $issue->task_finished_at?->toIso8601String(),
            'assigned_at' => $issue->assigned_at?->toIso8601String(),
            'project' => $issue->project
                ? ['id' => $issue->project->id, 'name' => $issue->project->name]
                : null,
            'assignee' => $issue->assignee
                ? [
                    'id' => $issue->assignee->id,
                    'name' => $issue->assignee->name,
                    'email' => $issue->assignee->email,
                ]
                : null,
            'assigned_by' => $issue->assignedBy
                ? [
                    'id' => $issue->assignedBy->id,
                    'name' => $issue->assignedBy->name,
                    'email' => $issue->assignedBy->email,
                ]
                : null,
        ];
    }

    /**
     * Load the most recent occurrence row from the source table so the detail
     * page can show real SQL / URI / duration / file:line context.
     */
    private function loadSource(HubIssue $issue): ?array
    {
        if ($issue->source_type === HubIssue::SOURCE_SLOW_QUERY) {
            $query = HubQuery::query()->find($issue->source_id);
            if ($query === null) return null;

            return [
                'type' => HubIssue::SOURCE_SLOW_QUERY,
                'sql' => $query->sql,
                'duration_ms' => (float) $query->duration_ms,
                'connection' => $query->connection,
                'file' => $query->file,
                'line' => $query->line,
                'is_slow' => (bool) $query->is_slow,
                'is_n_plus_one' => (bool) $query->is_n_plus_one,
                'sent_at' => $query->sent_at?->toIso8601String(),
                'trace_id' => $query->trace_id,
            ];
        }

        if ($issue->source_type === HubIssue::SOURCE_SLOW_REQUEST) {
            $request = HubRequest::query()->find($issue->source_id);
            if ($request === null) return null;

            return [
                'type' => HubIssue::SOURCE_SLOW_REQUEST,
                'method' => $request->method,
                'uri' => $request->uri,
                'route_name' => $request->route_name,
                'status_code' => (int) $request->status_code,
                'duration_ms' => (float) $request->duration_ms,
                'ip' => $request->ip,
                'sent_at' => $request->sent_at?->toIso8601String(),
                'trace_id' => $request->trace_id,
            ];
        }

        return null;
    }
}

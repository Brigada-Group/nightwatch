<?php

namespace App\Http\Controllers;

use App\Models\HubException;
use App\Models\Team;
use App\Services\CurrentTeam;
use App\Services\ExceptionResolutionService;
use App\Services\ExceptionStatService;
use App\Services\ExceptionTaskService;
use App\Services\IssueTaskService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class TasksController extends Controller
{
    public function __construct(
        private readonly CurrentTeam $currentTeam,
        private readonly ExceptionTaskService $tasks,
        private readonly IssueTaskService $issueTasks,
        private readonly ExceptionResolutionService $resolutions,
        private readonly ExceptionStatService $stats,
    ) {}

    public function index(Request $request): Response
    {
        $user = $request->user();
        $team = $this->currentTeam->for($user);
        abort_unless($team !== null, 403);

        $isManager = $this->currentTeam->userCanManageProjects($user, $team);

        return Inertia::render('tasks/index', [
            'view' => $isManager ? 'manager' : 'developer',
            'team' => [
                'id' => $team->id,
                'name' => $team->name,
            ],
            'kanban' => $isManager
                ? null
                : $this->mergeKanbans(
                    $this->tasks->forAssignee($user, $team),
                    $this->issueTasks->forAssignee($user, $team),
                ),
            'assigned' => $isManager
                ? $this->mergeAssignedLists(
                    $this->tasks->forAssigner($user, $team),
                    $this->issueTasks->forAssigner($user, $team),
                )
                : null,
            'stats' => $isManager ? $this->managerStatsFor($team) : null,
        ]);
    }

    /**
     * Merge two kanban payloads (one for exceptions, one for slow_query /
     * slow_request issues). Each column is concatenated; cards keep their
     * own assigned_at order via a stable sort.
     */
    private function mergeKanbans(array $a, array $b): array
    {
        $merged = [];
        foreach ($a as $status => $cards) {
            $combined = array_merge($cards, $b[$status] ?? []);
            usort($combined, function ($x, $y) {
                return strcmp((string) ($y['assigned_at'] ?? ''), (string) ($x['assigned_at'] ?? ''));
            });
            $merged[$status] = $combined;
        }
        return $merged;
    }

    private function mergeAssignedLists(array $a, array $b): array
    {
        $combined = array_merge($a, $b);
        usort($combined, function ($x, $y) {
            return strcmp((string) ($y['assigned_at'] ?? ''), (string) ($x['assigned_at'] ?? ''));
        });
        return $combined;
    }

    /**
     * Compose every stat the manager dashboard needs into a single payload.
     *
     * Kept private and team-scoped because it's not a public API; the only
     * caller is index(). Each shape is locked down by the underlying service
     * methods, so adding/removing a panel only requires touching one method
     * here and one component on the frontend.
     *
     * @return array{
     *     status_counts: array<string, mixed>,
     *     top_resolvers: list<array<string, mixed>>,
     *     weekly_resolutions: list<array<string, mixed>>
     * }
     */
    private function managerStatsFor(Team $team): array
    {
        return [
            'status_counts' => $this->stats->statusCounts($team),
            'top_resolvers' => $this->stats->topResolvers($team, 5),
            'weekly_resolutions' => $this->stats->weeklyResolutions($team, 8),
        ];
    }

    public function updateStatus(Request $request, HubException $exception): JsonResponse
    {
        $user = $request->user();
        $team = $this->currentTeam->for($user);
        abort_unless($team !== null, 403);

        $exception->loadMissing('project:id,team_id');
        abort_unless(
            $exception->project !== null && $exception->project->team_id === $team->id,
            404,
        );

        $data = $request->validate([
            'status' => ['required', 'string', Rule::in(HubException::TASK_STATUSES)],
        ]);

        // Capture the prior state BEFORE the service mutates it, so we can
        // distinguish a real transition into 'finished' from a re-save on
        // the same column (which shouldn't re-notify the assigner).
        $previousStatus = $exception->task_status;

        $updated = $this->tasks->updateStatus($exception, $user, $data['status']);

        if (
            $updated->task_status === HubException::TASK_STATUS_FINISHED
            && $previousStatus !== HubException::TASK_STATUS_FINISHED
        ) {
            $this->resolutions->notifyAssigner($updated);
        }

        return response()->json([
            'data' => [
                'id' => $updated->id,
                'task_status' => $updated->task_status,
            ],
        ]);
    }

    public function updateIssueStatus(Request $request, \App\Models\HubIssue $issue): JsonResponse
    {
        $user = $request->user();
        $team = $this->currentTeam->for($user);
        abort_unless($team !== null, 403);

        $issue->loadMissing('project:id,team_id');
        abort_unless(
            $issue->project !== null && $issue->project->team_id === $team->id,
            404,
        );

        $data = $request->validate([
            'status' => ['required', 'string', Rule::in(\App\Models\HubIssue::TASK_STATUSES)],
        ]);

        $updated = $this->issueTasks->updateStatus($issue, $user, $data['status']);

        return response()->json([
            'data' => [
                'id' => $updated->id,
                'task_status' => $updated->task_status,
            ],
        ]);
    }
}

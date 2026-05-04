<?php

namespace App\Http\Controllers;

use App\Http\Requests\AssignIssueRequest;
use App\Models\HubIssue;
use App\Models\User;
use App\Services\CurrentTeam;
use App\Services\IssueAssigneeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class IssueAssignmentsController extends Controller
{
    public function __construct(
        private readonly CurrentTeam $currentTeam,
        private readonly IssueAssigneeService $assignees,
    ) {}

    public function assignableUsers(Request $request, HubIssue $issue): JsonResponse
    {
        $team = $this->scopedTeamFor($request, $issue);

        $users = $this->assignees->assignableUsersFor($issue, $team);

        return response()->json([
            'data' => $users->map(static fn ($user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ])->values()->all(),
        ]);
    }

    public function assign(AssignIssueRequest $request, HubIssue $issue): JsonResponse
    {
        $actor = $request->user();
        $team = $this->scopedTeamFor($request, $issue);

        $assignee = User::query()->findOrFail($request->validated('user_id'));

        $this->assignees->assign($issue, $assignee, $actor, $team);

        $issue->load(['assignee:id,name,email']);

        return response()->json([
            'data' => [
                'id' => $issue->id,
                'assigned_at' => $issue->assigned_at?->toIso8601String(),
                'assignee' => $issue->assignee
                    ? [
                        'id' => $issue->assignee->id,
                        'name' => $issue->assignee->name,
                        'email' => $issue->assignee->email,
                    ]
                    : null,
            ],
        ]);
    }

    public function unassign(Request $request, HubIssue $issue): JsonResponse
    {
        $this->scopedTeamFor($request, $issue);

        $this->assignees->unassign($issue);

        return response()->json([
            'data' => [
                'id' => $issue->id,
                'assigned_at' => null,
                'assignee' => null,
            ],
        ]);
    }

    private function scopedTeamFor(Request $request, HubIssue $issue)
    {
        $team = $this->currentTeam->for($request->user());
        abort_unless($team !== null, 403);

        $issue->loadMissing('project:id,team_id');
        abort_unless(
            $issue->project !== null && $issue->project->team_id === $team->id,
            404,
        );

        return $team;
    }
}

<?php

namespace App\Http\Controllers;

use App\Http\Requests\AssignExceptionRequest;
use App\Models\HubException;
use App\Models\User;
use App\Services\CurrentTeam;
use App\Services\ExceptionAssigneeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ExceptionAssignmentsController extends Controller
{
    public function __construct(
        private readonly CurrentTeam $currentTeam,
        private readonly ExceptionAssigneeService $assignees,
    ) {}

    public function assignableUsers(Request $request, HubException $exception): JsonResponse
    {
        $team = $this->scopedTeamFor($request, $exception);

        $users = $this->assignees->assignableUsersFor($exception, $team);

        return response()->json([
            'data' => $users->map(static fn ($user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ])->values()->all(),
        ]);
    }

    public function assign(AssignExceptionRequest $request, HubException $exception): JsonResponse
    {
        $actor = $request->user();
        $team = $this->scopedTeamFor($request, $exception);

        $assignee = User::query()->findOrFail($request->validated('user_id'));

        $this->assignees->assign($exception, $assignee, $actor, $team);

        $exception->load(['assignee:id,name,email']);

        return response()->json([
            'data' => [
                'id' => $exception->id,
                'assigned_at' => $exception->assigned_at?->toIso8601String(),
                'assignee' => $exception->assignee
                    ? [
                        'id' => $exception->assignee->id,
                        'name' => $exception->assignee->name,
                        'email' => $exception->assignee->email,
                    ]
                    : null,
            ],
        ]);
    }

    public function unassign(Request $request, HubException $exception): JsonResponse
    {
        // Reuses the same team-scope check as assign() so a user can't
        // unassign someone from another team's exception by guessing IDs.
        $this->scopedTeamFor($request, $exception);

        $this->assignees->unassign($exception);

        return response()->json([
            'data' => [
                'id' => $exception->id,
                'assigned_at' => null,
                'assignee' => null,
            ],
        ]);
    }

    /**
     * Resolve and validate the team that owns this exception. Returns the
     * actor's current team or aborts when the exception isn't part of it.
     */
    private function scopedTeamFor(Request $request, HubException $exception)
    {
        $team = $this->currentTeam->for($request->user());
        abort_unless($team !== null, 403);

        $exception->loadMissing('project:id,team_id');
        abort_unless(
            $exception->project !== null && $exception->project->team_id === $team->id,
            404,
        );

        return $team;
    }
}

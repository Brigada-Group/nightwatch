<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\Role;
use App\Models\User;
use App\Services\CurrentTeam;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProjectAssignmentsController extends Controller
{
    public function __construct(private readonly CurrentTeam $currentTeam) {}

    public function store(Project $project, Request $request): JsonResponse
    {
        $this->authorize('update', $project);

        $data = $request->validate([
            'user_id' => ['required', 'integer', 'exists:users,id'],
        ]);

        $team = $this->currentTeam->for($request->user());
        abort_unless($team && $team->id === $project->team_id, 403);

        $isTeamMember = $team->members()
            ->where('user_id', $data['user_id'])
            ->where('status', 'accepted')
            ->exists();
        abort_unless($isTeamMember, 422);

        $project->assignees()->syncWithoutDetaching([
            $data['user_id'] => ['assigned_by' => $request->user()->id],
        ]);

        return response()->json(['ok' => true]);
    }

    public function destroy(Project $project, User $user, Request $request): JsonResponse
    {
        $this->authorize('update', $project);
        $project->assignees()->detach($user->id);

        return response()->json(['ok' => true]);
    }
}
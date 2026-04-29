<?php

namespace App\Http\Controllers;

use App\Http\Requests\SyncTeamMemberProjectAssignmentsRequest;
use App\Models\User;
use App\Services\CurrentTeam;
use App\Services\TeamProjectAssignmentService;
use Illuminate\Http\RedirectResponse;

class TeamProjectAssignmentsController extends Controller
{
    public function __construct(
        private readonly CurrentTeam $currentTeam,
        private readonly TeamProjectAssignmentService $assignments,
    ) {}

    public function sync(SyncTeamMemberProjectAssignmentsRequest $request): RedirectResponse
    {
        $actor = $request->user();
        $team = $this->currentTeam->for($actor);
        abort_unless($team !== null, 403);
        abort_unless($this->currentTeam->userCanManageProjects($actor, $team), 403);

        $data = $request->validated();
        $member = User::query()->findOrFail($data['user_id']);

        $this->assignments->syncUserAssignmentsForTeam(
            $member,
            $team,
            $data['project_ids'] ?? [],
            $actor,
        );

        return back();
    }
}

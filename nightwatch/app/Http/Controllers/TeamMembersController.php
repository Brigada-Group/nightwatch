<?php

namespace App\Http\Controllers;

use App\Models\TeamMember;
use App\Services\CurrentTeam;
use App\Services\TeamMembershipService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TeamMembersController extends Controller
{
    public function __construct(
        private readonly CurrentTeam $currentTeam,
        private readonly TeamMembershipService $memberships,
    ) {}

    public function destroy(Request $request, TeamMember $teamMember): RedirectResponse
    {
        $actor = $request->user();
        $team = $this->currentTeam->for($actor);

        // Standard team-scope guards. Order matters: team must exist, then
        // the member must belong to it, then the actor must be allowed to
        // manage it.
        abort_unless($team !== null, 403);
        abort_unless($teamMember->team_id === $team->id, 404);
        abort_unless($this->currentTeam->userCanManageProjects($actor, $team), 403);

        // Two safeguards specific to "remove a teammate":
        //   - The team owner is never removable from their own team.
        //   - The actor cannot self-remove via this endpoint (a future
        //     "leave team" feature would handle that case explicitly).
        abort_if(
            $teamMember->user_id === $team->admin_id,
            422,
            __('You cannot remove the team owner from the team.'),
        );
        abort_if(
            $teamMember->user_id === $actor->id,
            422,
            __('You cannot remove yourself from the team.'),
        );

        $this->memberships->remove($teamMember);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('Team member removed.'),
        ]);

        return back();
    }
}

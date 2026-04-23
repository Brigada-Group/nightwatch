<?php

namespace App\Services;

use App\Models\Role;
use App\Models\Team;
use App\Models\TeamMember;
use App\Models\User;

class CurrentTeam
{
    public const SESSION_KEY = 'current_team_id';

    /**
     * Resolve the team the user is currently acting in. Uses the session value
     * when it points at a team the user still belongs to, otherwise falls back
     * to their earliest accepted membership.
     */
    public function for(User $user): ?Team
    {
        $sessionTeamId = session()->get(self::SESSION_KEY);

        if ($sessionTeamId !== null) {
            $team = $this->acceptedTeam($user, (int) $sessionTeamId);

            if ($team !== null) {
                return $team;
            }

            session()->forget(self::SESSION_KEY);
        }

        return $this->fallbackTeam($user);
    }

    /**
     * Store the user's active team in the session. The membership check here
     * is the final gate — never trust a caller to have validated it.
     */
    public function set(User $user, Team $team): bool
    {
        if (! $this->userCanAccess($user, $team)) {
            return false;
        }

        session()->put(self::SESSION_KEY, $team->id);

        return true;
    }

    public function clear(): void
    {
        session()->forget(self::SESSION_KEY);
    }

    /**
     * Role slug for the given user within the given team, or null if the user
     * is not an accepted member.
     */
    public function roleFor(User $user, Team $team): ?string
    {
        $membership = $user->teamMemberships()
            ->where('team_id', $team->id)
            ->where('status', TeamMember::STATUS_ACCEPTED)
            ->with('role:id,slug')
            ->first();

        return $membership?->role?->slug;
    }

    public function userCanManageProjects(User $user, Team $team): bool
    {
        return in_array(
            $this->roleFor($user, $team),
            [Role::ADMIN, Role::PROJECT_MANAGER],
            true,
        );
    }

    private function acceptedTeam(User $user, int $teamId): ?Team
    {
        return $user->teams()
            ->wherePivot('status', TeamMember::STATUS_ACCEPTED)
            ->where('teams.id', $teamId)
            ->first();
    }

    private function fallbackTeam(User $user): ?Team
    {
        return $user->teams()
            ->wherePivot('status', TeamMember::STATUS_ACCEPTED)
            ->orderBy('team_members.accepted_at')
            ->orderBy('teams.id')
            ->first();
    }

    private function userCanAccess(User $user, Team $team): bool
    {
        return $user->teamMemberships()
            ->where('team_id', $team->id)
            ->where('status', TeamMember::STATUS_ACCEPTED)
            ->exists();
    }
}

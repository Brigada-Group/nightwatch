<?php

namespace App\Policies;

use App\Models\Project;
use App\Models\Role;
use App\Models\Team;
use App\Models\TeamMember;
use App\Models\User;
use App\Services\CurrentTeam;

class ProjectPolicy
{
    public function __construct(
        private readonly CurrentTeam $currentTeam,
    ) {}

    public function view(User $user, Project $project): bool
    {
        return $this->isAcceptedMember($user, $project->team_id);
    }

    public function create(User $user): bool
    {
        $team = $this->currentTeam->for($user);

        if ($team === null) {
            return false;
        }

        return $this->hasManagingRole($user, $team->id);
    }

    public function update(User $user, Project $project): bool
    {
        return $this->hasManagingRole($user, $project->team_id);
    }

    public function delete(User $user, Project $project): bool
    {
        return $this->hasManagingRole($user, $project->team_id);
    }

    private function isAcceptedMember(User $user, int $teamId): bool
    {
        $team = Team::query()->find($teamId);

        if ($team?->admin_id === $user->id) {
            return true;
        }

        return $user->teamMemberships()
            ->where('team_id', $teamId)
            ->where('status', TeamMember::STATUS_ACCEPTED)
            ->exists();
    }

    private function hasManagingRole(User $user, int $teamId): bool
    {
        $team = Team::query()->find($teamId);

        if ($team?->admin_id === $user->id) {
            return true;
        }

        return $user->teamMemberships()
            ->where('team_id', $teamId)
            ->where('status', TeamMember::STATUS_ACCEPTED)
            ->whereHas('role', fn ($q) => $q->whereIn('slug', [
                Role::ADMIN,
                Role::PROJECT_MANAGER,
            ]))
            ->exists();
    }
}

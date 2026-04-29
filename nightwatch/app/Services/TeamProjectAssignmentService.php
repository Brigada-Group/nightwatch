<?php

namespace App\Services;

use App\Models\Project;
use App\Models\Team;
use App\Models\TeamMember;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class TeamProjectAssignmentService
{
    public function attachUserToTeamProjects(
        User $member,
        Team $team,
        array $projectIds,
        User $assignedBy,
    ): void {
        $ids = $this->projectIdsOwnedByTeam($team, $projectIds);

        if ($ids === []) {
            return;
        }

        $this->assertAcceptedTeamMember($member, $team);

        DB::transaction(function () use ($member, $ids, $assignedBy): void {
            foreach ($ids as $projectId) {
                Project::query()->findOrFail($projectId)->assignees()->syncWithoutDetaching([
                    $member->id => ['assigned_by' => $assignedBy->id],
                ]);
            }
        });
    }

    public function syncUserAssignmentsForTeam(
        User $member,
        Team $team,
        array $projectIds,
        User $assignedBy,
    ): void {
        $this->assertAcceptedTeamMember($member, $team);

        $desired = $this->projectIdsOwnedByTeam($team, $projectIds);
        $teamProjectIds = $team->projects()->pluck('projects.id')->map(static fn ($id) => (int) $id)->all();

        DB::transaction(function () use ($member, $desired, $teamProjectIds, $assignedBy): void {
            foreach ($teamProjectIds as $projectId) {
                $project = Project::query()->findOrFail($projectId);

                if (in_array($projectId, $desired, true)) {
                    $project->assignees()->syncWithoutDetaching([
                        $member->id => ['assigned_by' => $assignedBy->id],
                    ]);
                } else {
                    $project->assignees()->detach($member->id);
                }
            }
        });
    }

    public function projectIdsOwnedByTeam(Team $team, array $projectIds): array
    {
        $ids = [];

        foreach ($projectIds as $id) {
            if (is_numeric($id)) {
                $ids[] = (int) $id;
            }
        }

        $ids = array_values(array_unique($ids));

        if ($ids === []) {
            return [];
        }

        return $team->projects()->whereIn('projects.id', $ids)->pluck('projects.id')->map(static fn ($id) => (int) $id)->values()->all();
    }

    private function assertAcceptedTeamMember(User $member, Team $team): void
    {
        $ok = TeamMember::query()
            ->where('team_id', $team->id)
            ->where('user_id', $member->id)
            ->where('status', TeamMember::STATUS_ACCEPTED)
            ->exists();

        abort_unless($ok, 422, __('That user is not an accepted member of this team.'));
    }
}

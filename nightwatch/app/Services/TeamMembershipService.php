<?php

namespace App\Services;

use App\Models\HubException;
use App\Models\Project;
use App\Models\TeamMember;
use Illuminate\Support\Facades\DB;

/**
 * Lifecycle operations on team_members rows. Kept narrow on purpose so
 * the controller stays free of persistence concerns and other consumers
 * (e.g. an eventual "leave team" feature initiated by the member
 * themselves) can call the same primitive.
 */
class TeamMembershipService
{
    /**
     * Soft-revoke a membership: flip its status to "revoked" AND clear any
     * exception assignments the member has within the team's projects so
     * they don't reappear if the user is later re-invited. We deliberately
     * keep the hub_exceptions rows themselves — only the assignment fields
     * are dissolved. History (project_id, fingerprint, severity, etc.)
     * stays intact for audit.
     *
     * Authorization (only team admins, never the team owner, never the
     * actor themselves) is the controller's job.
     */
    public function remove(TeamMember $member): void
    {
        DB::transaction(function () use ($member): void {
            if ($member->user_id !== null) {
                $teamProjectIds = Project::query()
                    ->where('team_id', $member->team_id)
                    ->pluck('id')
                    ->all();

                if ($teamProjectIds !== []) {
                    HubException::query()
                        ->whereIn('project_id', $teamProjectIds)
                        ->where('assigned_to', $member->user_id)
                        ->update([
                            'assigned_to' => null,
                            'assigned_by' => null,
                            'assigned_at' => null,
                            'task_status' => null,
                            'task_finished_at' => null,
                        ]);
                }
            }

            $member->update([
                'status' => TeamMember::STATUS_REVOKED,
            ]);
        });
    }
}

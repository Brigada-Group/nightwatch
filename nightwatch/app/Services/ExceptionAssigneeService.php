<?php

namespace App\Services;

use App\Mail\ExceptionAssignedMail;
use App\Models\HubException;
use App\Models\Team;
use App\Models\TeamMember;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;

class ExceptionAssigneeService
{
    /**
     * Resolve the users that may be assigned to a given exception within a team.
     *
     * Eligibility rules (the dropdown contents):
     *   1. Accepted member of the team that owns the exception's project, AND
     *   2. Either assigned to that exception's project,
     *      OR not assigned to any of the team's projects (interpreted as
     *      "implicit access to all projects").
     *
     * @return Collection<int, User>
     */
    public function assignableUsersFor(HubException $exception, Team $team): Collection
    {
        $teamProjectIds = $team->projects()
            ->pluck('projects.id')
            ->map(static fn ($id) => (int) $id)
            ->all();

        if ($teamProjectIds === []) {
            return collect();
        }

        $acceptedMemberIds = TeamMember::query()
            ->where('team_id', $team->id)
            ->where('status', TeamMember::STATUS_ACCEPTED)
            ->pluck('user_id')
            ->map(static fn ($id) => (int) $id)
            ->all();

        if ($acceptedMemberIds === []) {
            return collect();
        }

        return User::query()
            ->whereIn('id', $acceptedMemberIds)
            ->where(function ($query) use ($exception, $teamProjectIds): void {
                $query->whereExists(function ($sub) use ($exception): void {
                    $sub->select(DB::raw(1))
                        ->from('project_user_assignments')
                        ->whereColumn('project_user_assignments.user_id', 'users.id')
                        ->where('project_user_assignments.project_id', $exception->project_id);
                })->orWhereNotExists(function ($sub) use ($teamProjectIds): void {
                    $sub->select(DB::raw(1))
                        ->from('project_user_assignments')
                        ->whereColumn('project_user_assignments.user_id', 'users.id')
                        ->whereIn('project_user_assignments.project_id', $teamProjectIds);
                });
            })
            ->orderBy('name')
            ->get(['id', 'name', 'email']);
    }

    /**
     * Verify a candidate is eligible to be assigned, then persist + notify.
     */
    public function assign(
        HubException $exception,
        User $assignee,
        User $actor,
        Team $team,
    ): HubException {
        $eligible = $this->assignableUsersFor($exception, $team)
            ->contains(fn (User $u) => $u->id === $assignee->id);

        abort_unless($eligible, 422, __('That user cannot be assigned to this exception.'));

        DB::transaction(function () use ($exception, $assignee, $actor): void {
            $exception->forceFill([
                'assigned_to' => $assignee->id,
                'assigned_by' => $actor->id,
                'assigned_at' => now(),
            ])->save();
        });

        $this->notify($exception->fresh(['project', 'assignee', 'assignedBy']), $assignee, $actor, $team);

        return $exception->refresh();
    }

    /**
     * Send the assignment notification. Failures are reported but don't roll
     * back the assignment — the row already records the change.
     */
    private function notify(HubException $exception, User $assignee, User $actor, Team $team): void
    {
        if (! $exception->relationLoaded('project') || $exception->project === null) {
            return;
        }

        try {
            Mail::to($assignee->email)->send(new ExceptionAssignedMail(
                $exception,
                $exception->project,
                $team,
                $assignee,
                $actor,
            ));
        } catch (\Throwable $e) {
            report($e);
        }
    }
}

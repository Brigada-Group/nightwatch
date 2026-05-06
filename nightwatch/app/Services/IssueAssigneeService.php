<?php

namespace App\Services;

use App\Mail\ExceptionAssignedMail;
use App\Models\HubException;
use App\Models\HubIssue;
use App\Models\Team;
use App\Models\TeamMember;
use App\Models\User;
use App\Services\Ai\SelfHealDispatcher;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;

/**
 * Manual + post-resolution assignment for hub_issues. Mirrors
 * ExceptionAssigneeService line-for-line.
 */
class IssueAssigneeService
{
    public function __construct(
        private readonly SelfHealDispatcher $selfHeal,
    ) {}

    /**
     * @return Collection<int, User>
     */
    public function assignableUsersFor(HubIssue $issue, Team $team): Collection
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
            ->where(function ($query) use ($issue, $teamProjectIds): void {
                $query->whereExists(function ($sub) use ($issue): void {
                    $sub->select(DB::raw(1))
                        ->from('project_user_assignments')
                        ->whereColumn('project_user_assignments.user_id', 'users.id')
                        ->where('project_user_assignments.project_id', $issue->project_id);
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

    public function assign(
        HubIssue $issue,
        User $assignee,
        User $actor,
        Team $team,
    ): HubIssue {
        $eligible = $this->assignableUsersFor($issue, $team)
            ->contains(fn (User $u) => $u->id === $assignee->id);

        abort_unless($eligible, 422, __('That user cannot be assigned to this issue.'));

        DB::transaction(function () use ($issue, $assignee, $actor): void {
            $issue->forceFill([
                'assigned_to' => $assignee->id,
                'assigned_by' => $actor->id,
                'assigned_at' => now(),
                'task_status' => HubIssue::TASK_STATUS_STARTED,
                'task_finished_at' => null,
            ])->save();
        });

        $issue = $issue->fresh(['project', 'assignee', 'assignedBy']);

        $this->notify($issue, $assignee, $actor, $team);

        // Self-heal trigger — see ExceptionAssigneeService::assign for the
        // rationale. No-op when the project's AI config doesn't have both
        // use_ai and self_heal enabled.
        $this->selfHeal->dispatchForIssue($issue);

        return $issue->refresh();
    }

    public function unassign(HubIssue $issue): HubIssue
    {
        DB::transaction(function () use ($issue): void {
            $issue->forceFill([
                'assigned_to' => null,
                'assigned_by' => null,
                'assigned_at' => null,
                'task_status' => null,
                'task_finished_at' => null,
            ])->save();
        });

        return $issue->refresh();
    }

    /**
     * Reuses ExceptionAssignedMail by synthesizing a HubException-shaped
     * surrogate. The mailer reads only the exception_class, message, severity,
     * and project relation, none of which depend on the underlying table.
     */
    private function notify(HubIssue $issue, User $assignee, User $actor, Team $team): void
    {
        if (! $issue->relationLoaded('project') || $issue->project === null) {
            return;
        }

        $surrogate = new HubException();
        $surrogate->id = $issue->id;
        $surrogate->exception_class = $this->labelForSourceType($issue->source_type);
        $surrogate->message = $issue->summary;
        $surrogate->severity = $issue->severity;
        $surrogate->setRelation('project', $issue->project);
        $surrogate->setRelation('assignee', $assignee);

        try {
            Mail::to($assignee->email)->send(new ExceptionAssignedMail(
                $surrogate,
                $issue->project,
                $team,
                $assignee,
                $actor,
            ));
        } catch (\Throwable $e) {
            report($e);
        }
    }

    private function labelForSourceType(string $sourceType): string
    {
        return match ($sourceType) {
            HubIssue::SOURCE_SLOW_QUERY => 'Slow query',
            HubIssue::SOURCE_SLOW_REQUEST => 'Slow request',
            default => 'Issue',
        };
    }
}

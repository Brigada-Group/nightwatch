<?php

namespace App\Services;

use App\Mail\RecurrenceAssignedMail;
use App\Models\AiConfig;
use App\Models\HubIssue;
use App\Models\Role;
use App\Models\TeamMember;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;

/**
 * Issue-style recurrence handling for slow_query / slow_request.
 *
 * Mirrors ExceptionRecurrenceService line-for-line in semantics:
 *   - exactly one row per (project, fingerprint) chain
 *   - duplicate ingest collapses into the existing row, bumping
 *     recurrence_count + setting is_recurrence
 *   - finished issues reopen (status → started, task_finished_at → null,
 *     assigned_at refreshed)
 *   - the freshly-promoted issue row is deleted on collapse
 *   - assignment is preserved across reopen IFF the project's AI config
 *     allows it AND the assignee is still on the team + project
 *
 * The underlying source row in hub_queries / hub_requests is NEVER touched —
 * those are the canonical occurrence log.
 */
class IssueRecurrenceService
{
    public function __construct(
        private readonly IssueFingerprintService $fingerprints,
    ) {}

    /**
     * @return bool  true if the fresh issue row is kept (first occurrence).
     *               false if it was deleted because a chain anchor already
     *               existed — caller should skip post-promotion fan-out.
     */
    public function reconcile(HubIssue $issue): bool
    {
        if ($issue->is_recurrence) {
            return true;
        }

        $kept = true;
        $rowToNotify = null;
        $previouslyFinishedAt = null;

        DB::transaction(function () use (
            $issue,
            &$kept,
            &$rowToNotify,
            &$previouslyFinishedAt,
        ): void {
            $existing = HubIssue::query()
                ->where('project_id', $issue->project_id)
                ->where('fingerprint', $issue->fingerprint)
                ->where('id', '!=', $issue->id)
                ->orderByDesc('id')
                ->lockForUpdate()
                ->first();

            if ($existing === null) {
                return;
            }

            $existing->recurrence_count = (int) $existing->recurrence_count + 1;
            $existing->is_recurrence = true;
            $existing->original_issue_id = null;

            // Refresh denormalized data with the latest occurrence so the
            // detail page / kanban shows current SQL / URI / duration.
            $existing->source_id = $issue->source_id;
            $existing->summary = $issue->summary;
            $existing->severity = $issue->severity;
            $existing->last_seen_at = $issue->last_seen_at ?? now();

            $wasFinished = $existing->task_status === HubIssue::TASK_STATUS_FINISHED;

            if ($wasFinished) {
                $previouslyFinishedAt = $existing->task_finished_at;

                $existing->task_status = HubIssue::TASK_STATUS_STARTED;
                $existing->task_finished_at = null;

                if ($existing->assigned_to !== null && $this->canKeepExistingAssignment($existing)) {
                    $existing->assigned_at = now();
                    $rowToNotify = $existing;
                } else {
                    $existing->assigned_to = null;
                    $existing->assigned_by = null;
                    $existing->assigned_at = null;
                }
            }

            $existing->save();
            $issue->delete();
            $kept = false;
        });

        if ($rowToNotify !== null) {
            $this->notify($rowToNotify, $previouslyFinishedAt);
        }

        return $kept;
    }

    private function canKeepExistingAssignment(HubIssue $row): bool
    {
        if (! $this->projectAllowsAutoAssign($row->project_id)) {
            return false;
        }

        $assignee = User::find($row->assigned_to);
        if ($assignee === null) {
            return false;
        }

        $row->loadMissing('project:id,team_id');
        $teamId = $row->project?->team_id;

        if ($teamId === null) {
            return false;
        }

        return $this->userIsActiveOnProject($assignee, $teamId, $row->project_id);
    }

    private function projectAllowsAutoAssign(int $projectId): bool
    {
        $config = AiConfig::query()
            ->where('project_id', $projectId)
            ->first();

        return $config?->auto_assign_recurrences ?? true;
    }

    private function userIsActiveOnProject(User $user, int $teamId, int $projectId): bool
    {
        $membership = $user->teamMemberships()
            ->where('team_id', $teamId)
            ->where('status', TeamMember::STATUS_ACCEPTED)
            ->with('role:id,slug')
            ->first();

        if ($membership === null) {
            return false;
        }

        $roleSlug = $membership->role?->slug;

        if (in_array($roleSlug, [Role::ADMIN, Role::PROJECT_MANAGER], true)) {
            return true;
        }

        return $user->assignedProjects()
            ->where('projects.id', $projectId)
            ->exists();
    }

    /**
     * Reuses RecurrenceAssignedMail / RecurrenceAssignedNotification by
     * synthesizing a HubException-shaped surrogate from the issue. This
     * avoids forking the mail/notification classes; they only read a few
     * fields and don't care about the underlying DB table.
     */
    private function notify(HubIssue $row, ?\Carbon\CarbonInterface $previouslyFinishedAt): void
    {
        $row->loadMissing(['project', 'project.team', 'assignee']);

        $project = $row->project;
        $team = $project?->team;
        $assignee = $row->assignee;

        if ($project === null || $team === null || $assignee === null) {
            return;
        }

        if (! filter_var($assignee->email, FILTER_VALIDATE_EMAIL)) {
            return;
        }

        $surrogate = new \App\Models\HubException();
        $surrogate->id = $row->id;
        $surrogate->exception_class = $this->labelForSourceType($row->source_type);
        $surrogate->message = $row->summary;
        $surrogate->severity = $row->severity;
        $surrogate->is_recurrence = true;
        $surrogate->recurrence_count = $row->recurrence_count;
        $surrogate->setRelation('project', $project);
        $surrogate->setRelation('assignee', $assignee);

        try {
            Mail::to($assignee->email)->send(new RecurrenceAssignedMail(
                $surrogate,
                $project,
                $team,
                $assignee,
                $previouslyFinishedAt?->toIso8601String(),
            ));
        } catch (\Throwable $e) {
            report($e);
        }

        try {
            $assignee->notify(new \App\Notifications\RecurrenceAssignedNotification(
                exceptionId: $row->id,
                exceptionClass: $this->labelForSourceType($row->source_type),
                projectName: (string) $project->name,
                originalFinishedAt: $previouslyFinishedAt?->toIso8601String(),
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

<?php

namespace App\Services;

use App\Mail\RecurrenceAssignedMail;
use App\Models\AiConfig;
use App\Models\HubException;
use App\Models\Role;
use App\Models\TeamMember;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;

/**
 * Issue-style recurrence handling: there is exactly one row per (project,
 * fingerprint) chain. When a fresh ingest matches the fingerprint of an
 * existing row, we DO NOT create a parallel row — instead we update the
 * existing row in place:
 *
 *   - bump recurrence_count
 *   - mark is_recurrence = true (so the red badge shows)
 *   - if the existing row was finished, reopen it (status → started,
 *     task_finished_at → null, assigned_at refreshed)
 *   - delete the duplicate row that the ingest recorder just inserted
 *
 * The result on the kanban: the developer sees one card per bug, and that
 * card moves between columns as the bug's state changes. No "ghost" finished
 * card sitting next to a started recurrence card for the same exception.
 */
class ExceptionRecurrenceService
{
    public function __construct(
        private readonly ExceptionFingerprintService $fingerprints,
    ) {}

    /**
     * @return bool  true if the fresh ingest row is kept (it was the first
     *               occurrence of this fingerprint). false if the row was
     *               deleted because it was a duplicate of an existing chain
     *               anchor — in that case the caller should skip the
     *               post-ingest fan-out (webhook + broadcast).
     */
    public function reconcile(HubException $exception): bool
    {
        if ($exception->is_recurrence) {
            return true;
        }

        if ($exception->fingerprint === null) {
            $exception->fingerprint = $this->fingerprints->compute(
                $exception->project_id,
                $exception->exception_class,
                $exception->message,
                $exception->file,
                $exception->line,
            );
            $exception->save();
        }

        $kept = true;
        $rowToNotify = null;
        $previouslyFinishedAt = null;

        DB::transaction(function () use (
            $exception,
            &$kept,
            &$rowToNotify,
            &$previouslyFinishedAt,
        ): void {
            // Find the chain anchor for this fingerprint+project. There should
            // be at most one going forward; ordering by id desc plus the
            // is_recurrence flag biases toward the most recently anchored row
            // when legacy data has multiple rows for one fingerprint.
            $existing = HubException::query()
                ->where('project_id', $exception->project_id)
                ->where('fingerprint', $exception->fingerprint)
                ->where('id', '!=', $exception->id)
                ->orderByDesc('id')
                ->lockForUpdate()
                ->first();

            if ($existing === null) {
                // First time we've ever seen this fingerprint in this project.
                // Keep the new row as a normal exception — no recurrence flag.
                return;
            }

            $existing->recurrence_count = (int) $existing->recurrence_count + 1;
            $existing->is_recurrence = true;
            // The row IS the chain anchor in the new model. Any legacy
            // pointer to a separate "original" is meaningless — clear it so
            // the detail page reads the count from this row, not from a
            // stale legacy original whose counter no longer increments.
            $existing->original_exception_id = null;

            $wasFinished = $existing->task_status === HubException::TASK_STATUS_FINISHED;

            if ($wasFinished) {
                $previouslyFinishedAt = $existing->task_finished_at;

                $existing->task_status = HubException::TASK_STATUS_STARTED;
                $existing->task_finished_at = null;

                if ($existing->assigned_to !== null && $this->canKeepExistingAssignment($existing)) {
                    $existing->assigned_at = now();
                    $rowToNotify = $existing;
                } else {
                    // Assignee is gone (off team / off project) or the project
                    // disabled auto-assign — reopen the card unassigned so an
                    // admin can manually pick it up.
                    $existing->assigned_to = null;
                    $existing->assigned_by = null;
                    $existing->assigned_at = null;
                }
            }

            $existing->save();
            $exception->delete();
            $kept = false;
        });

        if ($rowToNotify !== null) {
            $this->notify($rowToNotify, $previouslyFinishedAt);
        }

        return $kept;
    }

    /**
     * Whether the assignee already on the existing row should remain assigned
     * after a recurrence reopens it. Three gates: project setting on, user
     * still exists, user still has team + project access.
     */
    private function canKeepExistingAssignment(HubException $row): bool
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

    private function notify(HubException $row, ?\Carbon\CarbonInterface $previouslyFinishedAt): void
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

        try {
            Mail::to($assignee->email)->send(new RecurrenceAssignedMail(
                $row,
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
                exceptionClass: (string) $row->exception_class,
                projectName: (string) $project->name,
                originalFinishedAt: $previouslyFinishedAt?->toIso8601String(),
            ));
        } catch (\Throwable $e) {
            report($e);
        }
    }
}

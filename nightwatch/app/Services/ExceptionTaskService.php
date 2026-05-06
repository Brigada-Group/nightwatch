<?php

namespace App\Services;

use App\Models\HubException;
use App\Models\Team;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class ExceptionTaskService
{
    /**
     * Kanban payload for the developer view: tasks the user owns, grouped by
     * the four task statuses. Empty groups are still present so the frontend
     * can render the columns without conditional logic.
     *
     * @return array{started: list<array<string, mixed>>, ongoing: list<array<string, mixed>>, review: list<array<string, mixed>>, finished: list<array<string, mixed>>}
     */
    public function forAssignee(User $user, Team $team): array
    {
        $teamProjectIds = $team->projects()
            ->pluck('projects.id')
            ->map(static fn ($id) => (int) $id)
            ->all();

        if ($teamProjectIds === []) {
            return $this->emptyKanban();
        }

        $exceptions = HubException::query()
            ->with([
                'project:id,name',
                'assignedBy:id,name,email',
                'latestAiFixAttempt',
            ])
            ->whereIn('project_id', $teamProjectIds)
            ->where('assigned_to', $user->id)
            ->whereNotNull('assigned_at')
            ->orderByDesc('assigned_at')
            ->get();

        return $this->groupByStatus($exceptions);
    }

    /**
     * Manager view: every exception this user has assigned to someone within
     * the team, regardless of current status. Returned as a flat list so it
     * can drive a table.
     *
     * @return list<array<string, mixed>>
     */
    public function forAssigner(User $user, Team $team): array
    {
        $teamProjectIds = $team->projects()
            ->pluck('projects.id')
            ->map(static fn ($id) => (int) $id)
            ->all();

        if ($teamProjectIds === []) {
            return [];
        }

        return HubException::query()
            ->with([
                'project:id,name',
                'assignee:id,name,email',
            ])
            ->whereIn('project_id', $teamProjectIds)
            ->where('assigned_by', $user->id)
            ->whereNotNull('assigned_at')
            ->orderByDesc('assigned_at')
            ->get()
            ->map(fn (HubException $exception): array => $this->serialize($exception, includeAssignee: true))
            ->values()
            ->all();
    }

    /**
     * Move a task between Kanban columns. Authorization sits here, not in the
     * controller, because this service is the single source of truth for
     * task-state transitions.
     */
    public function updateStatus(HubException $exception, User $actor, string $status): HubException
    {
        if (! in_array($status, HubException::TASK_STATUSES, true)) {
            throw new InvalidArgumentException('Invalid task status: '.$status);
        }

        abort_unless(
            $exception->assigned_to !== null && $exception->assigned_to === $actor->id,
            403,
            __('Only the assignee can update this task.'),
        );

        $previousStatus = $exception->task_status;

        DB::transaction(function () use ($exception, $previousStatus, $status): void {
            $payload = ['task_status' => $status];

            if (
                $status === HubException::TASK_STATUS_FINISHED
                && $previousStatus !== HubException::TASK_STATUS_FINISHED
            ) {
                $payload['task_finished_at'] = now();
            }

            if (
                $status !== HubException::TASK_STATUS_FINISHED
                && $previousStatus === HubException::TASK_STATUS_FINISHED
            ) {
                $payload['task_finished_at'] = null;
            }

            $exception->forceFill($payload)->save();
        });

        return $exception->refresh();
    }

    /**
     * @param  Collection<int, HubException>  $exceptions
     * @return array{started: list<array<string, mixed>>, ongoing: list<array<string, mixed>>, review: list<array<string, mixed>>, finished: list<array<string, mixed>>}
     */
    private function groupByStatus(Collection $exceptions): array
    {
        $kanban = $this->emptyKanban();

        foreach ($exceptions as $exception) {
            $status = $exception->task_status ?? HubException::TASK_STATUS_STARTED;

            if (! array_key_exists($status, $kanban)) {
                $status = HubException::TASK_STATUS_STARTED;
            }

            $kanban[$status][] = $this->serialize($exception, includeAssignee: false);
        }

        return $kanban;
    }

    /**
     * @return array{started: list<array<string, mixed>>, ongoing: list<array<string, mixed>>, review: list<array<string, mixed>>, finished: list<array<string, mixed>>}
     */
    private function emptyKanban(): array
    {
        return [
            HubException::TASK_STATUS_STARTED => [],
            HubException::TASK_STATUS_ONGOING => [],
            HubException::TASK_STATUS_REVIEW => [],
            HubException::TASK_STATUS_FINISHED => [],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function serialize(HubException $exception, bool $includeAssignee): array
    {
        $payload = [
            'id' => $exception->id,
            'source_type' => 'exception',
            'exception_class' => (string) $exception->exception_class,
            'message' => (string) $exception->message,
            'severity' => (string) $exception->severity,
            'environment' => (string) $exception->environment,
            'task_status' => $exception->task_status ?? HubException::TASK_STATUS_STARTED,
            'sent_at' => $exception->sent_at?->toIso8601String(),
            'assigned_at' => $exception->assigned_at?->toIso8601String(),
            'is_recurrence' => (bool) $exception->is_recurrence,
            'project' => $exception->project
                ? ['id' => $exception->project->id, 'name' => $exception->project->name]
                : null,
            'latest_ai_fix_attempt' => $exception->latestAiFixAttempt
                ? [
                    'id' => $exception->latestAiFixAttempt->id,
                    'status' => $exception->latestAiFixAttempt->status,
                    'created_at' => $exception->latestAiFixAttempt->created_at?->toIso8601String(),
                    'error' => $exception->latestAiFixAttempt->error,
                    'result' => $exception->latestAiFixAttempt->result,
                    'applied_at' => $exception->latestAiFixAttempt->applied_at?->toIso8601String(),
                    'apply_pr_url' => $exception->latestAiFixAttempt->apply_pr_url,
                    'apply_pr_number' => $exception->latestAiFixAttempt->apply_pr_number,
                    'apply_branch_name' => $exception->latestAiFixAttempt->apply_branch_name,
                    'apply_error' => $exception->latestAiFixAttempt->apply_error,
                ]
                : null,
        ];

        if ($includeAssignee) {
            $payload['assignee'] = $exception->assignee
                ? [
                    'id' => $exception->assignee->id,
                    'name' => $exception->assignee->name,
                    'email' => $exception->assignee->email,
                ]
                : null;
        } else {
            $payload['assigned_by'] = $exception->assignedBy
                ? [
                    'id' => $exception->assignedBy->id,
                    'name' => $exception->assignedBy->name,
                ]
                : null;
        }

        return $payload;
    }
}

<?php

namespace App\Services;

use App\Models\HubIssue;
use App\Models\Team;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

/**
 * Kanban + status transitions for slow_query / slow_request issues. Mirrors
 * ExceptionTaskService's interface so TasksController can merge results.
 */
class IssueTaskService
{
    /**
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

        $issues = HubIssue::query()
            ->with([
                'project:id,name',
                'assignedBy:id,name,email',
            ])
            ->whereIn('project_id', $teamProjectIds)
            ->where('assigned_to', $user->id)
            ->whereNotNull('assigned_at')
            ->orderByDesc('assigned_at')
            ->get();

        return $this->groupByStatus($issues);
    }

    /**
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

        return HubIssue::query()
            ->with([
                'project:id,name',
                'assignee:id,name,email',
            ])
            ->whereIn('project_id', $teamProjectIds)
            ->where('assigned_by', $user->id)
            ->whereNotNull('assigned_at')
            ->orderByDesc('assigned_at')
            ->get()
            ->map(fn (HubIssue $issue): array => $this->serialize($issue, includeAssignee: true))
            ->values()
            ->all();
    }

    public function updateStatus(HubIssue $issue, User $actor, string $status): HubIssue
    {
        if (! in_array($status, HubIssue::TASK_STATUSES, true)) {
            throw new InvalidArgumentException('Invalid task status: '.$status);
        }

        abort_unless(
            $issue->assigned_to !== null && $issue->assigned_to === $actor->id,
            403,
            __('Only the assignee can update this task.'),
        );

        $previousStatus = $issue->task_status;

        DB::transaction(function () use ($issue, $previousStatus, $status): void {
            $payload = ['task_status' => $status];

            if (
                $status === HubIssue::TASK_STATUS_FINISHED
                && $previousStatus !== HubIssue::TASK_STATUS_FINISHED
            ) {
                $payload['task_finished_at'] = now();
            }

            if (
                $status !== HubIssue::TASK_STATUS_FINISHED
                && $previousStatus === HubIssue::TASK_STATUS_FINISHED
            ) {
                $payload['task_finished_at'] = null;
            }

            $issue->forceFill($payload)->save();
        });

        return $issue->refresh();
    }

    /**
     * @param  Collection<int, HubIssue>  $issues
     */
    private function groupByStatus(Collection $issues): array
    {
        $kanban = $this->emptyKanban();

        foreach ($issues as $issue) {
            $status = $issue->task_status ?? HubIssue::TASK_STATUS_STARTED;

            if (! array_key_exists($status, $kanban)) {
                $status = HubIssue::TASK_STATUS_STARTED;
            }

            $kanban[$status][] = $this->serialize($issue, includeAssignee: false);
        }

        return $kanban;
    }

    private function emptyKanban(): array
    {
        return [
            HubIssue::TASK_STATUS_STARTED => [],
            HubIssue::TASK_STATUS_ONGOING => [],
            HubIssue::TASK_STATUS_REVIEW => [],
            HubIssue::TASK_STATUS_FINISHED => [],
        ];
    }

    /**
     * Serialized in the same shape as ExceptionTaskService's output, with
     * the added discriminator `source_type` so the kanban can route clicks
     * to the right detail page.
     *
     * `exception_class` field is reused as a "kind" label so the same card
     * component can render all three issue types without conditional logic.
     */
    private function serialize(HubIssue $issue, bool $includeAssignee): array
    {
        $payload = [
            'id' => $issue->id,
            'source_type' => $issue->source_type,
            'exception_class' => $this->labelForSourceType($issue->source_type),
            'message' => (string) $issue->summary,
            'severity' => (string) $issue->severity,
            'environment' => null,
            'task_status' => $issue->task_status ?? HubIssue::TASK_STATUS_STARTED,
            'sent_at' => $issue->last_seen_at?->toIso8601String(),
            'assigned_at' => $issue->assigned_at?->toIso8601String(),
            'is_recurrence' => (bool) $issue->is_recurrence,
            'project' => $issue->project
                ? ['id' => $issue->project->id, 'name' => $issue->project->name]
                : null,
        ];

        if ($includeAssignee) {
            $payload['assignee'] = $issue->assignee
                ? [
                    'id' => $issue->assignee->id,
                    'name' => $issue->assignee->name,
                    'email' => $issue->assignee->email,
                ]
                : null;
        } else {
            $payload['assigned_by'] = $issue->assignedBy
                ? [
                    'id' => $issue->assignedBy->id,
                    'name' => $issue->assignedBy->name,
                ]
                : null;
        }

        return $payload;
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

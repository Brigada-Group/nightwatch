<?php

namespace App\Services\Ai;

use App\Jobs\SelfHealTask;
use App\Models\AiFixAttempt;
use App\Models\HubException;
use App\Models\HubIssue;
use App\Models\Project;
use App\Services\AiConfigService;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * System-driven counterpart to AiFixDispatcher. When an exception or issue
 * gets assigned and its project has both `use_ai` and `self_heal` enabled,
 * this class runs the same AI pipeline + auto-applies the result without
 * any human in the loop.
 *
 * Differences from AiFixDispatcher:
 *   - No actor parameter (the system is the requester).
 *   - `requested_by_user_id` on the AiFixAttempt is the assignee, since
 *     they're the implicit beneficiary; events route to their channel.
 *   - Idempotency is stricter: skip if any attempt already exists for the
 *     task (succeeded/applied/failed/active). Self-heal is a one-shot —
 *     re-runs are explicit user actions ("Fix with AI" → accept).
 *   - Pre-stamps task_status to 'ongoing' so the card is never visible in
 *     'started', matching the spec ("we should not even have the card in
 *     the To Be Started state").
 */
class SelfHealDispatcher
{
    public function __construct(
        private readonly AiConfigService $aiConfig,
    ) {}

    public function dispatchForException(HubException $exception): ?AiFixAttempt
    {
        $exception->loadMissing('project');

        return $this->dispatchInternal(
            task: $exception,
            project: $exception->project,
            assigneeId: $exception->assigned_to,
        );
    }

    public function dispatchForIssue(HubIssue $issue): ?AiFixAttempt
    {
        $issue->loadMissing('project');

        return $this->dispatchInternal(
            task: $issue,
            project: $issue->project,
            assigneeId: $issue->assigned_to,
        );
    }

    private function dispatchInternal(
        Model $task,
        ?Project $project,
        ?int $assigneeId,
    ): ?AiFixAttempt {
        if ($project === null || $assigneeId === null) {
            return null;
        }

        $config = $this->aiConfig->forProject($project);

        if (! $config->use_ai || ! $config->self_heal) {
            return null;
        }

        // One-shot guard: skip if there's already any attempt on this task,
        // regardless of state. Manual re-runs (Fix with AI) remain available
        // as the explicit retry path.
        $existing = AiFixAttempt::query()
            ->where('task_type', $task::class)
            ->where('task_id', $task->getKey())
            ->latest('id')
            ->first();

        if ($existing !== null) {
            Log::info('Self-heal: skipping (attempt already exists)', [
                'task_type' => $task::class,
                'task_id' => $task->getKey(),
                'existing_attempt_id' => $existing->id,
                'existing_status' => $existing->status,
            ]);

            return $existing;
        }

        $attempt = DB::transaction(function () use ($task, $project, $assigneeId): AiFixAttempt {
            // Pre-stamp the task to 'ongoing' so the card visibly skips the
            // 'started' column and the developer immediately sees that AI
            // is working on it.
            $task->forceFill([
                'task_status' => 'ongoing',
            ])->save();

            return AiFixAttempt::create([
                'task_type' => $task::class,
                'task_id' => $task->getKey(),
                'project_id' => $project->id,
                'requested_by_user_id' => $assigneeId,
                'status' => AiFixAttempt::STATUS_QUEUED,
            ]);
        });

        SelfHealTask::dispatch($attempt->id);

        Log::info('Self-heal: dispatched', [
            'task_type' => $task::class,
            'task_id' => $task->getKey(),
            'attempt_id' => $attempt->id,
            'project_id' => $project->id,
            'assignee_id' => $assigneeId,
        ]);

        return $attempt;
    }
}

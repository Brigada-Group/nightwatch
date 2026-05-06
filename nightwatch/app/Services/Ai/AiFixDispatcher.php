<?php

namespace App\Services\Ai;

use App\Jobs\RequestAiFix;
use App\Models\AiFixAttempt;
use App\Models\HubException;
use App\Models\HubIssue;
use App\Models\Project;
use App\Models\User;
use App\Services\AiConfigService;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpKernel\Exception\HttpException;

/**
 * Single entry point for "the assignee asked for AI help on this task".
 *
 * Centralizes three concerns that would otherwise be repeated for every
 * task type: assignee authorization, per-project `use_ai` enforcement, and
 * idempotency (don't re-queue if a queued/running attempt already exists).
 */
class AiFixDispatcher
{
    public function __construct(
        private readonly AiConfigService $aiConfig,
    ) {}

    public function dispatchForException(HubException $exception, User $actor): AiFixAttempt
    {
        $exception->loadMissing('project');

        return $this->dispatchInternal(
            task: $exception,
            project: $exception->project,
            assigneeId: $exception->assigned_to,
            actor: $actor,
        );
    }

    public function dispatchForIssue(HubIssue $issue, User $actor): AiFixAttempt
    {
        $issue->loadMissing('project');

        return $this->dispatchInternal(
            task: $issue,
            project: $issue->project,
            assigneeId: $issue->assigned_to,
            actor: $actor,
        );
    }

    private function dispatchInternal(
        Model $task,
        ?Project $project,
        ?int $assigneeId,
        User $actor,
    ): AiFixAttempt {
        if ($project === null) {
            throw new HttpException(404, 'Task is missing a project.');
        }

        if ($assigneeId === null || $assigneeId !== $actor->id) {
            throw new HttpException(403, __('Only the assignee can request an AI fix.'));
        }

        $config = $this->aiConfig->forProject($project);

        if (! $config->use_ai) {
            throw new HttpException(
                422,
                __('AI is not enabled for this project. Ask an admin to turn on Use AI in AI Config.'),
            );
        }

        // Idempotency: if there's already an attempt sitting in queued or
        // running state, return it instead of fanning out duplicates.
        $existing = AiFixAttempt::query()
            ->where('task_type', $task::class)
            ->where('task_id', $task->getKey())
            ->whereIn('status', AiFixAttempt::ACTIVE_STATUSES)
            ->latest('id')
            ->first();

        if ($existing !== null) {
            return $existing;
        }

        $attempt = DB::transaction(function () use ($task, $project, $actor): AiFixAttempt {
            return AiFixAttempt::create([
                'task_type' => $task::class,
                'task_id' => $task->getKey(),
                'project_id' => $project->id,
                'requested_by_user_id' => $actor->id,
                'status' => AiFixAttempt::STATUS_QUEUED,
            ]);
        });

        RequestAiFix::dispatch($attempt->id);

        return $attempt;
    }
}

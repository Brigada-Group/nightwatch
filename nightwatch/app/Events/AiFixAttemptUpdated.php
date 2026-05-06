<?php

namespace App\Events;

use App\Events\Concerns\BroadcastsFlattenedPayload;
use App\Models\AiFixAttempt;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Fired whenever an AI fix attempt transitions between lifecycle states
 * (running → succeeded/failed). Goes out on a per-user private channel so
 * only the developer who clicked "Fix with AI" receives the update — the
 * Tasks page subscribes to this and refetches the kanban without polling.
 *
 * Implements ShouldBroadcastNow so the push happens inline with the worker
 * job; broadcastFor() wraps the dispatch in try/catch so a transient
 * broadcaster outage (e.g. Reverb is down locally) does not fail the AI
 * pipeline itself — the DB writes are already committed by the time we get
 * here.
 */
class AiFixAttemptUpdated implements ShouldBroadcastNow
{
    use BroadcastsFlattenedPayload;
    use SerializesModels;

    public function __construct(public array $data) {}

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('ai-fix.user.'.$this->data['user_id']),
        ];
    }

    public function broadcastAs(): string
    {
        return 'ai-fix.updated';
    }

    /**
     * Build a self-describing payload from the attempt and dispatch the
     * event, swallowing any broadcaster errors so callers can fire-and-forget
     * without wrapping every call site in try/catch.
     */
    public static function broadcastFor(AiFixAttempt $attempt): void
    {
        try {
            event(new self(self::payloadFor($attempt)));
        } catch (Throwable $e) {
            Log::warning('AI fix: broadcast failed', [
                'attempt_id' => $attempt->id,
                'status' => $attempt->status,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * @return array{
     *     user_id: int,
     *     attempt_id: int,
     *     task_type: string,
     *     task_id: int,
     *     project_id: int,
     *     status: string,
     *     changes_count: int,
     *     error: ?string,
     *     applied: bool,
     *     pr_url: ?string,
     *     pr_number: ?int,
     *     apply_error: ?string
     * }
     */
    private static function payloadFor(AiFixAttempt $attempt): array
    {
        $changesCount = is_array($attempt->result['changes'] ?? null)
            ? count($attempt->result['changes'])
            : 0;

        return [
            'user_id' => (int) $attempt->requested_by_user_id,
            'attempt_id' => (int) $attempt->id,
            'task_type' => (string) $attempt->task_type,
            'task_id' => (int) $attempt->task_id,
            'project_id' => (int) $attempt->project_id,
            'status' => (string) $attempt->status,
            'changes_count' => $changesCount,
            'error' => $attempt->error,
            'applied' => $attempt->applied_at !== null,
            'pr_url' => $attempt->apply_pr_url,
            'pr_number' => $attempt->apply_pr_number !== null
                ? (int) $attempt->apply_pr_number
                : null,
            'apply_error' => $attempt->apply_error,
        ];
    }
}

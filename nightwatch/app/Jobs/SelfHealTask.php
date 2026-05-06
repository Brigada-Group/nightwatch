<?php

namespace App\Jobs;

use App\Events\AiFixAttemptUpdated;
use App\Models\AiFixAttempt;
use App\Services\Ai\AiFixApplyService;
use App\Services\Ai\AiFixService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Self-heal pipeline: AI fix → auto-apply (PR creation), no human in the
 * loop. Mirrors RequestAiFix's contract for the AI portion (the same
 * AiFixService produces the proposed changes), then chains
 * AiFixApplyService::apply() to commit + push + open the PR. The task lands
 * in 'review' with `apply_pr_url` populated; the kanban renders a Check-PR
 * button on the card.
 *
 * Stays thin on purpose — all the heavy logic lives in the two injected
 * services so manual ("Fix with AI" → "Accept & open PR") and automatic
 * (this job) paths share exactly the same code.
 */
class SelfHealTask implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public int $tries = 1;
    public int $timeout = 900; // AI step + GitHub apply step combined.

    public function __construct(public readonly int $attemptId) {}

    public function handle(AiFixService $aiService, AiFixApplyService $applyService): void
    {
        $attempt = AiFixAttempt::find($this->attemptId);

        if ($attempt === null) {
            return;
        }

        if ($attempt->status !== AiFixAttempt::STATUS_QUEUED) {
            // Worker double-delivery guard, same pattern as RequestAiFix.
            return;
        }

        $attempt->forceFill([
            'status' => AiFixAttempt::STATUS_RUNNING,
            'started_at' => now(),
        ])->save();

        AiFixAttemptUpdated::broadcastFor($attempt);

        try {
            $aiService->requestFix($attempt);
        } catch (Throwable $e) {
            $attempt->forceFill([
                'status' => AiFixAttempt::STATUS_FAILED,
                'completed_at' => now(),
                'error' => $e->getMessage(),
            ])->save();

            AiFixAttemptUpdated::broadcastFor($attempt);

            Log::error('Self-heal: AI step failed', [
                'attempt_id' => $attempt->id,
                'task_type' => $attempt->task_type,
                'task_id' => $attempt->task_id,
                'error' => $e->getMessage(),
            ]);

            throw $e;
        }

        // Re-load so we see whatever the AI step persisted (status,
        // result, task transition to review).
        $attempt = $attempt->refresh();

        // If the AI step produced no changes (filter empty / no candidates /
        // model returned nothing actionable) it already marked the attempt
        // succeeded with an explanatory summary. Apply doesn't make sense
        // here — there's nothing to commit. Just stop.
        $changeCount = is_array($attempt->result['changes'] ?? null)
            ? count($attempt->result['changes'])
            : 0;

        if ($changeCount === 0) {
            Log::info('Self-heal: AI succeeded with no changes — nothing to apply', [
                'attempt_id' => $attempt->id,
            ]);

            return;
        }

        try {
            $applyService->apply($attempt);
        } catch (Throwable $e) {
            // The apply step's own try/catch in AiFixApplyService already
            // stamps `apply_error` on the attempt and broadcasts the update
            // before re-throwing, so there's no extra DB work to do here.
            // Just log + propagate so failed_jobs has the trace.
            Log::error('Self-heal: apply step failed', [
                'attempt_id' => $attempt->id,
                'error' => $e->getMessage(),
            ]);

            throw $e;
        }

        Log::info('Self-heal: completed', [
            'attempt_id' => $attempt->id,
            'pr_url' => $attempt->fresh()->apply_pr_url,
        ]);
    }
}

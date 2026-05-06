<?php

namespace App\Jobs;

use App\Events\AiFixAttemptUpdated;
use App\Models\AiFixAttempt;
use App\Services\Ai\AiFixService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Hands an `AiFixAttempt` off to whichever `AiFixService` the container
 * resolves. Stays deliberately thin — all the AI logic lives in the service
 * — so this job class never needs to change when the real implementation
 * ships.
 */
class RequestAiFix implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public int $tries = 1;
    public int $timeout = 600;

    public function __construct(public readonly int $attemptId) {}

    public function handle(AiFixService $service): void
    {
        $attempt = AiFixAttempt::find($this->attemptId);

        if ($attempt === null) {
            return;
        }

        if ($attempt->status !== AiFixAttempt::STATUS_QUEUED) {
            // Don't reprocess attempts that already moved past `queued` —
            // protects against worker double-delivery.
            return;
        }

        $attempt->forceFill([
            'status' => AiFixAttempt::STATUS_RUNNING,
            'started_at' => now(),
        ])->save();

        AiFixAttemptUpdated::broadcastFor($attempt);

        try {
            $service->requestFix($attempt);
        } catch (Throwable $e) {
            $attempt->forceFill([
                'status' => AiFixAttempt::STATUS_FAILED,
                'completed_at' => now(),
                'error' => $e->getMessage(),
            ])->save();

            AiFixAttemptUpdated::broadcastFor($attempt);

            Log::error('AI fix attempt failed', [
                'attempt_id' => $attempt->id,
                'task_type' => $attempt->task_type,
                'task_id' => $attempt->task_id,
                'error' => $e->getMessage(),
            ]);

            throw $e;
        }
    }
}

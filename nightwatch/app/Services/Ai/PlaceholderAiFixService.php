<?php

namespace App\Services\Ai;

use App\Events\AiFixAttemptUpdated;
use App\Models\AiFixAttempt;

/**
 * Stand-in implementation that just marks the attempt as succeeded with a
 * `placeholder` flag in the result. Lets the full pipeline (button →
 * controller → dispatcher → job → service → DB) run end-to-end before the
 * real model integration is wired.
 *
 * Replace the binding in `AppServiceProvider::register()` to swap this for
 * a real implementation; no other code needs to change.
 */
class PlaceholderAiFixService implements AiFixService
{
    public function requestFix(AiFixAttempt $attempt): void
    {
        $attempt->forceFill([
            'status' => AiFixAttempt::STATUS_SUCCEEDED,
            'completed_at' => now(),
            'result' => [
                'placeholder' => true,
                'note' => 'AI service is not yet wired. This attempt was acknowledged but no code changes were proposed.',
            ],
        ])->save();

        AiFixAttemptUpdated::broadcastFor($attempt);
    }
}

<?php

namespace App\Services\Ai;

use App\Models\AiFixAttempt;

/**
 * Contract for the engine that turns an `AiFixAttempt` into a fix proposal.
 *
 * The implementation is intentionally swappable: the dispatcher creates the
 * attempt and queues a job, the job loads the bound `AiFixService` from the
 * container, and only then does any AI-specific work happen. Today the only
 * binding is the placeholder, but plugging in the real service later is a
 * one-line change in `AppServiceProvider`.
 *
 * Implementations are responsible for transitioning the attempt through
 * `running` → `succeeded`/`failed` and writing any artifacts (branch name,
 * PR URL, etc.) to `$attempt->result`.
 */
interface AiFixService
{
    public function requestFix(AiFixAttempt $attempt): void;
}

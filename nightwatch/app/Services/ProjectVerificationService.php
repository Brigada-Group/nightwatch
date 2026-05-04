<?php

namespace App\Services;

use App\Events\ProjectVerified;
use App\Models\Project;
use Carbon\CarbonInterface;
use Illuminate\Support\Carbon;

/**
 * Owns the SDK setup-verification ceremony.
 *
 * Flow:
 *   1. UI calls startVerification(project) → 6-digit token + expires_at,
 *      saved on the project. UI shows the token and the artisan command
 *      the user must run on their consuming app.
 *   2. SDK on the consuming app sends a heartbeat with the token in the
 *      payload. Hub's HeartbeatIngestRecorder calls tryVerify().
 *   3. Token matches + not expired → mark verified_at, clear token, fire
 *      ProjectVerified broadcast so the UI flips to ✓ in real time.
 *
 * Token format is intentionally 6 digits (numeric, no letters) to
 * eliminate visual ambiguity (no 0/O, no l/I, no s/5) — copy-paste
 * friendly even when read aloud over a screen-share.
 */
class ProjectVerificationService
{
    public const TOKEN_TTL_SECONDS = 300; // 5 minutes

    /**
     * Generate + persist a fresh 6-digit token. Replaces any prior pending
     * token on the project — only one ceremony can be in flight at a time.
     */
    public function startVerification(Project $project): array
    {
        $token = $this->generateToken();
        $expiresAt = Carbon::now()->addSeconds(self::TOKEN_TTL_SECONDS);

        $project->forceFill([
            'verify_token' => $token,
            'verify_token_expires_at' => $expiresAt,
        ])->save();

        return [
            'token' => $token,
            'expires_at' => $expiresAt->toIso8601String(),
            'ttl_seconds' => self::TOKEN_TTL_SECONDS,
        ];
    }

    /**
     * Called from HeartbeatIngestRecorder when a heartbeat carries a token.
     *
     * @return bool  true if the token was valid + still pending and the
     *               project is now (or was already) verified.
     */
    public function tryVerify(Project $project, string $candidateToken): bool
    {
        if ($project->verify_token === null) {
            return false;
        }

        if (! hash_equals((string) $project->verify_token, $candidateToken)) {
            return false;
        }

        if ($project->verify_token_expires_at !== null
            && $project->verify_token_expires_at->isBefore(Carbon::now())
        ) {
            // Expired — clear the dead token so a future ceremony can start clean.
            $project->forceFill([
                'verify_token' => null,
                'verify_token_expires_at' => null,
            ])->save();
            return false;
        }

        $isFirstVerification = $project->verified_at === null;

        $project->forceFill([
            'verified_at' => $project->verified_at ?? Carbon::now(),
            'verify_token' => null,
            'verify_token_expires_at' => null,
        ])->save();

        broadcast(new ProjectVerified([
            'project_id' => $project->id,
            'project_uuid' => $project->project_uuid,
            'verified_at' => $project->verified_at?->toIso8601String(),
            'first_verification' => $isFirstVerification,
        ]));

        return true;
    }

    /**
     * Cryptographically random 6-digit numeric token. Using random_int
     * (CSPRNG) so an attacker who can probe the heartbeat endpoint can't
     * predict the next token. 1M-space + 5min TTL = ~3300 attempts/sec
     * needed to brute force, far above realistic hub rate limits.
     */
    private function generateToken(): string
    {
        return str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
    }
}

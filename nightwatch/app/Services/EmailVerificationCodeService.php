<?php

namespace App\Services;

use App\Mail\EmailVerificationCodeMail;
use App\Models\User;
use Carbon\CarbonInterface;
use Illuminate\Auth\Events\Verified;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Throwable;

final class EmailVerificationCodeService
{
    public const int CODE_TTL_MINUTES = 15;

    public const int RESEND_COOLDOWN_SECONDS = 60;

    public function notifyAfterLogin(User $user): void
    {
        if ($user->hasVerifiedEmail()) {
            return;
        }

        if ($this->hasUnexpiredCode($user)) {
            return;
        }

        $this->issueAndSend($user);
    }

    public function issueAndSend(User $user): void
    {
        $plain = str_pad((string) random_int(0, 999_999), 6, '0', STR_PAD_LEFT);

        $user->forceFill([
            'email_verification_code_hash' => Hash::make($plain),
            'email_verification_code_sent_at' => now(),
            'email_verification_code_expires_at' => now()->addMinutes(self::CODE_TTL_MINUTES),
        ])->save();

        try {
            Mail::to($user->email)->send(new EmailVerificationCodeMail($user, $plain));
        } catch (Throwable $exception) {
            report($exception);
        }
    }

    public function attemptResend(User $user): array
    {
        if ($user->hasVerifiedEmail()) {
            return ['sent' => false, 'secondsUntilResendAllowed' => 0];
        }

        $wait = $this->secondsUntilResendAllowed($user);

        if ($wait > 0) {
            return ['sent' => false, 'secondsUntilResendAllowed' => $wait];
        }

        $this->issueAndSend($user);

        return ['sent' => true, 'secondsUntilResendAllowed' => self::RESEND_COOLDOWN_SECONDS];
    }

    public function verifyAndMarkVerified(User $user, string $code): bool
    {
        $code = preg_replace('/\D+/', '', $code) ?? '';

        if ($code === '' || $user->hasVerifiedEmail()) {
            return $user->hasVerifiedEmail();
        }

        $hash = $user->email_verification_code_hash;
        /** @var CarbonInterface|null $expiresAt */
        $expiresAt = $user->email_verification_code_expires_at;

        if ($hash === null || $expiresAt === null || $expiresAt->isPast()) {
            return false;
        }

        if (! Hash::check($code, $hash)) {
            return false;
        }

        $user->forceFill([
            'email_verification_code_hash' => null,
            'email_verification_code_sent_at' => null,
            'email_verification_code_expires_at' => null,
            'email_verified_at' => now(),
        ])->save();

        $user->refresh();

        event(new Verified($user));

        return true;
    }

    public function secondsUntilResendAllowed(User $user): int
    {
        if ($user->hasVerifiedEmail()) {
            return 0;
        }

        $sentAt = $user->email_verification_code_sent_at;

        if ($sentAt === null) {
            return 0;
        }

        $secondsElapsed = now()->timestamp - $sentAt->timestamp;

        return max(0, self::RESEND_COOLDOWN_SECONDS - $secondsElapsed);
    }

    private function hasUnexpiredCode(User $user): bool
    {
        $expiresAt = $user->email_verification_code_expires_at;

        return $user->email_verification_code_hash !== null
            && $expiresAt !== null
            && $expiresAt->isFuture();
    }
}

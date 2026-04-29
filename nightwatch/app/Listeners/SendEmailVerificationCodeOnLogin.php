<?php

namespace App\Listeners;

use App\Models\User;
use App\Services\EmailVerificationCodeService;
use Illuminate\Auth\Events\Login;

class SendEmailVerificationCodeOnLogin
{
    public function __construct(
        private readonly EmailVerificationCodeService $verificationCode,
    ) {}

    public function handle(Login $event): void
    {
        if ($event->guard !== 'web') {
            return;
        }

        $user = $event->user;
        if (! $user instanceof User) {
            return;
        }

        $this->verificationCode->notifyAfterLogin($user);
    }
}

<?php

namespace App\Http\Controllers;

use App\Http\Requests\VerifyEmailCodeRequest;
use App\Models\User;
use App\Services\EmailVerificationCodeService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class EmailVerificationCodeController extends Controller
{
    public function __construct(
        private readonly EmailVerificationCodeService $verificationCode,
    ) {}

    public function show(Request $request): Response|RedirectResponse
    {
        $user = $request->user();
        abort_unless($user instanceof User, 403);

        if ($user->hasVerifiedEmail()) {
            return redirect()->intended(route('dashboard', absolute: false));
        }

        return Inertia::render('auth/verify-email', [
            'email' => $user->email,
            'status' => $request->session()->get('status'),
            'resendAvailableInSeconds' => $this->verificationCode->secondsUntilResendAllowed($user),
        ]);
    }

    public function verify(VerifyEmailCodeRequest $request): RedirectResponse
    {
        $user = $request->user();
        abort_unless($user instanceof User, 403);

        if ($user->hasVerifiedEmail()) {
            return redirect()->intended(route('dashboard', absolute: false));
        }

        $ok = $this->verificationCode->verifyAndMarkVerified(
            $user,
            $request->validated()['code'],
        );

        if (! $ok) {
            throw ValidationException::withMessages([
                'code' => __('That code is invalid or has expired. Request a new one below.'),
            ]);
        }

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('Email verified.'),
        ]);

        return redirect()->intended(route('dashboard', absolute: false).'?verified=1');
    }

    public function resend(Request $request): RedirectResponse
    {
        $user = $request->user();
        abort_unless($user instanceof User, 403);

        if ($user->hasVerifiedEmail()) {
            return redirect()->route('dashboard', absolute: false);
        }

        $result = $this->verificationCode->attemptResend($user);

        if (! $result['sent']) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => __('Please wait :seconds seconds before resending.', [
                    'seconds' => $result['secondsUntilResendAllowed'],
                ]),
            ]);

            return back();
        }

        return back()->with('status', 'verification-link-sent');
    }
}

<?php

namespace App\Mail;

use App\Models\User;
use App\Services\EmailVerificationCodeService;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class EmailVerificationCodeMail extends Mailable
{
    use Queueable;
    use SerializesModels;

    public function __construct(
        public User $user,
        public string $code,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: (string) config('app.name', 'Guardian').' — Your verification code',
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'mail.email-verification-code',
            with: [
                'userName' => $this->user->name,
                'code' => $this->code,
                'ttlMinutes' => EmailVerificationCodeService::CODE_TTL_MINUTES,
            ],
        );
    }
}

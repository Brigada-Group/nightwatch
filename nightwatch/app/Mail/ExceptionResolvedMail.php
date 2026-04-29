<?php

namespace App\Mail;

use App\Models\HubException;
use App\Models\Project;
use App\Models\Team;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ExceptionResolvedMail extends Mailable
{
    use Queueable;
    use SerializesModels;

    public function __construct(
        public HubException $exception,
        public Project $project,
        public Team $team,
        public User $resolver,
        public User $recipient,
    ) {}

    public function envelope(): Envelope
    {
        $appName = (string) config('app.name', 'Nightwatch');

        return new Envelope(
            subject: "{$appName} — {$this->resolver->name} resolved an exception in {$this->team->name}",
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'mail.exception-resolved',
            with: [
                'appName' => (string) config('app.name', 'Nightwatch'),
                'recipientName' => $this->recipient->name,
                'resolverName' => $this->resolver->name,
                'teamName' => $this->team->name,
                'projectName' => $this->project->name,
                'environment' => (string) $this->exception->environment,
                'severity' => (string) $this->exception->severity,
                'exceptionClass' => (string) $this->exception->exception_class,
                'exceptionMessage' => (string) $this->exception->message,
                'sentAt' => $this->exception->sent_at?->toDayDateTimeString() ?? '',
                'resolvedAt' => now()->toDayDateTimeString(),
                'exceptionUrl' => url('/exceptions?project_id='.$this->exception->project_id),
            ],
        );
    }
}

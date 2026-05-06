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

class RecurrenceAssignedMail extends Mailable
{
    use Queueable;
    use SerializesModels;

    public function __construct(
        public HubException $exception,
        public Project $project,
        public Team $team,
        public User $assignee,
        public ?string $previouslyFinishedAtIso,
    ) {}

    public function envelope(): Envelope
    {
        $appName = (string) config('app.name', 'Guardian');

        return new Envelope(
            subject: "{$appName} — A previously resolved exception has come back in {$this->project->name}",
        );
    }

    public function content(): Content
    {
        $previouslyFinishedAt = $this->previouslyFinishedAtIso
            ? \Carbon\Carbon::parse($this->previouslyFinishedAtIso)->toDayDateTimeString()
            : '';

        return new Content(
            markdown: 'mail.recurrence-assigned',
            with: [
                'appName' => (string) config('app.name', 'Guardian'),
                'assigneeName' => $this->assignee->name,
                'teamName' => $this->team->name,
                'projectName' => $this->project->name,
                'exceptionClass' => (string) $this->exception->exception_class,
                'exceptionMessage' => (string) $this->exception->message,
                'severity' => (string) $this->exception->severity,
                'previouslyFinishedAt' => $previouslyFinishedAt,
                'exceptionUrl' => url('/exceptions/'.$this->exception->id),
            ],
        );
    }
}

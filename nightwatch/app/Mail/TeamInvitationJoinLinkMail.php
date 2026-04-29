<?php

namespace App\Mail;

use App\Models\Team;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class TeamInvitationJoinLinkMail extends Mailable
{
    use Queueable;
    use SerializesModels;

    public function __construct(
        public User $inviter,
        public Team $team,
        public string $roleName,
        public string $joinUrl,
        public array $projectNames = [],
    ) {}

    public function envelope(): Envelope
    {
        $appName = (string) config('app.name', 'Nightwatch');

        return new Envelope(
            subject: "{$appName} — {$this->inviter->name} is inviting you to join {$this->team->name}",
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'mail.team-invitation-join-link',
            with: [
                'inviterName' => $this->inviter->name,
                'teamName' => $this->team->name,
                'roleName' => $this->roleName,
                'joinUrl' => $this->joinUrl,
                'projectNames' => $this->projectNames,
                'appName' => (string) config('app.name', 'Nightwatch'),
            ],
        );
    }
}

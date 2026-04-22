<?php

namespace App\Mail;

use App\Models\EmailReport;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class EmailReportMail extends Mailable
{
    use Queueable;
    use SerializesModels;

    /**
     * @param  array<string, mixed>  $report
     */
    public function __construct(
        public readonly EmailReport $config,
        public readonly array $report,
    ) {}

    public function envelope(): Envelope
    {
        $label = ucfirst($this->config->frequency);
        $appName = (string) config('app.name', 'Nightwatch');

        return new Envelope(
            subject: "{$appName} · {$label} monitoring report",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.email-report',
            with: [
                'config' => $this->config,
                'report' => $this->report,
                'appName' => (string) config('app.name', 'Nightwatch'),
                'dashboardUrl' => rtrim((string) config('app.url', ''), '/').'/dashboard',
            ],
        );
    }
}

<?php

namespace App\Services\Ingest\Recorders;

use App\Events\MailReceived;
use App\Models\HubMail;
use App\Models\Project;
use App\Services\Ingest\Contracts\IngestRecorderInterface;
use App\Services\Ingest\IngestRecordingCoordinator;

final class MailIngestRecorder implements IngestRecorderInterface
{
    public function __construct(
        private readonly IngestRecordingCoordinator $coordinator
    ) {}

    public function record(Project $project, array $data): void
    {
        $mail = HubMail::create([
            'project_id' => $project->id,
            'environment' => $data['environment'],
            'server' => $data['server'],
            'trace_id' => $data['trace_id'] ?? null,
            'mailable' => $data['mailable'] ?? null,
            'subject' => $data['subject'] ?? null,
            'to' => $data['to'] ?? null,
            'status' => $data['status'],
            'error_message' => $data['error_message'] ?? null,
            'sent_at' => $data['sent_at'],
        ]);

        broadcast(new MailReceived([
            'id' => $mail->id,
            'project_id' => $project->id,
            'mailable' => $mail->mailable,
            'subject' => $mail->subject,
            'to' => $mail->to,
            'status' => $mail->status,
            'error_message' => $mail->error_message,
            'environment' => $mail->environment,
            'sent_at' => $data['sent_at'],
        ]));

        if ($mail->status === 'failed') {
            $this->coordinator->dispatchTeamWebhook($project, 'mail.failed', [
                'message' => sprintf(
                    'Mail failed%s',
                    $mail->mailable !== null ? ': '.$mail->mailable : '',
                ),
                'mailable' => $mail->mailable,
                'subject' => $mail->subject,
                'to' => $mail->to,
                'error_message' => $mail->error_message,
                'occurred_at' => is_string($data['sent_at'] ?? null)
                    ? $data['sent_at']
                    : now()->toIso8601String(),
            ]);
        }
    }
}

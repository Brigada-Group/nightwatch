<?php

namespace App\Services\Ingest\Recorders;

use App\Events\NotificationReceived;
use App\Models\HubNotification;
use App\Models\Project;
use App\Services\Ingest\Contracts\IngestRecorderInterface;
use App\Services\Ingest\IngestRecordingCoordinator;

final class NotificationIngestRecorder implements IngestRecorderInterface
{
    public function __construct(
        private readonly IngestRecordingCoordinator $coordinator
    ) {}

    public function record(Project $project, array $data): void
    {
        $notification = HubNotification::create([
            'project_id' => $project->id,
            'environment' => $data['environment'],
            'server' => $data['server'],
            'notification_class' => $data['notification_class'],
            'channel' => $data['channel'],
            'notifiable_type' => $data['notifiable_type'],
            'notifiable_id' => $data['notifiable_id'] ?? null,
            'status' => $data['status'],
            'error_message' => $data['error_message'] ?? null,
            'sent_at' => $data['sent_at'],
        ]);

        broadcast(new NotificationReceived([
            'id' => $notification->id,
            'project_id' => $project->id,
            'notification_class' => $notification->notification_class,
            'channel' => $notification->channel,
            'notifiable_type' => $notification->notifiable_type,
            'notifiable_id' => $notification->notifiable_id,
            'status' => $notification->status,
            'error_message' => $notification->error_message,
            'environment' => $notification->environment,
            'sent_at' => $data['sent_at'],
        ]));

        if ($notification->status === 'failed') {
            $this->coordinator->dispatchTeamWebhook($project, 'notification.failed', [
                'message' => sprintf(
                    'Notification failed on channel %s',
                    (string) $notification->channel,
                ),
                'notification_class' => $notification->notification_class,
                'channel' => $notification->channel,
                'error_message' => $notification->error_message,
                'occurred_at' => is_string($data['sent_at'] ?? null)
                    ? $data['sent_at']
                    : now()->toIso8601String(),
            ]);
        }
    }
}

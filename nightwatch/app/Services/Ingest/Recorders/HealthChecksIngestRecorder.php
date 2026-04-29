<?php

namespace App\Services\Ingest\Recorders;

use App\Events\HealthCheckReceived;
use App\Models\HubHealthCheck;
use App\Models\Project;
use App\Services\Ingest\Contracts\IngestRecorderInterface;
use App\Services\Ingest\IngestRecordingCoordinator;

final class HealthChecksIngestRecorder implements IngestRecorderInterface
{
    public function __construct(
        private readonly IngestRecordingCoordinator $coordinator
    ) {}

    public function record(Project $project, array $data): void
    {
        foreach ($data['checks'] as $check) {
            $checkEvent = HubHealthCheck::create([
                'project_id' => $project->id,
                'environment' => $data['environment'],
                'server' => $data['server'],
                'check_name' => $check['name'],
                'status' => $check['status'],
                'message' => $check['message'] ?? null,
                'metadata' => $check['metadata'] ?? null,
                'sent_at' => $data['sent_at'],
            ]);

            if (in_array($checkEvent->status, ['critical', 'error', 'failed'], true)) {
                $this->coordinator->dispatchTeamWebhook(
                    $project,
                    'health.failed',
                    [
                        'check_name' => $checkEvent->check_name,
                        'status' => $checkEvent->status,
                        'message' => $checkEvent->message,
                        'metadata' => $checkEvent->metadata,
                        'occurred_at' => optional($checkEvent->sent_at)?->toIso8601String(),
                    ]
                );
            }
        }

        broadcast(new HealthCheckReceived([
            'project_id' => $project->id,
            'checks' => $data['checks'],
            'environment' => $data['environment'],
            'server' => $data['server'],
            'sent_at' => $data['sent_at'],
        ]));

        $this->coordinator->recalculateStatus($project);
    }
}

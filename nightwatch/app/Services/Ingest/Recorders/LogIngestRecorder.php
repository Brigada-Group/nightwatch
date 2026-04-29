<?php

namespace App\Services\Ingest\Recorders;

use App\Events\LogReceived;
use App\Models\HubLog;
use App\Models\Project;
use App\Services\Ingest\Contracts\IngestRecorderInterface;
use App\Services\Ingest\IngestRecordingCoordinator;

final class LogIngestRecorder implements IngestRecorderInterface
{
    public function __construct(
        private readonly IngestRecordingCoordinator $coordinator
    ) {}

    public function record(Project $project, array $data): void
    {
        $log = HubLog::create([
            'project_id' => $project->id,
            'environment' => $data['environment'],
            'server' => $data['server'],
            'level' => $data['level'],
            'message' => $data['message'],
            'channel' => $data['channel'] ?? null,
            'context' => $data['context'] ?? null,
            'sent_at' => $data['sent_at'],
        ]);

        if (in_array($log->level, ['emergency', 'alert', 'critical'], true)) {
            $this->coordinator->dispatchTeamWebhook(
                $project,
                'log.critical',
                [
                    'level' => $log->level,
                    'message' => $log->message,
                    'channel' => $log->channel,
                    'occurred_at' => optional($log->sent_at)?->toIso8601String(),
                ]
            );
        }

        broadcast(new LogReceived([
            'id' => $log->id,
            'project_id' => $project->id,
            'level' => $log->level,
            'message' => $log->message,
            'channel' => $log->channel,
            'context' => $log->context,
            'environment' => $log->environment,
            'sent_at' => $data['sent_at'],
        ]));

        if (in_array($data['level'], ['emergency', 'alert', 'critical'])) {
            $this->coordinator->recalculateStatus($project);
        }
    }
}

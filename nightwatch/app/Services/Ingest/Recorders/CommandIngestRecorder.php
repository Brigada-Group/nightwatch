<?php

namespace App\Services\Ingest\Recorders;

use App\Events\CommandReceived;
use App\Models\HubCommand;
use App\Models\Project;
use App\Services\Ingest\Contracts\IngestRecorderInterface;
use App\Services\Ingest\IngestRecordingCoordinator;

final class CommandIngestRecorder implements IngestRecorderInterface
{
    public function __construct(
        private readonly IngestRecordingCoordinator $coordinator
    ) {}

    public function record(Project $project, array $data): void
    {
        $command = HubCommand::create([
            'project_id' => $project->id,
            'environment' => $data['environment'],
            'server' => $data['server'],
            'command' => $data['command'],
            'exit_code' => $data['exit_code'] ?? null,
            'duration_ms' => $data['duration_ms'] ?? null,
            'sent_at' => $data['sent_at'],
        ]);

        broadcast(new CommandReceived([
            'id' => $command->id,
            'project_id' => $project->id,
            'command' => $command->command,
            'exit_code' => $command->exit_code,
            'duration_ms' => $command->duration_ms,
            'environment' => $command->environment,
            'sent_at' => $data['sent_at'],
        ]));

        if ($command->exit_code !== null && (int) $command->exit_code !== 0) {
            $this->coordinator->dispatchTeamWebhook($project, 'command.failed', [
                'message' => sprintf(
                    'Command exited with code %s: %s',
                    (string) $command->exit_code,
                    mb_substr((string) $command->command, 0, 160),
                ),
                'command' => $command->command,
                'exit_code' => $command->exit_code,
                'duration_ms' => $command->duration_ms,
                'occurred_at' => is_string($data['sent_at'] ?? null)
                    ? $data['sent_at']
                    : now()->toIso8601String(),
            ]);
        }
    }
}

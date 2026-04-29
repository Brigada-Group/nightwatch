<?php

namespace App\Services\Ingest\Recorders;

use App\Events\ScheduledTaskReceived;
use App\Models\HubScheduledTask;
use App\Models\Project;
use App\Services\Ingest\Contracts\IngestRecorderInterface;
use App\Services\Ingest\IngestRecordingCoordinator;

final class ScheduledTaskIngestRecorder implements IngestRecorderInterface
{
    public function __construct(
        private readonly IngestRecordingCoordinator $coordinator
    ) {}

    public function record(Project $project, array $data): void
    {
        $task = HubScheduledTask::create([
            'project_id' => $project->id,
            'environment' => $data['environment'],
            'server' => $data['server'],
            'task' => $data['task'],
            'description' => $data['description'] ?? null,
            'expression' => $data['expression'] ?? null,
            'status' => $data['status'],
            'duration_ms' => $data['duration_ms'] ?? null,
            'output' => $data['output'] ?? null,
            'sent_at' => $data['sent_at'],
        ]);

        broadcast(new ScheduledTaskReceived([
            'id' => $task->id,
            'project_id' => $project->id,
            'task' => $task->task,
            'description' => $task->description,
            'expression' => $task->expression,
            'status' => $task->status,
            'duration_ms' => $task->duration_ms,
            'output' => $task->output,
            'environment' => $task->environment,
            'sent_at' => $data['sent_at'],
        ]));

        if ($data['status'] === 'failed') {
            $this->coordinator->dispatchTeamWebhook($project, 'scheduled_task.failed', [
                'message' => sprintf(
                    'Scheduled task failed: %s',
                    mb_substr((string) $task->task, 0, 180),
                ),
                'task' => $task->task,
                'description' => $task->description,
                'expression' => $task->expression,
                'duration_ms' => $task->duration_ms,
                'output_excerpt' => $task->output !== null ? mb_substr((string) $task->output, 0, 600) : null,
                'occurred_at' => is_string($data['sent_at'] ?? null)
                    ? $data['sent_at']
                    : now()->toIso8601String(),
            ]);
            $this->coordinator->recalculateStatus($project);
        }
    }
}

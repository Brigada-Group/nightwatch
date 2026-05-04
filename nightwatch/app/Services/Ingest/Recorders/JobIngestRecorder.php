<?php

namespace App\Services\Ingest\Recorders;

use App\Events\JobReceived;
use App\Models\HubJob;
use App\Models\Project;
use App\Services\Ingest\Contracts\IngestRecorderInterface;
use App\Services\Ingest\IngestRecordingCoordinator;

final class JobIngestRecorder implements IngestRecorderInterface
{
    public function __construct(
        private readonly IngestRecordingCoordinator $coordinator
    ) {}

    public function record(Project $project, array $data): void
    {
        $job = HubJob::create([
            'project_id' => $project->id,
            'environment' => $data['environment'],
            'server' => $data['server'],
            'trace_id' => $data['trace_id'] ?? null,
            'job_class' => $data['job_class'],
            'queue' => $data['queue'] ?? null,
            'connection' => $data['connection'] ?? null,
            'status' => $data['status'],
            'duration_ms' => $data['duration_ms'] ?? null,
            'attempt' => $data['attempt'] ?? null,
            'error_message' => $data['error_message'] ?? null,
            'metadata' => $data['metadata'] ?? null,
            'sent_at' => $data['sent_at'],
        ]);

        if ($job->status === 'failed') {
            $this->coordinator->dispatchTeamWebhook(
                $project,
                'job.failed',
                [
                    'job_class' => $job->job_class,
                    'queue' => $job->queue,
                    'connection' => $job->connection,
                    'attempt' => $job->attempt,
                    'error_message' => $job->error_message,
                    'occurred_at' => optional($job->sent_at)?->toIso8601String(),
                ]
            );
        }

        broadcast(new JobReceived([
            'id' => $job->id,
            'project_id' => $project->id,
            'job_class' => $job->job_class,
            'queue' => $job->queue,
            'status' => $job->status,
            'duration_ms' => $job->duration_ms,
            'attempt' => $job->attempt,
            'error_message' => $job->error_message,
            'environment' => $job->environment,
            'sent_at' => $data['sent_at'],
        ]));

        if ($data['status'] === 'failed') {
            $this->coordinator->recalculateStatus($project);
        }
    }
}

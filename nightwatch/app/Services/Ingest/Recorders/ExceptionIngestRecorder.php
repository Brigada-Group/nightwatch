<?php

namespace App\Services\Ingest\Recorders;

use App\Events\ExceptionReceived;
use App\Models\HubException;
use App\Models\Project;
use App\Services\Ingest\Contracts\IngestRecorderInterface;
use App\Services\Ingest\IngestRecordingCoordinator;

final class ExceptionIngestRecorder implements IngestRecorderInterface
{
    public function __construct(
        private readonly IngestRecordingCoordinator $coordinator
    ) {}

    public function record(Project $project, array $data): void
    {
        $exception = HubException::create([
            'project_id' => $project->id,
            'environment' => $data['environment'],
            'server' => $data['server'],
            'exception_class' => $data['exception_class'],
            'message' => $data['message'],
            'file' => $data['file'] ?? null,
            'line' => $data['line'] ?? null,
            'url' => $data['url'] ?? null,
            'status_code' => $data['status_code'] ?? null,
            'user' => $data['user'] ?? null,
            'ip' => $data['ip'] ?? null,
            'headers' => $data['headers'] ?? null,
            'stack_trace' => $data['stack_trace'] ?? null,
            'severity' => $data['severity'] ?? 'error',
            'sent_at' => $data['sent_at'],
        ]);

        $this->coordinator->dispatchTeamWebhook(
            $project,
            'exception.created',
            [
                'severity' => $exception->severity,
                'exception_class' => $exception->exception_class,
                'message' => $exception->message,
                'file' => $exception->file,
                'line' => $exception->line,
                'status_code' => $exception->status_code,
                'occurred_at' => optional($exception->sent_at)?->toIso8601String(),
            ]
        );

        broadcast(new ExceptionReceived([
            'id' => $exception->id,
            'project_id' => $project->id,
            'exception_class' => $exception->exception_class,
            'message' => $exception->message,
            'file' => $exception->file,
            'line' => $exception->line,
            'severity' => $exception->severity,
            'environment' => $exception->environment,
            'server' => $exception->server,
            'sent_at' => $data['sent_at'],
        ]));

        $this->coordinator->recalculateStatus($project);
    }
}

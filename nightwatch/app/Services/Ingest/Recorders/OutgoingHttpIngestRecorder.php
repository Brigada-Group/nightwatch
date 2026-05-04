<?php

namespace App\Services\Ingest\Recorders;

use App\Events\OutgoingHttpReceived;
use App\Models\HubOutgoingHttp;
use App\Models\Project;
use App\Services\Ingest\Contracts\IngestRecorderInterface;
use App\Services\Ingest\IngestRecordingCoordinator;

final class OutgoingHttpIngestRecorder implements IngestRecorderInterface
{
    public function __construct(
        private readonly IngestRecordingCoordinator $coordinator
    ) {}

    public function record(Project $project, array $data): void
    {
        $http = HubOutgoingHttp::create([
            'project_id' => $project->id,
            'environment' => $data['environment'],
            'server' => $data['server'],
            'trace_id' => $data['trace_id'] ?? null,
            'method' => $data['method'],
            'url' => $data['url'],
            'host' => $data['host'],
            'status_code' => $data['status_code'] ?? null,
            'duration_ms' => $data['duration_ms'] ?? null,
            'failed' => $data['failed'] ?? false,
            'error_message' => $data['error_message'] ?? null,
            'sent_at' => $data['sent_at'],
        ]);

        broadcast(new OutgoingHttpReceived([
            'id' => $http->id,
            'project_id' => $project->id,
            'method' => $http->method,
            'url' => $http->url,
            'host' => $http->host,
            'status_code' => $http->status_code,
            'duration_ms' => $http->duration_ms,
            'failed' => $http->failed,
            'environment' => $http->environment,
            'sent_at' => $data['sent_at'],
        ]));

        if ($http->failed) {
            $this->coordinator->dispatchTeamWebhook($project, 'outgoing_http.failed', [
                'message' => sprintf(
                    'Outbound %s failed: %s',
                    $http->method,
                    mb_substr((string) ($http->host ?? $http->url), 0, 120),
                ),
                'method' => $http->method,
                'url' => $http->url,
                'host' => $http->host,
                'status_code' => $http->status_code,
                'duration_ms' => $http->duration_ms,
                'error_message' => $http->error_message,
                'occurred_at' => is_string($data['sent_at'] ?? null)
                    ? $data['sent_at']
                    : now()->toIso8601String(),
            ]);
        }
    }
}

<?php

namespace App\Services\Ingest\Recorders;

use App\Events\RequestReceived;
use App\Models\HubRequest;
use App\Models\Project;
use App\Services\Ingest\Contracts\IngestRecorderInterface;
use App\Services\Ingest\IngestRecordingCoordinator;
use App\Services\IssuePromotionService;

final class RequestIngestRecorder implements IngestRecorderInterface
{
    public function __construct(
        private readonly IngestRecordingCoordinator $coordinator,
        private readonly IssuePromotionService $issues,
    ) {}

    public function record(Project $project, array $data): void
    {
        $hubRequest = HubRequest::create([
            'project_id' => $project->id,
            'environment' => $data['environment'],
            'server' => $data['server'],
            'trace_id' => $data['trace_id'] ?? null,
            'method' => $data['method'],
            'uri' => $data['uri'],
            'route_name' => $data['route_name'] ?? null,
            'status_code' => $data['status_code'],
            'duration_ms' => $data['duration_ms'],
            'ip' => $data['ip'] ?? null,
            'user_id' => $data['user_id'] ?? null,
            'sent_at' => $data['sent_at'],
        ]);

        broadcast(new RequestReceived([
            'id' => $hubRequest->id,
            'project_id' => $project->id,
            'method' => $hubRequest->method,
            'uri' => $hubRequest->uri,
            'route_name' => $hubRequest->route_name,
            'status_code' => $hubRequest->status_code,
            'duration_ms' => $hubRequest->duration_ms,
            'ip' => $hubRequest->ip,
            'user_id' => $hubRequest->user_id,
            'environment' => $hubRequest->environment,
            'sent_at' => $data['sent_at'],
        ]));

        $code = (int) $hubRequest->status_code;

        // Promote first so the webhook payloads can carry issue metadata
        // (issue_id + recurrence_count) — receivers can dedupe alerts on
        // recurring 5xx routes by these fields.
        $issue = $this->issues->promoteSlowRequest($hubRequest);
        $issueMeta = $issue ? [
            'issue_id' => $issue->id,
            'recurrence_count' => (int) $issue->recurrence_count,
            'is_recurrence' => (bool) $issue->is_recurrence,
        ] : [];

        if ($code >= 500) {
            $this->coordinator->dispatchTeamWebhook($project, 'request.server_error', [
                'message' => sprintf(
                    '%s %s returned HTTP %d',
                    $hubRequest->method,
                    mb_substr((string) $hubRequest->uri, 0, 200),
                    $hubRequest->status_code,
                ),
                'method' => $hubRequest->method,
                'uri' => $hubRequest->uri,
                'route_name' => $hubRequest->route_name,
                'status_code' => $hubRequest->status_code,
                'duration_ms' => $hubRequest->duration_ms,
                'occurred_at' => is_string($data['sent_at'] ?? null)
                    ? $data['sent_at']
                    : now()->toIso8601String(),
                ...$issueMeta,
            ]);
        } elseif ($code >= 400) {
            $this->coordinator->dispatchTeamWebhook($project, 'request.client_error', [
                'message' => sprintf(
                    '%s %s returned HTTP %d',
                    $hubRequest->method,
                    mb_substr((string) $hubRequest->uri, 0, 200),
                    $hubRequest->status_code,
                ),
                'method' => $hubRequest->method,
                'uri' => $hubRequest->uri,
                'route_name' => $hubRequest->route_name,
                'status_code' => $hubRequest->status_code,
                'duration_ms' => $hubRequest->duration_ms,
                'occurred_at' => is_string($data['sent_at'] ?? null)
                    ? $data['sent_at']
                    : now()->toIso8601String(),
                ...$issueMeta,
            ]);
        }
    }
}

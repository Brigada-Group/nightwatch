<?php

namespace App\Services\Ingest;

use App\Jobs\RecalculateProjectStatus;
use App\Models\Project;
use App\Services\WebhookDispatcherService;

/**
 * Shared side effects for ingest flows: team webhooks and project status refresh.
 */
final class IngestRecordingCoordinator
{
    public function __construct(
        private readonly WebhookDispatcherService $webhooks
    ) {}

    public function recalculateStatus(Project $project): void
    {
        RecalculateProjectStatus::dispatch($project->id);
    }

    public function dispatchTeamWebhook(Project $project, string $eventType, array $data): void
    {
        if (! $project->team_id) {
            return;
        }

        $payload = [
            'event_type' => $eventType,
            'project' => [
                'id' => $project->id,
                'uuid' => $project->project_uuid,
                'name' => $project->name,
                'environment' => $project->environment,
            ],
            'data' => $data,
            'occurred_at' => now()->toIso8601String(),
            'guardian_url' => config('app.url'),
        ];

        $this->webhooks->dispatchToTeam($project->team_id, $eventType, $payload);
    }
}

<?php

namespace App\Services\Ingest\Recorders;

use App\Models\HubComposerAudit;
use App\Models\Project;
use App\Services\Ingest\Contracts\IngestRecorderInterface;
use App\Services\Ingest\IngestRecordingCoordinator;

final class ComposerAuditIngestRecorder implements IngestRecorderInterface
{
    public function __construct(
        private readonly IngestRecordingCoordinator $coordinator
    ) {}

    public function record(Project $project, array $data): void
    {
        $advisoryCount = (int) ($data['advisories_count'] ?? count($data['advisories'] ?? []));
        $abandonedCount = (int) ($data['abandoned_count'] ?? count($data['abandoned'] ?? []));

        HubComposerAudit::create([
            'project_id' => $project->id,
            'environment' => $data['environment'],
            'server' => $data['server'],
            'advisories_count' => $advisoryCount,
            'abandoned_count' => $abandonedCount,
            'advisories' => $data['advisories'] ?? null,
            'abandoned' => $data['abandoned'] ?? null,
            'sent_at' => $data['sent_at'],
        ]);

        if ($advisoryCount > 0 || $abandonedCount > 0) {
            $this->coordinator->dispatchTeamWebhook($project, 'composer_audit.issues_found', [
                'message' => sprintf(
                    'Composer audit: %d advisories, %d abandoned packages',
                    $advisoryCount,
                    $abandonedCount,
                ),
                'advisories_count' => $advisoryCount,
                'abandoned_count' => $abandonedCount,
                'occurred_at' => is_string($data['sent_at'] ?? null)
                    ? $data['sent_at']
                    : now()->toIso8601String(),
            ]);
        }
    }
}

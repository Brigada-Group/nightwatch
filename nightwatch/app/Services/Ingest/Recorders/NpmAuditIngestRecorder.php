<?php

namespace App\Services\Ingest\Recorders;

use App\Models\HubNpmAudit;
use App\Models\Project;
use App\Services\Ingest\Contracts\IngestRecorderInterface;
use App\Services\Ingest\IngestRecordingCoordinator;

final class NpmAuditIngestRecorder implements IngestRecorderInterface
{
    public function __construct(
        private readonly IngestRecordingCoordinator $coordinator
    ) {}

    public function record(Project $project, array $data): void
    {
        $total = (int) ($data['total_vulnerabilities'] ?? 0);

        HubNpmAudit::create([
            'project_id' => $project->id,
            'environment' => $data['environment'],
            'server' => $data['server'],
            'total_vulnerabilities' => $total,
            'info_count' => $data['info_count'] ?? 0,
            'low_count' => $data['low_count'] ?? 0,
            'moderate_count' => $data['moderate_count'] ?? 0,
            'high_count' => $data['high_count'] ?? 0,
            'critical_count' => $data['critical_count'] ?? 0,
            'vulnerabilities' => $data['vulnerabilities'] ?? null,
            'audit_metadata' => $data['audit_metadata'] ?? null,
            'sent_at' => $data['sent_at'],
        ]);

        if ($total > 0) {
            $this->coordinator->dispatchTeamWebhook($project, 'npm_audit.issues_found', [
                'message' => sprintf('npm audit: %d known vulnerabilities', $total),
                'total_vulnerabilities' => $total,
                'critical_count' => (int) ($data['critical_count'] ?? 0),
                'high_count' => (int) ($data['high_count'] ?? 0),
                'moderate_count' => (int) ($data['moderate_count'] ?? 0),
                'occurred_at' => is_string($data['sent_at'] ?? null)
                    ? $data['sent_at']
                    : now()->toIso8601String(),
            ]);
        }
    }
}

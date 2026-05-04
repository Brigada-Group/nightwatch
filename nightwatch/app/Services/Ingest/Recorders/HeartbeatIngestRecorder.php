<?php

namespace App\Services\Ingest\Recorders;

use App\Events\HeartbeatReceived;
use App\Models\Project;
use App\Services\Ingest\Contracts\IngestRecorderInterface;
use App\Services\ProjectVerificationService;

final class HeartbeatIngestRecorder implements IngestRecorderInterface
{
    public function __construct(
        private readonly ProjectVerificationService $verification,
    ) {}

    public function record(Project $project, array $data): void
    {
        $project->update([
            'last_heartbeat_at' => now(),
            'metadata' => [
                'php_version' => $data['php_version'],
                'laravel_version' => $data['laravel_version'],
            ],
        ]);

        // If the SDK piggybacked a verification token on this heartbeat,
        // try to consume it. tryVerify() handles invalid/expired tokens
        // gracefully and broadcasts ProjectVerified on success.
        if (! empty($data['verification_token'])) {
            $this->verification->tryVerify(
                $project->fresh(),
                (string) $data['verification_token'],
            );
        }

        broadcast(new HeartbeatReceived([
            'project_id' => $project->id,
            'project_name' => $project->name,
            'status' => $project->status,
            'last_heartbeat_at' => $project->last_heartbeat_at->toIso8601String(),
            'metadata' => $project->metadata,
        ]));
    }
}

<?php

namespace App\Services\Ingest\Recorders;

use App\Events\QueryReceived;
use App\Models\HubQuery;
use App\Models\Project;
use App\Services\Ingest\Contracts\IngestRecorderInterface;
use App\Services\Ingest\IngestRecordingCoordinator;

final class QueryIngestRecorder implements IngestRecorderInterface
{
    public function __construct(
        private readonly IngestRecordingCoordinator $coordinator
    ) {}

    public function record(Project $project, array $data): void
    {
        $query = HubQuery::create([
            'project_id' => $project->id,
            'environment' => $data['environment'],
            'server' => $data['server'],
            'sql' => $data['sql'],
            'duration_ms' => $data['duration_ms'],
            'connection' => $data['connection'] ?? null,
            'file' => $data['file'] ?? null,
            'line' => $data['line'] ?? null,
            'is_slow' => $data['is_slow'] ?? false,
            'is_n_plus_one' => $data['is_n_plus_one'] ?? false,
            'metadata' => $data['metadata'] ?? null,
            'sent_at' => $data['sent_at'],
        ]);

        broadcast(new QueryReceived([
            'id' => $query->id,
            'project_id' => $project->id,
            'sql' => $query->sql,
            'duration_ms' => $query->duration_ms,
            'connection' => $query->connection,
            'file' => $query->file,
            'line' => $query->line,
            'is_slow' => $query->is_slow,
            'is_n_plus_one' => $query->is_n_plus_one,
            'environment' => $query->environment,
            'sent_at' => $data['sent_at'],
        ]));

        if ($query->is_slow) {
            $this->coordinator->dispatchTeamWebhook($project, 'query.slow', [
                'message' => sprintf('Slow database query (%sms)', $query->duration_ms),
                'duration_ms' => $query->duration_ms,
                'connection' => $query->connection,
                'sql_excerpt' => mb_substr((string) $query->sql, 0, 280),
                'file' => $query->file,
                'line' => $query->line,
                'occurred_at' => is_string($data['sent_at'] ?? null)
                    ? $data['sent_at']
                    : now()->toIso8601String(),
            ]);
        }

        if ($query->is_n_plus_one) {
            $this->coordinator->dispatchTeamWebhook($project, 'query.n_plus_one', [
                'message' => 'N+1 database query detected',
                'duration_ms' => $query->duration_ms,
                'connection' => $query->connection,
                'sql_excerpt' => mb_substr((string) $query->sql, 0, 280),
                'file' => $query->file,
                'line' => $query->line,
                'occurred_at' => is_string($data['sent_at'] ?? null)
                    ? $data['sent_at']
                    : now()->toIso8601String(),
            ]);
        }
    }
}

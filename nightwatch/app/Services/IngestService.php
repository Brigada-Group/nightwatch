<?php

namespace App\Services;

use App\Models\Project;
use App\Services\Ingest\Recorders\CacheIngestRecorder;
use App\Services\Ingest\Recorders\CommandIngestRecorder;
use App\Services\Ingest\Recorders\ComposerAuditIngestRecorder;
use App\Services\Ingest\Recorders\ExceptionIngestRecorder;
use App\Services\Ingest\Recorders\HealthChecksIngestRecorder;
use App\Services\Ingest\Recorders\HeartbeatIngestRecorder;
use App\Services\Ingest\Recorders\JobIngestRecorder;
use App\Services\Ingest\Recorders\LogIngestRecorder;
use App\Services\Ingest\Recorders\MailIngestRecorder;
use App\Services\Ingest\Recorders\NotificationIngestRecorder;
use App\Services\Ingest\Recorders\NpmAuditIngestRecorder;
use App\Services\Ingest\Recorders\OutgoingHttpIngestRecorder;
use App\Services\Ingest\Recorders\QueryIngestRecorder;
use App\Services\Ingest\Recorders\RequestIngestRecorder;
use App\Services\Ingest\Recorders\ScheduledTaskIngestRecorder;

/**
 * Facade over ingest recorders (strategy objects). Each record* method delegates to a dedicated recorder.
 */
class IngestService
{
    public function __construct(
        private readonly HeartbeatIngestRecorder $heartbeat,
        private readonly ExceptionIngestRecorder $exception,
        private readonly RequestIngestRecorder $request,
        private readonly QueryIngestRecorder $query,
        private readonly JobIngestRecorder $job,
        private readonly LogIngestRecorder $log,
        private readonly OutgoingHttpIngestRecorder $outgoingHttp,
        private readonly MailIngestRecorder $mail,
        private readonly NotificationIngestRecorder $notification,
        private readonly CacheIngestRecorder $cache,
        private readonly CommandIngestRecorder $command,
        private readonly ScheduledTaskIngestRecorder $scheduledTask,
        private readonly HealthChecksIngestRecorder $healthChecks,
        private readonly ComposerAuditIngestRecorder $composerAudit,
        private readonly NpmAuditIngestRecorder $npmAudit,
    ) {}

    public function recordHeartbeat(Project $project, array $data): void
    {
        $this->heartbeat->record($project, $data);
    }

    public function recordException(Project $project, array $data): void
    {
        $this->exception->record($project, $data);
    }

    public function recordRequest(Project $project, array $data): void
    {
        $this->request->record($project, $data);
    }

    public function recordQuery(Project $project, array $data): void
    {
        $this->query->record($project, $data);
    }

    public function recordJob(Project $project, array $data): void
    {
        $this->job->record($project, $data);
    }

    public function recordLog(Project $project, array $data): void
    {
        $this->log->record($project, $data);
    }

    public function recordOutgoingHttp(Project $project, array $data): void
    {
        $this->outgoingHttp->record($project, $data);
    }

    public function recordMail(Project $project, array $data): void
    {
        $this->mail->record($project, $data);
    }

    public function recordNotification(Project $project, array $data): void
    {
        $this->notification->record($project, $data);
    }

    public function recordCache(Project $project, array $data): void
    {
        $this->cache->record($project, $data);
    }

    public function recordCommand(Project $project, array $data): void
    {
        $this->command->record($project, $data);
    }

    public function recordScheduledTask(Project $project, array $data): void
    {
        $this->scheduledTask->record($project, $data);
    }

    public function recordHealthChecks(Project $project, array $data): void
    {
        $this->healthChecks->record($project, $data);
    }

    public function recordComposerAudit(Project $project, array $data): void
    {
        $this->composerAudit->record($project, $data);
    }

    public function recordNpmAudit(Project $project, array $data): void
    {
        $this->npmAudit->record($project, $data);
    }
}

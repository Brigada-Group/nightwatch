<?php

namespace App\Services;

use App\Events\CacheReceived;
use App\Events\CommandReceived;
use App\Events\ExceptionReceived;
use App\Events\HeartbeatReceived;
use App\Events\HealthCheckReceived;
use App\Events\JobReceived;
use App\Events\LogReceived;
use App\Events\MailReceived;
use App\Events\NotificationReceived;
use App\Events\OutgoingHttpReceived;
use App\Events\ProjectStatusChanged;
use App\Events\QueryReceived;
use App\Events\RequestReceived;
use App\Events\ScheduledTaskReceived;
use App\Models\HubCache;
use App\Models\HubCommand;
use App\Models\HubException;
use App\Models\HubHealthCheck;
use App\Models\HubJob;
use App\Models\HubLog;
use App\Models\HubMail;
use App\Models\HubNotification;
use App\Models\HubOutgoingHttp;
use App\Models\HubQuery;
use App\Models\HubRequest;
use App\Models\HubScheduledTask;
use App\Models\Project;

class IngestService
{
    public function recordHeartbeat(Project $project, array $data): void
    {
        $project->update([
            'last_heartbeat_at' => now(),
            'metadata' => [
                'php_version' => $data['php_version'],
                'laravel_version' => $data['laravel_version'],
            ],
        ]);

        broadcast(new HeartbeatReceived([
            'project_id' => $project->id,
            'project_name' => $project->name,
            'status' => $project->status,
            'last_heartbeat_at' => $project->last_heartbeat_at->toIso8601String(),
            'metadata' => $project->metadata,
        ]));
    }

    public function recordException(Project $project, array $data): void
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

        $this->recalculateStatus($project);
    }

    public function recordRequest(Project $project, array $data): void
    {
        $hubRequest = HubRequest::create([
            'project_id' => $project->id,
            'environment' => $data['environment'],
            'server' => $data['server'],
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
    }

    public function recordQuery(Project $project, array $data): void
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
    }

    public function recordJob(Project $project, array $data): void
    {
        $job = HubJob::create([
            'project_id' => $project->id,
            'environment' => $data['environment'],
            'server' => $data['server'],
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
            $this->recalculateStatus($project);
        }
    }

    public function recordLog(Project $project, array $data): void
    {
        $log = HubLog::create([
            'project_id' => $project->id,
            'environment' => $data['environment'],
            'server' => $data['server'],
            'level' => $data['level'],
            'message' => $data['message'],
            'channel' => $data['channel'] ?? null,
            'context' => $data['context'] ?? null,
            'sent_at' => $data['sent_at'],
        ]);

        broadcast(new LogReceived([
            'id' => $log->id,
            'project_id' => $project->id,
            'level' => $log->level,
            'message' => $log->message,
            'channel' => $log->channel,
            'context' => $log->context,
            'environment' => $log->environment,
            'sent_at' => $data['sent_at'],
        ]));

        if (in_array($data['level'], ['emergency', 'alert', 'critical'])) {
            $this->recalculateStatus($project);
        }
    }

    public function recordOutgoingHttp(Project $project, array $data): void
    {
        $http = HubOutgoingHttp::create([
            'project_id' => $project->id,
            'environment' => $data['environment'],
            'server' => $data['server'],
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
    }

    public function recordMail(Project $project, array $data): void
    {
        $mail = HubMail::create([
            'project_id' => $project->id,
            'environment' => $data['environment'],
            'server' => $data['server'],
            'mailable' => $data['mailable'] ?? null,
            'subject' => $data['subject'] ?? null,
            'to' => $data['to'] ?? null,
            'status' => $data['status'],
            'error_message' => $data['error_message'] ?? null,
            'sent_at' => $data['sent_at'],
        ]);

        broadcast(new MailReceived([
            'id' => $mail->id,
            'project_id' => $project->id,
            'mailable' => $mail->mailable,
            'subject' => $mail->subject,
            'to' => $mail->to,
            'status' => $mail->status,
            'error_message' => $mail->error_message,
            'environment' => $mail->environment,
            'sent_at' => $data['sent_at'],
        ]));
    }

    public function recordNotification(Project $project, array $data): void
    {
        $notification = HubNotification::create([
            'project_id' => $project->id,
            'environment' => $data['environment'],
            'server' => $data['server'],
            'notification_class' => $data['notification_class'],
            'channel' => $data['channel'],
            'notifiable_type' => $data['notifiable_type'],
            'notifiable_id' => $data['notifiable_id'] ?? null,
            'status' => $data['status'],
            'error_message' => $data['error_message'] ?? null,
            'sent_at' => $data['sent_at'],
        ]);

        broadcast(new NotificationReceived([
            'id' => $notification->id,
            'project_id' => $project->id,
            'notification_class' => $notification->notification_class,
            'channel' => $notification->channel,
            'notifiable_type' => $notification->notifiable_type,
            'notifiable_id' => $notification->notifiable_id,
            'status' => $notification->status,
            'error_message' => $notification->error_message,
            'environment' => $notification->environment,
            'sent_at' => $data['sent_at'],
        ]));
    }

    public function recordCache(Project $project, array $data): void
    {
        $cache = HubCache::create([
            'project_id' => $project->id,
            'environment' => $data['environment'],
            'server' => $data['server'],
            'store' => $data['store'],
            'hits' => $data['hits'],
            'misses' => $data['misses'],
            'writes' => $data['writes'],
            'forgets' => $data['forgets'],
            'hit_rate' => $data['hit_rate'] ?? null,
            'period_start' => $data['period_start'] ?? null,
            'sent_at' => $data['sent_at'],
        ]);

        broadcast(new CacheReceived([
            'id' => $cache->id,
            'project_id' => $project->id,
            'store' => $cache->store,
            'hits' => $cache->hits,
            'misses' => $cache->misses,
            'writes' => $cache->writes,
            'forgets' => $cache->forgets,
            'hit_rate' => $cache->hit_rate,
            'period_start' => $cache->period_start,
            'environment' => $cache->environment,
            'sent_at' => $data['sent_at'],
        ]));
    }

    public function recordCommand(Project $project, array $data): void
    {
        $command = HubCommand::create([
            'project_id' => $project->id,
            'environment' => $data['environment'],
            'server' => $data['server'],
            'command' => $data['command'],
            'exit_code' => $data['exit_code'] ?? null,
            'duration_ms' => $data['duration_ms'] ?? null,
            'sent_at' => $data['sent_at'],
        ]);

        broadcast(new CommandReceived([
            'id' => $command->id,
            'project_id' => $project->id,
            'command' => $command->command,
            'exit_code' => $command->exit_code,
            'duration_ms' => $command->duration_ms,
            'environment' => $command->environment,
            'sent_at' => $data['sent_at'],
        ]));
    }

    public function recordScheduledTask(Project $project, array $data): void
    {
        $task = HubScheduledTask::create([
            'project_id' => $project->id,
            'environment' => $data['environment'],
            'server' => $data['server'],
            'task' => $data['task'],
            'description' => $data['description'] ?? null,
            'expression' => $data['expression'] ?? null,
            'status' => $data['status'],
            'duration_ms' => $data['duration_ms'] ?? null,
            'output' => $data['output'] ?? null,
            'sent_at' => $data['sent_at'],
        ]);

        broadcast(new ScheduledTaskReceived([
            'id' => $task->id,
            'project_id' => $project->id,
            'task' => $task->task,
            'description' => $task->description,
            'expression' => $task->expression,
            'status' => $task->status,
            'duration_ms' => $task->duration_ms,
            'output' => $task->output,
            'environment' => $task->environment,
            'sent_at' => $data['sent_at'],
        ]));

        if ($data['status'] === 'failed') {
            $this->recalculateStatus($project);
        }
    }

    public function recordHealthChecks(Project $project, array $data): void
    {
        foreach ($data['checks'] as $check) {
            HubHealthCheck::create([
                'project_id' => $project->id,
                'environment' => $data['environment'],
                'server' => $data['server'],
                'check_name' => $check['name'],
                'status' => $check['status'],
                'message' => $check['message'] ?? null,
                'metadata' => $check['metadata'] ?? null,
                'sent_at' => $data['sent_at'],
            ]);
        }

        broadcast(new HealthCheckReceived([
            'project_id' => $project->id,
            'checks' => $data['checks'],
            'environment' => $data['environment'],
            'server' => $data['server'],
            'sent_at' => $data['sent_at'],
        ]));

        $this->recalculateStatus($project);
    }

    private function recalculateStatus(Project $project): void
    {
        $oldStatus = $project->status;

        $recentCritical = HubHealthCheck::where('project_id', $project->id)
            ->where('created_at', '>=', now()->subMinutes(10))
            ->whereIn('status', ['critical', 'error'])
            ->exists();

        $recentExceptions = HubException::where('project_id', $project->id)
            ->where('created_at', '>=', now()->subMinutes(10))
            ->count();

        if ($recentCritical || $recentExceptions >= 10) {
            $newStatus = 'critical';
        } elseif ($recentExceptions >= 3) {
            $newStatus = 'warning';
        } else {
            $newStatus = 'normal';
        }

        if ($oldStatus !== $newStatus) {
            $project->update(['status' => $newStatus]);

            broadcast(new ProjectStatusChanged([
                'project_id' => $project->id,
                'project_name' => $project->name,
                'old_status' => $oldStatus,
                'new_status' => $newStatus,
            ]));
        }
    }
}

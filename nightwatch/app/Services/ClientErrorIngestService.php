<?php

namespace App\Services;

use App\Models\ClientErrorEvent;
use App\Models\Project;
use Carbon\Carbon;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Str;

class ClientErrorIngestService
{
    public function __construct(
        private readonly WebhookDispatcherService $webhooks,
    ) {}

    public function store(Project $project, array $validated, array $rawPayload): ClientErrorEvent
    {
        $payloadProjectId = (string) $validated['project_id'];
        $expectedProjectId = (string) $project->project_uuid;

        if ($payloadProjectId !== $expectedProjectId && $payloadProjectId !== (string) $project->id) {
            throw new AuthorizationException('project_mismatch');
        }

        $requestUrl = $validated['url'] ?? null;

        $normalizedUrl = is_string($requestUrl) && str_starts_with($requestUrl, 'GET ')
            ? substr($requestUrl, 4)
            : $requestUrl;

        $occurredAt = isset($validated['created_at'])
            ? Carbon::parse((string) $validated['created_at'])
            : Carbon::parse((string) $validated['sent_at']);

        $fingerprint = $this->fingerprint(
            (string) $validated['exception_class'],
            (string) ($validated['file'] ?? ''),
            (int) ($validated['line'] ?? 0),
            (string) $validated['message'],
        );

        $event = ClientErrorEvent::create([
            'project_id' => $payloadProjectId,
            'environment' => $validated['environment'],
            'server' => $validated['server'],
            'sent_at' => Carbon::parse((string) $validated['sent_at']),
            'runtime' => $validated['runtime'] ?? 'javascript',
            'exception_class' => $validated['exception_class'],
            'message' => Str::limit((string) $validated['message'], 2000),
            'source_file' => $validated['file'] ?? null,
            'line' => (int) ($validated['line'] ?? 0),
            'colno' => $validated['colno'] ?? null,
            'request_url' => $normalizedUrl,
            'status_code' => (int) ($validated['status_code'] ?? 0),
            'ip' => $validated['ip'] ?? null,
            'headers' => $validated['headers'] ?? null,
            'stack_trace' => $validated['stack_trace'] ?? null,
            'component_stack' => $validated['component_stack'] ?? null,
            'severity' => $validated['severity'] ?? 'error',
            'user_payload' => $validated['user_data'] ?? ($validated['user_payload'] ?? ($validated['user'] ?? [])),
            'fingerprint' => $fingerprint,
            'occurred_at' => $occurredAt,
            'received_at' => now(),
            'raw_payload' => $rawPayload,
        ]);

        $this->webhooks->dispatchToTeam(
            $project->team_id,
            'client_error.created',
            [
                'event_type' => 'client_error.created',
                'project' => [
                    'id' => $project->id,
                    'uuid' => $project->project_uuid,
                    'name' => $project->name,
                    'environment' => $project->environment,
                ],
                'data' => [
                    'severity' => $event->severity,
                    'runtime' => $event->runtime,
                    'exception_class' => $event->exception_class,
                    'message' => $event->message,
                    'source_file' => $event->source_file,
                    'line' => $event->line,
                    'request_url' => $event->request_url,
                    'fingerprint' => $event->fingerprint,
                    'user_payload' => $event->user_payload,
                    'occurred_at' => optional($event->occurred_at)?->toIso8601String(),
                ],
                'guardian_url' => config('app.url'),
            ]
        );

        return $event;
    }

    private function fingerprint(string $class, string $file, int $line, string $message): string
    {
        return hash('sha256', implode('|', [
            'javascript',
            $class,
            $file,
            (string) $line,
            Str::before($message, "\n"),
        ]));
    }
}

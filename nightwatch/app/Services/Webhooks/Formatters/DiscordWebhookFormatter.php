<?php

namespace App\Services\Webhooks\Formatters;

class DiscordWebhookFormatter
{
    public function format(array $payload): array
    {
        $eventType = (string) ($payload['event_type'] ?? 'event');
        $project = (array) ($payload['project'] ?? []);
        $data = (array) ($payload['data'] ?? []);

        $projectName = (string) ($project['name'] ?? 'Unknown project');
        $projectEnv = (string) ($project['environment'] ?? 'unknown');
        $message = (string) ($data['message'] ?? 'No message');
        $severity = (string) ($data['severity'] ?? $data['status'] ?? 'info');
        $occurredAt = (string) ($data['occurred_at'] ?? $payload['occurred_at'] ?? now()->toIso8601String());

        return [
            'content' => sprintf('`%s` · **%s**', $eventType, $projectName),
            'embeds' => [
                [
                    'title' => sprintf('%s alert', $eventType),
                    'description' => $message,
                    'fields' => [
                        [
                            'name' => 'Environment',
                            'value' => $projectEnv,
                            'inline' => true,
                        ],
                        [
                            'name' => 'Severity/Status',
                            'value' => $severity,
                            'inline' => true,
                        ],
                    ],
                    'timestamp' => $occurredAt,
                ],
            ],
        ];
    }
}

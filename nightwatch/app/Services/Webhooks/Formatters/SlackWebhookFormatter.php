<?php

namespace App\Services\Webhooks\Formatters;

class SlackWebhookFormatter
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

        return [
            'text' => sprintf('[%s] %s · %s', $eventType, $projectName, $message),
            'blocks' => [
                [
                    'type' => 'header',
                    'text' => [
                        'type' => 'plain_text',
                        'text' => sprintf('%s · %s', $eventType, $projectName),
                    ],
                ],
                [
                    'type' => 'section',
                    'fields' => [
                        [
                            'type' => 'mrkdwn',
                            'text' => "*Environment:*\n{$projectEnv}",
                        ],
                        [
                            'type' => 'mrkdwn',
                            'text' => "*Severity/Status:*\n{$severity}",
                        ],
                    ],
                ],
                [
                    'type' => 'section',
                    'text' => [
                        'type' => 'mrkdwn',
                        'text' => "*Message:*\n{$message}",
                    ],
                ],
            ],
        ];
    }
}

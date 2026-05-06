<?php

namespace App\Services;

use App\Models\WebhookDelivery;
use App\Models\WebhookDestination;
use App\Services\Webhooks\Formatters\DiscordWebhookFormatter;
use App\Services\Webhooks\Formatters\GenericWebhookFormatter;
use App\Services\Webhooks\Formatters\SlackWebhookFormatter;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class WebhookDispatcherService
{
    public const DEFAULT_TIMEOUT_SECONDS = 5;

    public const DEFAULT_CONNECT_TIMEOUT_SECONDS = 3;

    public function __construct(
        private readonly GenericWebhookFormatter $genericFormatter,
        private readonly SlackWebhookFormatter $slackFormatter,
        private readonly DiscordWebhookFormatter $discordFormatter,
    ) {}

    public function dispatchToTeam(
        int $teamId,
        string $eventType,
        array $payload,
        ?string $eventId = null
    ): int {
        $eventId ??= (string) Str::uuid();

        $destinations = WebhookDestination::query()
            ->where('team_id', $teamId)
            ->where('enabled', true)
            ->get();

        $successCount = 0;

        foreach ($destinations as $destination) {
            if (! $destination->listensTo($eventType)) {
                continue;
            }

            if (! $this->passesFilters($destination, $payload)) {
                continue;
            }

            $delivered = $this->deliver(
                destination: $destination,
                eventType: $eventType,
                eventId: $eventId,
                payload: $payload,
                attempt: 1
            );

            if ($delivered) {
                $successCount++;
            }
        }

        return $successCount;
    }

    public function deliver(
        WebhookDestination $destination,
        string $eventType,
        string $eventId,
        array $payload,
        int $attempt = 1
    ): bool {
        $formattedPayload = $this->formatPayload($destination, $payload);
        $headers = $this->buildHeaders($destination, $eventType, $eventId, $formattedPayload);

        $delivery = WebhookDelivery::create([
            'destination_id' => $destination->id,
            'event_type' => $eventType,
            'event_id' => $eventId,
            'attempt' => $attempt,
            'request_headers' => $headers,
            'request_body' => $formattedPayload,
        ]);

        try {
            $response = Http::timeout(self::DEFAULT_TIMEOUT_SECONDS)
                ->connectTimeout(self::DEFAULT_CONNECT_TIMEOUT_SECONDS)
                ->withHeaders($headers)
                ->post($destination->url, $formattedPayload);

            $delivery->forceFill([
                'response_status' => $response->status(),
                'response_body' => Str::limit((string) $response->body(), 5000, ''),
            ])->save();

            if ($response->successful()) {
                $delivery->forceFill([
                    'delivered_at' => Carbon::now(),
                    'failed_at' => null,
                    'next_retry_at' => null,
                    'error_message' => null,
                ])->save();

                return true;
            }

            $delivery->forceFill([
                'failed_at' => Carbon::now(),
                'error_message' => 'Non-2xx webhook response',
            ])->save();

            return false;
        } catch (ConnectionException|RequestException|\Throwable $e) {
            $delivery->forceFill([
                'failed_at' => Carbon::now(),
                'error_message' => Str::limit($e->getMessage(), 1000, ''),
            ])->save();

            return false;
        }
    }

    private function buildHeaders(
        WebhookDestination $destination,
        string $eventType,
        string $eventId,
        array $payload
    ): array {
        $headers = [
            'Content-Type' => 'application/json',
            'User-Agent' => 'Guardian-Webhooks/1.0',
            'X-Guardian-Event' => $eventType,
            'X-Guardian-Event-Id' => $eventId,
            'X-Guardian-Timestamp' => (string) Carbon::now()->timestamp,
        ];

        if ($destination->secret) {
            $json = (string) json_encode($payload, JSON_UNESCAPED_SLASHES);
            $signature = hash_hmac('sha256', $json, $destination->secret);
            $headers['X-Guardian-Signature'] = 'sha256='.$signature;
        }

        return $headers;
    }

    private function formatPayload(WebhookDestination $destination, array $payload): array
    {
        return match ($destination->provider) {
            WebhookDestination::PROVIDER_SLACK => $this->slackFormatter->format($payload),
            WebhookDestination::PROVIDER_DISCORD => $this->discordFormatter->format($payload),
            default => $this->genericFormatter->format($payload),
        };
    }

    private function passesFilters(WebhookDestination $destination, array $payload): bool
    {
        $filters = $destination->filters ?? [];

        if (! is_array($filters) || $filters === []) {
            return true;
        }

        if (isset($filters['environments']) && is_array($filters['environments'])) {
            $env = data_get($payload, 'project.environment');
            if ($env !== null && ! in_array($env, $filters['environments'], true)) {
                return false;
            }
        }

        if (isset($filters['project_ids']) && is_array($filters['project_ids'])) {
            $projectId = data_get($payload, 'project.id');
            if ($projectId !== null && ! in_array((int) $projectId, array_map('intval', $filters['project_ids']), true)) {
                return false;
            }
        }

        return true;
    }
}

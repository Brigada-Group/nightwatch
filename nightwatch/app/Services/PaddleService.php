<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class PaddleService
{
    public function createTransaction(string $priceId, string $email): array
    {
        $baseUrl = $this->resolveBaseUrl();
        $apiKey = trim((string) config('services.paddle.api_key', ''));
        $isSandbox = Str::contains($baseUrl, 'sandbox');
        $shouldSendCustomerEmail = ! app()->environment('local') && ! $isSandbox;
        $successUrl = $this->resolveSuccessUrl();
        $cancelUrl = $this->resolveCancelUrl();

        if ($apiKey === '') {
            throw new \RuntimeException('Paddle API key is missing. Set PADDLE_API_KEY in your environment.');
        }

        $payload = [
            'items' => [
                [
                    'price_id' => $priceId,
                    'quantity' => 1,
                ],
            ],
            'collection_mode' => 'automatic',
            'checkout' => [
                'success_url' => $successUrl,
                'cancel_url' => $cancelUrl,
            ],
            'custom_data' => [
                'source' => 'landing_pricing',
            ],
        ];

        // In local/sandbox, avoid attaching a customer to prevent checkout auto-skips.
        if ($shouldSendCustomerEmail) {
            $payload['customer'] = [
                'email' => $email,
            ];
        }

        $response = Http::withToken($apiKey)
            ->acceptJson()
            ->post($baseUrl.'/transactions', $payload);

        Log::info('Paddle transaction raw response', [
            'status' => $response->status(),
            'ok' => $response->ok(),
            'response_body' => $response->json() ?? $response->body(),
        ]);

        $response = $response
            ->throw()
            ->json();

        $checkoutUrl = data_get($response, 'data.checkout.url');

        return [
            'transaction_id' => data_get($response, 'data.id'),
            'status' => data_get($response, 'data.status'),
            'checkout_url' => $checkoutUrl,
            'has_checkout_url' => Str::of((string) $checkoutUrl)->isNotEmpty(),
            'diagnostics' => [
                'base_url' => $baseUrl,
                'success_url' => $successUrl,
                'cancel_url' => $cancelUrl,
                'api_key_prefix' => Str::substr($apiKey, 0, 14),
                'api_key_suffix' => Str::substr($apiKey, -6),
                'api_key_length' => Str::length($apiKey),
                'api_key_sha256' => hash('sha256', $apiKey),
            ],
            'raw' => $response,
        ];
    }

    private function resolveBaseUrl(): string
    {
        return rtrim((string) config('services.paddle.base_url', 'https://sandbox-api.paddle.com'), '/');
    }

    private function resolveSuccessUrl(): string
    {
        return (string) config('services.paddle.success_url');
    }

    private function resolveCancelUrl(): string
    {
        return (string) config('services.paddle.cancel_url');
    }
}
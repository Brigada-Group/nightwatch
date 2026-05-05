<?php

namespace App\Services\Github;

use App\Models\GithubInstallation;
use Illuminate\Support\Facades\Http;
use RuntimeException;

/**
 * Issues GitHub App credentials.
 *
 * Two token types are involved: a short-lived RS256 JWT signed with the App's
 * private key (acts as the App itself, valid 10 min), and an installation
 * access token obtained by exchanging the JWT (acts as the App on a specific
 * installation, valid 1 hour). Installation tokens are cached on the row
 * until two minutes before expiry to avoid hammering the exchange endpoint.
 */
class GithubAppAuth
{
    private const JWT_TTL_SECONDS = 540; // 9 minutes — GitHub's max is 10
    private const INSTALLATION_TOKEN_REFRESH_BUFFER = 120;

    public function appJwt(): string
    {
        $appId = config('services.github.app_id');
        $privateKey = $this->normalizePrivateKey((string) config('services.github.private_key', ''));

        if (! $appId || $privateKey === '') {
            throw new RuntimeException('GitHub App credentials are not configured.');
        }

        $now = time();
        $header = ['alg' => 'RS256', 'typ' => 'JWT'];
        $payload = [
            'iat' => $now - 30,
            'exp' => $now + self::JWT_TTL_SECONDS,
            'iss' => (string) $appId,
        ];

        $encodedHeader = $this->base64UrlEncode(json_encode($header, JSON_UNESCAPED_SLASHES));
        $encodedPayload = $this->base64UrlEncode(json_encode($payload, JSON_UNESCAPED_SLASHES));
        $signingInput = $encodedHeader.'.'.$encodedPayload;

        $signature = '';
        $key = openssl_pkey_get_private($privateKey);

        if ($key === false) {
            throw new RuntimeException('GitHub App private key could not be parsed.');
        }

        if (! openssl_sign($signingInput, $signature, $key, OPENSSL_ALGO_SHA256)) {
            throw new RuntimeException('Failed to sign GitHub App JWT.');
        }

        return $signingInput.'.'.$this->base64UrlEncode($signature);
    }

    public function installationToken(GithubInstallation $installation): string
    {
        if ($this->installationTokenIsFresh($installation)) {
            return (string) $installation->access_token;
        }

        $base = rtrim((string) config('services.github.api_base'), '/');

        $response = Http::withToken($this->appJwt())
            ->withHeaders([
                'Accept' => 'application/vnd.github+json',
                'X-GitHub-Api-Version' => '2022-11-28',
            ])
            ->post($base.'/app/installations/'.$installation->installation_id.'/access_tokens');

        if (! $response->successful()) {
            throw new RuntimeException(
                'Failed to fetch installation token: '.$response->status().' '.$response->body()
            );
        }

        $data = $response->json();
        $token = (string) ($data['token'] ?? '');
        $expiresAt = isset($data['expires_at']) ? \Carbon\Carbon::parse($data['expires_at']) : now()->addHour();

        if ($token === '') {
            throw new RuntimeException('GitHub returned an empty installation token.');
        }

        $installation->forceFill([
            'access_token' => $token,
            'access_token_expires_at' => $expiresAt,
        ])->save();

        return $token;
    }

    private function installationTokenIsFresh(GithubInstallation $installation): bool
    {
        if (empty($installation->access_token) || $installation->access_token_expires_at === null) {
            return false;
        }

        return $installation->access_token_expires_at->getTimestamp()
            > time() + self::INSTALLATION_TOKEN_REFRESH_BUFFER;
    }

    private function normalizePrivateKey(string $key): string
    {
        // The .env value typically contains literal "\n" sequences. Restore
        // them to real newlines so openssl_pkey_get_private can parse the PEM.
        return str_replace('\\n', "\n", $key);
    }

    private function base64UrlEncode(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }
}

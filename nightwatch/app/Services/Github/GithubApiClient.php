<?php

namespace App\Services\Github;

use App\Models\GithubInstallation;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;

/**
 * Thin wrapper that prepares an HTTP client pre-authenticated for either the
 * GitHub App itself (JWT) or a specific installation (installation access
 * token). All callers should reach GitHub through one of these factories so
 * headers, base URL, and auth stay consistent.
 */
class GithubApiClient
{
    public function __construct(private readonly GithubAppAuth $auth) {}

    public function asApp(): PendingRequest
    {
        return $this->base()->withToken($this->auth->appJwt());
    }

    public function asInstallation(GithubInstallation $installation): PendingRequest
    {
        return $this->base()->withToken($this->auth->installationToken($installation));
    }

    private function base(): PendingRequest
    {
        $base = rtrim((string) config('services.github.api_base'), '/');

        return Http::baseUrl($base)
            ->timeout(15)
            ->connectTimeout(5)
            ->acceptJson()
            ->withHeaders([
                'Accept' => 'application/vnd.github+json',
                'X-GitHub-Api-Version' => '2022-11-28',
                'User-Agent' => 'Guardian-GitHub-App',
            ]);
    }
}

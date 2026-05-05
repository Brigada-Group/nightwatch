<?php

namespace App\Http\Controllers\Webhooks;

use App\Http\Controllers\Controller;
use App\Models\GithubInstallation;
use App\Services\Github\GithubInstallationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class GithubWebhookController extends Controller
{
    public function __construct(
        private readonly GithubInstallationService $installationService,
    ) {}

    public function handle(Request $request): JsonResponse
    {
        $event = (string) $request->header('X-GitHub-Event', '');
        $payload = $request->all();

        // First-pass handler: only the events we already need to keep our
        // local state in sync. Everything else gets a 202 ack so GitHub
        // doesn't retry; richer routing lands when we wire AI flows.
        switch ($event) {
            case 'installation':
                $this->onInstallation($payload);
                break;

            case 'installation_repositories':
                $this->onInstallationRepositories($payload);
                break;

            case 'ping':
            default:
                break;
        }

        return response()->json(['ok' => true], 202);
    }

    private function onInstallation(array $payload): void
    {
        $action = (string) ($payload['action'] ?? '');
        $installationId = (int) ($payload['installation']['id'] ?? 0);

        if ($installationId === 0) {
            return;
        }

        $installation = GithubInstallation::where('installation_id', $installationId)->first();

        if ($installation === null) {
            // We saw a webhook before our setup callback persisted the row;
            // skip silently — the setup callback will catch up shortly.
            return;
        }

        if (in_array($action, ['deleted', 'suspend', 'unsuspend'], true)) {
            if ($action === 'deleted') {
                $this->installationService->disconnect($installation);

                return;
            }

            $installation->forceFill([
                'suspended_at' => $action === 'suspend' ? now() : null,
            ])->save();

            return;
        }

        try {
            $this->installationService->syncFromInstallationId(
                $installationId,
                $installation->team,
                $installation->installedBy,
            );
        } catch (\Throwable $e) {
            Log::warning('GitHub installation sync failed', [
                'installation_id' => $installationId,
                'error' => $e->getMessage(),
            ]);
        }
    }

    private function onInstallationRepositories(array $payload): void
    {
        $installationId = (int) ($payload['installation']['id'] ?? 0);

        if ($installationId === 0) {
            return;
        }

        $installation = GithubInstallation::where('installation_id', $installationId)->first();

        if ($installation === null) {
            return;
        }

        try {
            $this->installationService->syncRepositories($installation);
        } catch (\Throwable $e) {
            Log::warning('GitHub repository sync failed', [
                'installation_id' => $installationId,
                'error' => $e->getMessage(),
            ]);
        }
    }
}

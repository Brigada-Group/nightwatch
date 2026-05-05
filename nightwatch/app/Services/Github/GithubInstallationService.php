<?php

namespace App\Services\Github;

use App\Models\GithubInstallation;
use App\Models\GithubRepository;
use App\Models\Team;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use RuntimeException;

/**
 * Orchestrates the lifecycle of a GitHub App installation: fetch metadata
 * from GitHub, persist (or update) the row scoped to a team, and keep the
 * cached repository list in sync. Each public method is idempotent so the
 * setup callback and webhook handlers can both reach for them safely.
 */
class GithubInstallationService
{
    public function __construct(
        private readonly GithubAppAuth $auth,
        private readonly GithubApiClient $api,
    ) {}

    /**
     * Persist (or update) the installation row for the given team using
     * GitHub's authoritative metadata, then sync the repository list. Called
     * from the setup callback right after GitHub redirects the admin back.
     */
    public function syncFromInstallationId(int $installationId, Team $team, ?User $installer = null): GithubInstallation
    {
        $response = $this->api->asApp()->get('/app/installations/'.$installationId);

        if (! $response->successful()) {
            throw new RuntimeException(
                'Could not load GitHub installation '.$installationId.': '.$response->status().' '.$response->body()
            );
        }

        $payload = $response->json();
        $account = $payload['account'] ?? [];

        $installation = GithubInstallation::updateOrCreate(
            ['installation_id' => $installationId],
            [
                'team_id' => $team->id,
                'installed_by_user_id' => $installer?->id,
                'account_id' => (int) ($account['id'] ?? 0),
                'account_login' => (string) ($account['login'] ?? ''),
                'account_type' => (string) ($account['type'] ?? 'User'),
                'target_type' => (string) ($payload['target_type'] ?? 'User'),
                'repository_selection' => (string) ($payload['repository_selection'] ?? 'selected'),
                'permissions' => $payload['permissions'] ?? null,
                'events' => $payload['events'] ?? null,
                'suspended_at' => isset($payload['suspended_at']) ? Carbon::parse($payload['suspended_at']) : null,
            ],
        );

        $this->syncRepositories($installation);

        return $installation;
    }

    /**
     * Pull the full repository list visible to this installation and replace
     * the local cache for repos that aren't yet linked to a project. Linked
     * repos are preserved (we just refresh metadata) so admins don't lose
     * project↔repo connections when the GitHub repo list changes.
     */
    public function syncRepositories(GithubInstallation $installation): void
    {
        $page = 1;
        $perPage = 100;
        $seenIds = [];

        do {
            $response = $this->api->asInstallation($installation)
                ->get('/installation/repositories', [
                    'per_page' => $perPage,
                    'page' => $page,
                ]);

            if (! $response->successful()) {
                throw new RuntimeException(
                    'Failed to list installation repositories: '.$response->status().' '.$response->body()
                );
            }

            $body = $response->json();
            $repositories = $body['repositories'] ?? [];
            $totalCount = (int) ($body['total_count'] ?? 0);

            foreach ($repositories as $repo) {
                $repoId = (int) ($repo['id'] ?? 0);

                if ($repoId === 0) {
                    continue;
                }

                $seenIds[] = $repoId;

                GithubRepository::updateOrCreate(
                    [
                        'github_installation_id' => $installation->id,
                        'github_repo_id' => $repoId,
                    ],
                    [
                        'full_name' => (string) ($repo['full_name'] ?? ''),
                        'name' => (string) ($repo['name'] ?? ''),
                        'default_branch' => $repo['default_branch'] ?? null,
                        'private' => (bool) ($repo['private'] ?? false),
                        'pushed_at' => isset($repo['pushed_at']) ? Carbon::parse($repo['pushed_at']) : null,
                    ],
                );
            }

            $page++;
            $fetched = ($page - 1) * $perPage;
        } while (! empty($repositories) && $fetched < $totalCount);

        // Drop repos no longer visible to this installation, but keep ones
        // already linked to a project so the admin can fix the link rather
        // than silently lose the connection.
        GithubRepository::query()
            ->where('github_installation_id', $installation->id)
            ->whereNotIn('github_repo_id', $seenIds)
            ->whereNull('project_id')
            ->delete();
    }

    public function disconnect(GithubInstallation $installation): void
    {
        DB::transaction(function () use ($installation): void {
            $installation->repositories()->delete();
            $installation->delete();
        });
    }
}

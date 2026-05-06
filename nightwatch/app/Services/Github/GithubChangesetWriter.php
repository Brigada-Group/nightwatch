<?php

namespace App\Services\Github;

use App\Models\GithubRepository;
use Illuminate\Http\Client\PendingRequest;
use RuntimeException;

/**
 * Mechanical "apply a set of file changes as a pull request" against any
 * GithubRepository. Uses the Git Data API end-to-end (blobs → tree → commit
 * → ref → PR) so the resulting PR has a single clean commit instead of one
 * commit per file, and so we never round-trip through the higher-level
 * Contents API which forces commit-per-PUT semantics.
 *
 * Has no knowledge of AiFixAttempt, exceptions, or any product concept —
 * caller passes the changeset and metadata. Reused by:
 *   - AiFixApplyService (assignee-driven Accept flow)
 *   - Self-Heal (planned: same writer, dispatched directly from a job)
 *
 * Required GitHub App permissions (configured at the App level):
 *   - contents: write   (blobs / trees / commits / refs)
 *   - pull_requests: write   (opening the PR)
 */
class GithubChangesetWriter
{
    public function __construct(private readonly GithubApiClient $api) {}

    /**
     * Build a single commit on a brand-new branch from `$baseCommitSha` and
     * open a PR back to `$targetBranch` (defaults to the repo's default
     * branch). Returns the bookkeeping the caller needs to surface a "View
     * PR" link to the user.
     *
     * Throws RuntimeException with a useful message on any GitHub API
     * failure; the caller decides whether to surface as user-facing error
     * or retry.
     *
     * @param  list<array{path: string, content: string}>  $changes
     * @return array{
     *     branch_name: string,
     *     commit_sha: string,
     *     base_branch: string,
     *     pr_url: string,
     *     pr_number: int
     * }
     */
    public function applyAsPullRequest(
        GithubRepository $repository,
        string $baseCommitSha,
        array $changes,
        string $branchName,
        string $commitMessage,
        string $prTitle,
        string $prBody,
        ?string $targetBranch = null,
    ): array {
        if ($changes === []) {
            throw new RuntimeException('Refusing to open a PR with no file changes.');
        }

        $repository->loadMissing('installation');
        $client = $this->api->asInstallation($repository->installation);
        $fullName = $repository->full_name;
        $resolvedBase = $targetBranch ?? $repository->default_branch ?? 'main';

        $baseCommit = $this->fetchCommit($client, $fullName, $baseCommitSha);
        $baseTreeSha = (string) ($baseCommit['tree']['sha'] ?? '');

        if ($baseTreeSha === '') {
            throw new RuntimeException('Base commit '.$baseCommitSha.' has no tree.');
        }

        $treeEntries = [];
        foreach ($changes as $change) {
            $blobSha = $this->createBlob($client, $fullName, $change['content']);

            $treeEntries[] = [
                'path' => $change['path'],
                'mode' => '100644',
                'type' => 'blob',
                'sha' => $blobSha,
            ];
        }

        $newTreeSha = $this->createTree($client, $fullName, $baseTreeSha, $treeEntries);
        $newCommitSha = $this->createCommit($client, $fullName, $commitMessage, $newTreeSha, [$baseCommitSha]);
        $this->createBranchRef($client, $fullName, $branchName, $newCommitSha);

        $pr = $this->openPullRequest(
            $client,
            $fullName,
            head: $branchName,
            base: $resolvedBase,
            title: $prTitle,
            body: $prBody,
        );

        return [
            'branch_name' => $branchName,
            'commit_sha' => $newCommitSha,
            'base_branch' => $resolvedBase,
            'pr_url' => (string) $pr['html_url'],
            'pr_number' => (int) $pr['number'],
        ];
    }

    /**
     * Generate a unique-enough branch name for an apply operation. Caller
     * may override by passing their own `$branchName` to applyAsPullRequest;
     * this is just a sensible default that won't collide.
     */
    public function generateBranchName(string $prefix = 'guardian-ai-fix'): string
    {
        return sprintf('%s/%s-%s', $prefix, now()->format('Ymd-His'), bin2hex(random_bytes(3)));
    }

    private function fetchCommit(PendingRequest $client, string $fullName, string $sha): array
    {
        $response = $client->get(sprintf('/repos/%s/git/commits/%s', $fullName, $sha));

        if (! $response->successful()) {
            throw new RuntimeException(
                'Failed to fetch base commit '.$sha.' on '.$fullName.': '
                .$response->status().' '.$response->body(),
            );
        }

        return $response->json() ?? [];
    }

    private function createBlob(PendingRequest $client, string $fullName, string $content): string
    {
        $response = $client->post(sprintf('/repos/%s/git/blobs', $fullName), [
            'content' => base64_encode($content),
            'encoding' => 'base64',
        ]);

        if (! $response->successful()) {
            throw new RuntimeException(
                'Failed to create blob on '.$fullName.': '
                .$response->status().' '.$response->body(),
            );
        }

        return (string) $response->json('sha');
    }

    /**
     * @param  list<array{path: string, mode: string, type: string, sha: string}>  $entries
     */
    private function createTree(
        PendingRequest $client,
        string $fullName,
        string $baseTreeSha,
        array $entries,
    ): string {
        $response = $client->post(sprintf('/repos/%s/git/trees', $fullName), [
            'base_tree' => $baseTreeSha,
            'tree' => $entries,
        ]);

        if (! $response->successful()) {
            throw new RuntimeException(
                'Failed to create tree on '.$fullName.': '
                .$response->status().' '.$response->body(),
            );
        }

        return (string) $response->json('sha');
    }

    /**
     * @param  list<string>  $parentShas
     */
    private function createCommit(
        PendingRequest $client,
        string $fullName,
        string $message,
        string $treeSha,
        array $parentShas,
    ): string {
        $response = $client->post(sprintf('/repos/%s/git/commits', $fullName), [
            'message' => $message,
            'tree' => $treeSha,
            'parents' => $parentShas,
        ]);

        if (! $response->successful()) {
            throw new RuntimeException(
                'Failed to create commit on '.$fullName.': '
                .$response->status().' '.$response->body(),
            );
        }

        return (string) $response->json('sha');
    }

    private function createBranchRef(
        PendingRequest $client,
        string $fullName,
        string $branchName,
        string $commitSha,
    ): void {
        $response = $client->post(sprintf('/repos/%s/git/refs', $fullName), [
            'ref' => 'refs/heads/'.$branchName,
            'sha' => $commitSha,
        ]);

        if (! $response->successful()) {
            // 422 here typically means the ref already exists. Surface the
            // raw GitHub message so the caller can decide whether to retry
            // with a different branch name.
            throw new RuntimeException(
                'Failed to create branch '.$branchName.' on '.$fullName.': '
                .$response->status().' '.$response->body(),
            );
        }
    }

    private function openPullRequest(
        PendingRequest $client,
        string $fullName,
        string $head,
        string $base,
        string $title,
        string $body,
    ): array {
        $response = $client->post(sprintf('/repos/%s/pulls', $fullName), [
            'title' => $title,
            'head' => $head,
            'base' => $base,
            'body' => $body,
        ]);

        if (! $response->successful()) {
            throw new RuntimeException(
                'Failed to open PR on '.$fullName.' ('.$head.' → '.$base.'): '
                .$response->status().' '.$response->body(),
            );
        }

        return $response->json() ?? [];
    }
}

<?php

namespace App\Services\Ai;

use App\Models\GithubInstallation;
use App\Models\GithubRepository;
use App\Services\Github\GithubApiClient;
use Illuminate\Support\Facades\Log;
use RuntimeException;

/**
 * Reads code out of a linked GitHub repository for the AI fix pipeline:
 * 1. listCodePaths(): the recursive tree, filtered to plausible backend code
 *    files. Sent to the AI as the "where could this exception live?" candidate
 *    set.
 * 2. readFiles(): pulls the raw content for the suspect files the AI picked.
 *
 * Filtering and per-file size caps live here so neither the AI service nor
 * the prompt builder needs to know anything about repo shape.
 */
class GithubCodeReader
{
    /**
     * Path-fragment denylist. If any of these substrings appear in the path
     * the entry is dropped from the candidate list. Captures vendored deps,
     * build artifacts, asset pipelines, and (per spec) frontend source dirs.
     */
    private const PATH_DENY_FRAGMENTS = [
        'node_modules/',
        'vendor/',
        'dist/',
        'build/',
        '.git/',
        'storage/',
        'bootstrap/cache/',
        'public/build/',
        'public/hot/',
        '.next/',
        '.nuxt/',
        'coverage/',
        '__pycache__/',
        'target/',
        '.idea/',
        '.vscode/',
        'resources/js/',
        'resources/css/',
        'resources/sass/',
        'resources/scss/',
    ];

    /** Files we never want to read or send to the model. */
    private const FILENAME_DENY = [
        'package-lock.json',
        'composer.lock',
        'yarn.lock',
        'pnpm-lock.yaml',
        '.DS_Store',
    ];

    /** Extensions we treat as "code worth showing the AI". */
    private const ALLOWED_EXTENSIONS = [
        'php', 'py', 'rb', 'js', 'mjs', 'cjs', 'ts', 'go', 'java', 'kt', 'rs',
        'cs', 'swift', 'ex', 'exs', 'erl', 'scala', 'pl', 'sh',
        'json', 'yml', 'yaml', 'toml', 'env',
        'sql',
        'blade.php',
    ];

    public function __construct(private readonly GithubApiClient $api) {}

    /**
     * Resolve the default branch (or the explicit override) to a commit SHA
     * so the rest of the pipeline reads from a stable snapshot — not a
     * moving target while the model is thinking.
     */
    public function resolveBranchSha(GithubRepository $repository, ?string $branch = null): array
    {
        $installation = $repository->installation;
        $resolvedBranch = $branch ?? $repository->default_branch ?? 'main';

        $response = $this->api->asInstallation($installation)
            ->get(sprintf(
                '/repos/%s/branches/%s',
                $repository->full_name,
                rawurlencode($resolvedBranch),
            ));

        if (! $response->successful()) {
            throw new RuntimeException(
                'Failed to resolve branch '.$resolvedBranch.' on '.$repository->full_name.': '
                .$response->status().' '.$response->body(),
            );
        }

        $sha = (string) ($response->json('commit.sha') ?? '');

        if ($sha === '') {
            throw new RuntimeException('GitHub returned no commit SHA for '.$resolvedBranch.'.');
        }

        Log::info('AI fix: branch resolved', [
            'repo' => $repository->full_name,
            'branch' => $resolvedBranch,
            'sha' => $sha,
        ]);

        return [
            'branch' => $resolvedBranch,
            'sha' => $sha,
        ];
    }

    /**
     * Recursive tree → filtered list of paths plus a stats payload describing
     * exactly what the filter did. Stats are logged at info level and returned
     * to the caller so a "0 backend files" failure can surface a useful error
     * message instead of a silent miss.
     *
     * Hard cap at `max_repo_paths` keeps the prompt size bounded; when the
     * repo is bigger than that, paths whose names look related to the
     * exception's origin file are kept first (`$preferContaining`).
     *
     * @return array{paths: list<string>, stats: array<string, mixed>}
     */
    public function listCodePaths(
        GithubRepository $repository,
        string $treeSha,
        ?string $preferContaining = null,
    ): array {
        $installation = $repository->installation;

        $response = $this->api->asInstallation($installation)
            ->get(sprintf(
                '/repos/%s/git/trees/%s',
                $repository->full_name,
                $treeSha,
            ), ['recursive' => 1]);

        if (! $response->successful()) {
            throw new RuntimeException(
                'Failed to list tree '.$treeSha.' on '.$repository->full_name.': '
                .$response->status().' '.$response->body(),
            );
        }

        $tree = $response->json('tree') ?? [];
        $candidates = [];

        $stats = [
            'total_entries' => count($tree),
            'truncated' => (bool) ($response->json('truncated') ?? false),
            'non_blob' => 0,
            'allowed' => 0,
            'denied_by_filename' => 0,
            'denied_by_path' => 0,
            'denied_by_min' => 0,
            'denied_by_extension' => 0,
            'extensions_in_repo' => [],
            'extensions_allowed' => [],
            'top_level_dirs' => [],
            'sample_allowed' => [],
            'sample_skipped' => [],
        ];

        $topLevelDirs = [];

        foreach ($tree as $entry) {
            $type = $entry['type'] ?? '';
            $path = (string) ($entry['path'] ?? '');

            if ($type === 'tree' && $path !== '' && ! str_contains($path, '/')) {
                $topLevelDirs[] = $path;
            }

            if ($type !== 'blob') {
                $stats['non_blob']++;
                continue;
            }

            if ($path === '') {
                continue;
            }

            $ext = strtolower(pathinfo($path, PATHINFO_EXTENSION));
            if ($ext !== '') {
                $stats['extensions_in_repo'][$ext] = ($stats['extensions_in_repo'][$ext] ?? 0) + 1;
            }

            $reason = $this->classifyPath($path);

            if ($reason === 'allowed') {
                $candidates[] = $path;
                $stats['allowed']++;

                if ($ext !== '') {
                    $stats['extensions_allowed'][$ext] = ($stats['extensions_allowed'][$ext] ?? 0) + 1;
                }

                if (count($stats['sample_allowed']) < 15) {
                    $stats['sample_allowed'][] = $path;
                }
            } else {
                $stats['denied_by_'.$reason]++;

                if (count($stats['sample_skipped']) < 15) {
                    $stats['sample_skipped'][] = "{$path}  (denied: {$reason})";
                }
            }
        }

        arsort($stats['extensions_in_repo']);
        arsort($stats['extensions_allowed']);
        sort($topLevelDirs);
        $stats['top_level_dirs'] = $topLevelDirs;

        Log::info('AI fix: tree filtering', [
            'repo' => $repository->full_name,
            'tree_sha' => $treeSha,
            'total_entries' => $stats['total_entries'],
            'truncated' => $stats['truncated'],
            'allowed' => $stats['allowed'],
            'non_blob' => $stats['non_blob'],
            'denied_by_filename' => $stats['denied_by_filename'],
            'denied_by_path' => $stats['denied_by_path'],
            'denied_by_min' => $stats['denied_by_min'],
            'denied_by_extension' => $stats['denied_by_extension'],
            'top_level_dirs' => $stats['top_level_dirs'],
            'extensions_in_repo' => array_slice($stats['extensions_in_repo'], 0, 15, true),
            'extensions_allowed' => array_slice($stats['extensions_allowed'], 0, 15, true),
            'sample_allowed' => $stats['sample_allowed'],
            'sample_skipped' => $stats['sample_skipped'],
        ]);

        return [
            'paths' => $this->capCandidatePaths($candidates, $preferContaining),
            'stats' => $stats,
        ];
    }

    /**
     * Fetch raw content for each requested path. Files larger than the
     * configured byte cap are truncated with a marker so the AI knows the
     * snippet is partial; missing/binary files are skipped silently rather
     * than failing the whole pipeline.
     *
     * @param  list<string>  $paths
     * @return list<array{path: string, content: string, truncated: bool}>
     */
    public function readFiles(
        GithubRepository $repository,
        string $treeSha,
        array $paths,
    ): array {
        $installation = $repository->installation;
        $maxBytes = (int) config('services.ai_fix.max_file_bytes', 60000);
        $files = [];
        $missing = [];

        foreach ($paths as $path) {
            $content = $this->fetchRawFile($installation, $repository->full_name, $treeSha, $path);

            if ($content === null) {
                $missing[] = $path;
                continue;
            }

            $truncated = false;

            if (strlen($content) > $maxBytes) {
                $content = substr($content, 0, $maxBytes)
                    ."\n// --- TRUNCATED BY GUARDIAN (file exceeds {$maxBytes} bytes) ---";
                $truncated = true;
            }

            $files[] = [
                'path' => $path,
                'content' => $content,
                'truncated' => $truncated,
            ];
        }

        Log::info('AI fix: file read', [
            'repo' => $repository->full_name,
            'requested' => count($paths),
            'read' => count($files),
            'missing' => $missing,
            'truncated_count' => count(array_filter($files, static fn ($f) => $f['truncated'])),
        ]);

        return $files;
    }

    private function fetchRawFile(
        GithubInstallation $installation,
        string $fullName,
        string $ref,
        string $path,
    ): ?string {
        // The "raw" media type returns the file body directly instead of the
        // base64-wrapped JSON shape; saves a decode step and avoids tripping
        // the 1MB JSON limit on slightly-larger source files.
        $response = $this->api->asInstallation($installation)
            ->withHeaders(['Accept' => 'application/vnd.github.raw'])
            ->get(sprintf('/repos/%s/contents/%s', $fullName, $this->encodePath($path)), [
                'ref' => $ref,
            ]);

        if (! $response->successful()) {
            return null;
        }

        return $response->body();
    }

    private function encodePath(string $path): string
    {
        return implode('/', array_map('rawurlencode', explode('/', $path)));
    }

    /**
     * Returns "allowed" when a path passes every filter, otherwise the name
     * of the rule that rejected it: "filename", "path", "min", or "extension".
     * The string is used in stats counters and skip-sample annotations.
     */
    private function classifyPath(string $path): string
    {
        $basename = basename($path);

        if (in_array($basename, self::FILENAME_DENY, true)) {
            return 'filename';
        }

        foreach (self::PATH_DENY_FRAGMENTS as $fragment) {
            if (str_contains($path, $fragment)) {
                return 'path';
            }
        }

        if (str_contains($basename, '.min.')) {
            return 'min';
        }

        $lower = strtolower($basename);

        foreach (self::ALLOWED_EXTENSIONS as $ext) {
            if (str_ends_with($lower, '.'.$ext)) {
                return 'allowed';
            }
        }

        return 'extension';
    }

    /**
     * Trim the candidate list down to the configured cap. When the repo has
     * more files than we can send, prefer paths that contain the exception's
     * origin filename — those are most likely to be relevant.
     *
     * @param  list<string>  $paths
     * @return list<string>
     */
    private function capCandidatePaths(array $paths, ?string $preferContaining): array
    {
        $max = (int) config('services.ai_fix.max_repo_paths', 600);

        if (count($paths) <= $max) {
            sort($paths);

            return array_values($paths);
        }

        $preferred = [];
        $rest = [];

        $needle = $preferContaining !== null && $preferContaining !== ''
            ? strtolower(basename($preferContaining))
            : null;

        foreach ($paths as $path) {
            if ($needle !== null && str_contains(strtolower($path), $needle)) {
                $preferred[] = $path;
            } else {
                $rest[] = $path;
            }
        }

        sort($preferred);
        sort($rest);

        $combined = array_merge($preferred, $rest);

        return array_slice($combined, 0, $max);
    }
}

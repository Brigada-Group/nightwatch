<?php

namespace App\Services\Ai;

use App\Ai\Agents\FixProducerAgent;
use App\Ai\Agents\SuspectFileSelectorAgent;
use App\Events\AiFixAttemptUpdated;
use App\Models\AiFixAttempt;
use App\Models\GithubRepository;
use App\Models\HubException;
use App\Models\HubIssue;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use RuntimeException;

/**
 * Real implementation of the AI fix pipeline. Two-pass design:
 *
 *   1. SuspectFileSelectorAgent — exception/issue summary + filtered file
 *      index in; the at-most-N file paths most likely to be involved out.
 *   2. FixProducerAgent — exception/issue summary + the full contents of
 *      those files in; corrected file contents out.
 *
 * Keeping the two passes separate is what lets us stay within sane token
 * budgets for repos of nontrivial size — we never send full source for files
 * the model didn't ask for. Both passes go through Laravel's AI SDK, so the
 * provider (OpenAI / Anthropic / Gemini / etc.) is a `config/ai.php` knob,
 * not a code change.
 */
class OpenAiFixService implements AiFixService
{
    public function __construct(
        private readonly GithubCodeReader $code,
    ) {}

    public function requestFix(AiFixAttempt $attempt): void
    {
        $task = $attempt->task; // morphTo: HubException | HubIssue

        if (! $task instanceof Model) {
            throw new RuntimeException('AI fix attempt has no task.');
        }

        $task->loadMissing('project');

        $project = $task->project;

        if ($project === null) {
            throw new RuntimeException('Task is missing its project.');
        }

        Log::info('AI fix: starting', [
            'attempt_id' => $attempt->id,
            'task_type' => $task::class,
            'task_id' => $task->getKey(),
            'project_id' => $project->id,
            'project_name' => $project->name,
        ]);

        $repository = GithubRepository::query()
            ->with('installation')
            ->where('project_id', $project->id)
            ->first();

        if ($repository === null) {
            throw new RuntimeException(sprintf(
                'No GitHub repository is linked to project #%d (%s). Re-run the LocalGithubRepoLinkSeeder with LOCAL_GITHUB_PROJECT_ID=%d.',
                $project->id,
                $project->name,
                $project->id,
            ));
        }

        Log::info('AI fix: linked repository', [
            'attempt_id' => $attempt->id,
            'project_id' => $project->id,
            'repo' => $repository->full_name,
            'default_branch' => $repository->default_branch,
            'private' => $repository->private,
            'installation_id' => $repository->installation->installation_id,
            'installation_account' => $repository->installation->account_login,
        ]);

        $taskSummary = $this->summarizeTask($task);

        Log::info('AI fix: task summary', [
            'attempt_id' => $attempt->id,
            'kind' => $taskSummary['kind'],
            'headline' => $taskSummary['headline'],
            'origin_file' => $taskSummary['origin_file'],
        ]);

        $branchInfo = $this->code->resolveBranchSha($repository);
        $treeSha = $branchInfo['sha'];
        $branch = $branchInfo['branch'];

        $listing = $this->code->listCodePaths(
            $repository,
            $treeSha,
            preferContaining: $taskSummary['origin_file'],
        );
        $paths = $listing['paths'];
        $stats = $listing['stats'];

        // Empty filter result is not a *failure* — it's "AI looked, found
        // nothing to work with". Mark succeeded with no changes + a friendly
        // summary so the developer sees an informational state in the modal
        // instead of a scary "AI FAILED" badge.
        if ($paths === []) {
            $this->recordNoChangesOutcome(
                $attempt,
                $repository,
                $branch,
                $treeSha,
                summary: sprintf(
                    "No backend code files matched in %s on branch %s. The repository's top-level "
                    .'directories were [%s] and the most common extensions were %s. Try linking a '
                    .'different repository or adjusting the file-extension allowlist.',
                    $repository->full_name,
                    $branch,
                    implode(', ', $stats['top_level_dirs']) ?: 'none',
                    $this->formatExtensionMap($stats['extensions_in_repo']) ?: 'none',
                ),
            );

            return;
        }

        Log::info('AI fix: paths ready for AI selection', [
            'attempt_id' => $attempt->id,
            'count' => count($paths),
        ]);

        $selection = $this->selectSuspectFiles($taskSummary, $repository->full_name, $branch, $paths);

        Log::info('AI fix: AI selected suspect files', [
            'attempt_id' => $attempt->id,
            'selected_count' => count($selection['files']),
            'selected' => $selection['files'],
        ]);

        // Same reasoning as above: AI saying "nothing here looks related"
        // is a legitimate informational outcome, not a failure mode.
        if ($selection['files'] === []) {
            $this->recordNoChangesOutcome(
                $attempt,
                $repository,
                $branch,
                $treeSha,
                summary: sprintf(
                    'The AI scanned %d candidate paths in %s but could not identify files related '
                    .'to this exception. This often happens when the linked repository\'s tech stack '
                    ."doesn't match the exception's stack trace (for example, a Django repo paired "
                    .'with a Laravel exception).',
                    count($paths),
                    $repository->full_name,
                ),
            );

            return;
        }

        $fileBlobs = $this->code->readFiles($repository, $treeSha, $selection['files']);

        // Failed to read the selected files (perms / 404 / network) — this
        // *is* a real error, since the AI did pick files and we just can't
        // fetch them. Keep the existing failure path here.
        if ($fileBlobs === []) {
            throw new RuntimeException(sprintf(
                'Failed to read any of the AI-selected files from %s. Selected: [%s]. Check log for per-file 404/permission errors.',
                $repository->full_name,
                implode(', ', $selection['files']),
            ));
        }

        $fix = $this->produceFix($taskSummary, $repository->full_name, $branch, $fileBlobs);

        Log::info('AI fix: AI produced fix', [
            'attempt_id' => $attempt->id,
            'changes_count' => count($fix['changes']),
            'changed_files' => array_map(static fn ($c) => $c['file_name'], $fix['changes']),
        ]);

        DB::transaction(function () use ($attempt, $task, $repository, $branch, $treeSha, $selection, $fix): void {
            $attempt->forceFill([
                'status' => AiFixAttempt::STATUS_SUCCEEDED,
                'completed_at' => now(),
                'result' => [
                    'repo' => [
                        'full_name' => $repository->full_name,
                        'branch' => $branch,
                        'commit_sha' => $treeSha,
                    ],
                    'suspect_files' => $selection['files'],
                    'changes' => $fix['changes'],
                    'summary' => $fix['summary'],
                ],
            ])->save();

            // The AI succeeded with at least one proposed file change — push
            // the task into the Review column so the assignee can diff and
            // accept/reject the suggestion. We skip this if AI returned no
            // changes (nothing to review) or if the task already moved past
            // Review (don't yank a finished task back).
            $shouldReview = count($fix['changes']) > 0
                && in_array($task->task_status, [
                    HubException::TASK_STATUS_STARTED,
                    HubException::TASK_STATUS_ONGOING,
                ], true);

            if ($shouldReview) {
                $task->forceFill([
                    'task_status' => HubException::TASK_STATUS_REVIEW,
                ])->save();
            }
        });

        AiFixAttemptUpdated::broadcastFor($attempt);

        Log::info('AI fix: completed', [
            'attempt_id' => $attempt->id,
            'changes_count' => count($fix['changes']),
            'task_moved_to_review' => count($fix['changes']) > 0
                && in_array($task->task_status, [
                    HubException::TASK_STATUS_REVIEW,
                ], true),
        ]);
    }

    /**
     * Persist a "succeeded with no changes" terminal state. Used when the AI
     * pipeline ran cleanly but produced nothing actionable (no matching code
     * files in the repo, AI couldn't pick suspect files, etc.). Conceptually
     * different from `failed` — nothing broke, there's just nothing to apply.
     * The frontend renders this as an informational message in the modal,
     * not a red error toast.
     */
    private function recordNoChangesOutcome(
        AiFixAttempt $attempt,
        GithubRepository $repository,
        string $branch,
        string $treeSha,
        string $summary,
    ): void {
        DB::transaction(function () use ($attempt, $repository, $branch, $treeSha, $summary): void {
            $attempt->forceFill([
                'status' => AiFixAttempt::STATUS_SUCCEEDED,
                'completed_at' => now(),
                'result' => [
                    'repo' => [
                        'full_name' => $repository->full_name,
                        'branch' => $branch,
                        'commit_sha' => $treeSha,
                    ],
                    'suspect_files' => [],
                    'changes' => [],
                    'summary' => $summary,
                ],
            ])->save();
        });

        AiFixAttemptUpdated::broadcastFor($attempt);

        Log::info('AI fix: completed with no changes', [
            'attempt_id' => $attempt->id,
            'reason_summary' => $summary,
        ]);
    }

    /**
     * Render an extensions-with-counts map as a compact "ext=count" list,
     * sorted desc by count and capped at 10 entries — fits cleanly in an
     * error message.
     *
     * @param  array<string, int>  $extensions
     */
    private function formatExtensionMap(array $extensions): string
    {
        if ($extensions === []) {
            return '';
        }

        $top = array_slice($extensions, 0, 10, true);
        $parts = [];

        foreach ($top as $ext => $count) {
            $parts[] = "{$ext}={$count}";
        }

        return implode(', ', $parts);
    }

    /**
     * @return array{kind: string, headline: string, message: string, origin_file: ?string, details: string}
     */
    private function summarizeTask(Model $task): array
    {
        if ($task instanceof HubException) {
            $stack = (string) ($task->stack_trace ?? '');
            // Stack traces can be large; cap to keep the prompt within
            // budget without losing the head frames the AI actually needs.
            if (strlen($stack) > 8000) {
                $stack = substr($stack, 0, 8000)."\n... (stack trace truncated)";
            }

            $details = collect([
                'Exception class: '.($task->exception_class ?? 'unknown'),
                'Message: '.($task->message ?? ''),
                'File: '.($task->file ?? 'unknown').(isset($task->line) ? ':'.$task->line : ''),
                'URL: '.($task->url ?? 'n/a'),
                'Status code: '.($task->status_code ?? 'n/a'),
                'Environment: '.($task->environment ?? 'n/a'),
                $stack !== '' ? "Stack trace:\n".$stack : null,
            ])->filter()->implode("\n");

            return [
                'kind' => 'exception',
                'headline' => (string) ($task->exception_class ?? 'Exception'),
                'message' => (string) ($task->message ?? ''),
                'origin_file' => $task->file ?? null,
                'details' => $details,
            ];
        }

        if ($task instanceof HubIssue) {
            $kind = match ($task->source_type) {
                HubIssue::SOURCE_SLOW_QUERY => 'slow database query',
                HubIssue::SOURCE_SLOW_REQUEST => 'slow HTTP request',
                default => 'performance issue',
            };

            $details = collect([
                'Issue type: '.$kind,
                'Summary: '.($task->summary ?? ''),
                'Severity: '.($task->severity ?? 'n/a'),
            ])->filter()->implode("\n");

            return [
                'kind' => $task->source_type ?? 'issue',
                'headline' => ucfirst($kind),
                'message' => (string) ($task->summary ?? ''),
                'origin_file' => null,
                'details' => $details,
            ];
        }

        throw new RuntimeException('Unsupported task type: '.$task::class);
    }

    /**
     * Pass 1: ask the model which files in the repo are most likely to be
     * involved. Caps the result count to keep pass 2 small.
     *
     * @param  array{kind: string, headline: string, message: string, origin_file: ?string, details: string}  $task
     * @param  list<string>  $paths
     * @return array{files: list<string>}
     */
    private function selectSuspectFiles(array $task, string $repoFullName, string $branch, array $paths): array
    {
        $maxFiles = (int) config('services.ai_fix.max_suspect_files', 5);

        $prompt = "Repository: {$repoFullName}\nBranch: {$branch}\n\n"
            ."Issue details:\n{$task['details']}\n\n"
            ."Candidate file paths (one per line):\n"
            .implode("\n", $paths);

        $response = (new SuspectFileSelectorAgent(maxFiles: $maxFiles))->prompt($prompt);

        $rawFiles = $response['files'] ?? [];

        // Defensive guard against the model occasionally hallucinating a
        // path that wasn't in the candidate list — strip those, dedupe, and
        // cap to the configured ceiling.
        $allowed = array_flip($paths);
        $filtered = [];

        foreach ($rawFiles as $path) {
            if (! is_string($path)) {
                continue;
            }

            if (array_key_exists($path, $allowed) && ! in_array($path, $filtered, true)) {
                $filtered[] = $path;
            }

            if (count($filtered) >= $maxFiles) {
                break;
            }
        }

        return [
            'files' => $filtered,
        ];
    }

    /**
     * Pass 2: send the actual file contents and ask for new content for any
     * file that needs to change.
     *
     * @param  array{kind: string, headline: string, message: string, origin_file: ?string, details: string}  $task
     * @param  list<array{path: string, content: string, truncated: bool}>  $files
     * @return array{summary: string, changes: list<array{file_name: string, content: string, original_content: string, original_truncated: bool, is_new_file: bool}>}
     */
    private function produceFix(array $task, string $repoFullName, string $branch, array $files): array
    {
        $originals = [];

        foreach ($files as $file) {
            $originals[$file['path']] = [
                'content' => $file['content'],
                'truncated' => $file['truncated'],
            ];
        }

        $blocks = collect($files)->map(function (array $f): string {
            $marker = $f['truncated'] ? ' (truncated)' : '';

            return "----- FILE: {$f['path']}{$marker} -----\n{$f['content']}\n----- END FILE -----";
        })->implode("\n\n");

        $prompt = "Repository: {$repoFullName}\nBranch: {$branch}\n\n"
            ."Issue details:\n{$task['details']}\n\n"
            ."Files:\n\n{$blocks}";

        $response = (new FixProducerAgent)->prompt($prompt);

        $rawEntries = $response['new_content'] ?? [];
        $changes = [];

        foreach ($rawEntries as $entry) {
            if (! is_array($entry)) {
                continue;
            }

            $name = (string) ($entry['file_name'] ?? '');
            $content = (string) ($entry['content'] ?? '');

            // Skip only the obviously-broken entries; in particular, do NOT
            // require the file to be one we previously read. The AI is
            // allowed to propose new files (e.g. a handler module that
            // doesn't exist yet) — those go through as `is_new_file = true`
            // and the review modal renders them with no original-content
            // diff partner.
            if ($name === '' || $content === '') {
                continue;
            }

            $isNewFile = ! array_key_exists($name, $originals);

            $changes[] = [
                'file_name' => $name,
                'content' => $content,
                'original_content' => $isNewFile ? '' : $originals[$name]['content'],
                'original_truncated' => $isNewFile ? false : $originals[$name]['truncated'],
                'is_new_file' => $isNewFile,
            ];
        }

        Log::info('AI fix: raw fix response', [
            'raw_entry_count' => count($rawEntries),
            'kept_change_count' => count($changes),
            'kept_files' => array_map(static fn ($c) => $c['file_name'].($c['is_new_file'] ? ' (new)' : ''), $changes),
        ]);

        $summary = (string) ($response['summary'] ?? '');

        return [
            'summary' => $summary,
            'changes' => $changes,
        ];
    }
}

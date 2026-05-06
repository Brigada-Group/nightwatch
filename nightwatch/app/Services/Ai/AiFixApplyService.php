<?php

namespace App\Services\Ai;

use App\Events\AiFixAttemptUpdated;
use App\Models\AiFixAttempt;
use App\Models\GithubRepository;
use App\Models\HubException;
use App\Models\HubIssue;
use App\Services\Github\GithubChangesetWriter;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use RuntimeException;
use Throwable;

/**
 * Bridges an `AiFixAttempt` into the generic `GithubChangesetWriter` so the
 * developer's "Accept" click turns into a real PR. All AI-flow concerns
 * (extracting changes from the result blob, building a sensible commit
 * message + PR body, persisting branch/PR bookkeeping, broadcasting the
 * lifecycle event) live here. The writer itself stays product-agnostic.
 *
 * Designed to be reused by Self-Heal: the planned auto-apply path will call
 * `apply($attempt)` from a job after the AI pipeline succeeds, with no
 * human in the loop. That's why authorization happens in the controller
 * (the developer-driven path) rather than in this service.
 */
class AiFixApplyService
{
    public function __construct(
        private readonly GithubChangesetWriter $writer,
    ) {}

    /**
     * Apply the attempt's proposed changes as a PR. Idempotent: if the
     * attempt already has `applied_at`, returns the existing record without
     * touching GitHub. Stamps `apply_error` instead of throwing on writer
     * failures so the UI can show the reason and the user can retry without
     * a 500.
     */
    public function apply(AiFixAttempt $attempt): AiFixAttempt
    {
        if ($attempt->isApplied()) {
            return $attempt;
        }

        $this->guardAttemptIsApplyable($attempt);

        $repository = $this->resolveRepository($attempt);
        $task = $this->loadTask($attempt);

        $changes = $this->extractChanges($attempt);
        $baseCommitSha = (string) ($attempt->result['repo']['commit_sha'] ?? '');
        $targetBranch = $attempt->result['repo']['branch'] ?? null;

        if ($baseCommitSha === '') {
            throw new RuntimeException(
                'AI fix attempt #'.$attempt->id.' has no recorded base commit SHA. '
                .'Re-run "Fix with AI" before accepting.',
            );
        }

        $branchName = $this->writer->generateBranchName(prefix: 'guardian-ai-fix-'.$attempt->id);
        $commitMessage = $this->buildCommitMessage($attempt, $task);
        $prTitle = $this->buildPrTitle($attempt, $task);
        $prBody = $this->buildPrBody($attempt, $task, $changes);

        try {
            $result = $this->writer->applyAsPullRequest(
                repository: $repository,
                baseCommitSha: $baseCommitSha,
                changes: $changes,
                branchName: $branchName,
                commitMessage: $commitMessage,
                prTitle: $prTitle,
                prBody: $prBody,
                targetBranch: $targetBranch,
            );
        } catch (Throwable $e) {
            DB::transaction(function () use ($attempt, $e): void {
                $attempt->forceFill([
                    'apply_error' => $e->getMessage(),
                ])->save();
            });

            Log::error('AI fix: apply failed', [
                'attempt_id' => $attempt->id,
                'error' => $e->getMessage(),
            ]);

            AiFixAttemptUpdated::broadcastFor($attempt);

            throw $e;
        }

        DB::transaction(function () use ($attempt, $result): void {
            $attempt->forceFill([
                'applied_at' => now(),
                'apply_branch_name' => $result['branch_name'],
                'apply_commit_sha' => $result['commit_sha'],
                'apply_pr_url' => $result['pr_url'],
                'apply_pr_number' => $result['pr_number'],
                'apply_error' => null,
            ])->save();
        });

        Log::info('AI fix: applied', [
            'attempt_id' => $attempt->id,
            'pr_url' => $result['pr_url'],
            'pr_number' => $result['pr_number'],
            'branch_name' => $result['branch_name'],
        ]);

        AiFixAttemptUpdated::broadcastFor($attempt->refresh());

        return $attempt;
    }

    private function guardAttemptIsApplyable(AiFixAttempt $attempt): void
    {
        if ($attempt->status !== AiFixAttempt::STATUS_SUCCEEDED) {
            throw new RuntimeException(
                'AI fix attempt #'.$attempt->id.' is in status "'.$attempt->status
                .'" — only succeeded attempts can be applied.',
            );
        }

        if (! is_array($attempt->result) || empty($attempt->result['changes'] ?? [])) {
            throw new RuntimeException(
                'AI fix attempt #'.$attempt->id.' has no proposed changes to apply.',
            );
        }
    }

    private function resolveRepository(AiFixAttempt $attempt): GithubRepository
    {
        $repository = GithubRepository::query()
            ->with('installation')
            ->where('project_id', $attempt->project_id)
            ->first();

        if ($repository === null) {
            throw new RuntimeException(
                'No GitHub repository is linked to project #'.$attempt->project_id.'. '
                .'Re-link before accepting the fix.',
            );
        }

        return $repository;
    }

    private function loadTask(AiFixAttempt $attempt): Model
    {
        $task = $attempt->task;

        if (! $task instanceof Model) {
            throw new RuntimeException(
                'AI fix attempt #'.$attempt->id.' is not bound to a task — cannot apply.',
            );
        }

        return $task;
    }

    /**
     * @return list<array{path: string, content: string}>
     */
    private function extractChanges(AiFixAttempt $attempt): array
    {
        $raw = $attempt->result['changes'] ?? [];
        $changes = [];

        foreach ($raw as $entry) {
            if (! is_array($entry)) {
                continue;
            }

            $path = (string) ($entry['file_name'] ?? '');
            $content = (string) ($entry['content'] ?? '');

            if ($path === '' || $content === '') {
                continue;
            }

            $changes[] = ['path' => $path, 'content' => $content];
        }

        if ($changes === []) {
            throw new RuntimeException(
                'AI fix attempt #'.$attempt->id.' has no valid file changes after filtering.',
            );
        }

        return $changes;
    }

    private function buildCommitMessage(AiFixAttempt $attempt, Model $task): string
    {
        $headline = $this->taskHeadline($task);
        $summary = (string) ($attempt->result['summary'] ?? '');

        $body = $summary !== ''
            ? $summary
            : 'Generated fix for '.$headline.'.';

        return sprintf(
            "%s\n\n%s\n\nGenerated by Guardian AI fix attempt #%d.",
            'AI fix: '.$headline,
            $body,
            $attempt->id,
        );
    }

    private function buildPrTitle(AiFixAttempt $attempt, Model $task): string
    {
        return '[Guardian AI] '.$this->taskHeadline($task);
    }

    /**
     * @param  list<array{path: string, content: string}>  $changes
     */
    private function buildPrBody(AiFixAttempt $attempt, Model $task, array $changes): string
    {
        $headline = $this->taskHeadline($task);
        $summary = trim((string) ($attempt->result['summary'] ?? ''));
        $changedList = collect($changes)->map(fn (array $c): string => '- `'.$c['path'].'`')->implode("\n");
        $suspectFiles = $attempt->result['suspect_files'] ?? [];
        $inspectedList = is_array($suspectFiles) && $suspectFiles !== []
            ? collect($suspectFiles)->map(fn ($p): string => '- `'.$p.'`')->implode("\n")
            : '_(none recorded)_';

        return <<<MD
            ### What this PR does

            Fixes **{$headline}**.

            ### AI summary

            {$summary}

            ### Files changed

            {$changedList}

            ### Files inspected

            {$inspectedList}

            ---

            🤖 Generated automatically by Guardian from AI fix attempt #{$attempt->id}. Review carefully before merging — the model can be wrong.
            MD;
    }

    private function taskHeadline(Model $task): string
    {
        if ($task instanceof HubException) {
            $class = (string) ($task->exception_class ?? 'Exception');
            $message = (string) ($task->message ?? '');

            return $message !== ''
                ? $class.': '.\Illuminate\Support\Str::limit($message, 80)
                : $class;
        }

        if ($task instanceof HubIssue) {
            $kind = match ($task->source_type) {
                HubIssue::SOURCE_SLOW_QUERY => 'Slow query',
                HubIssue::SOURCE_SLOW_REQUEST => 'Slow request',
                default => 'Performance issue',
            };

            $summary = (string) ($task->summary ?? '');

            return $summary !== ''
                ? $kind.': '.\Illuminate\Support\Str::limit($summary, 80)
                : $kind;
        }

        return 'Guardian task';
    }
}

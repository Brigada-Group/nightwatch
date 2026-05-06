<?php

namespace App\Http\Controllers;

use App\Models\AiFixAttempt;
use App\Services\Ai\AiFixApplyService;
use App\Services\CurrentTeam;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use RuntimeException;

/**
 * Apply-flow endpoints for AI fix attempts. Kept separate from
 * TasksController because the resource is the attempt itself, not the
 * task — same reason ai_fix_attempts has its own table and event.
 */
class AiFixController extends Controller
{
    public function __construct(
        private readonly CurrentTeam $currentTeam,
        private readonly AiFixApplyService $applyService,
    ) {}

    /**
     * Push the AI's proposed changes to a fresh branch and open a PR.
     * Idempotent: a second click on an already-applied attempt is a no-op
     * and just bounces back to the kanban with the existing PR URL.
     */
    public function apply(Request $request, AiFixAttempt $aiFixAttempt): RedirectResponse
    {
        $user = $request->user();
        $team = $this->currentTeam->for($user);
        abort_unless($team !== null, 403);

        $aiFixAttempt->loadMissing(['task', 'task.project']);

        $task = $aiFixAttempt->task;
        $project = $task?->project;

        // Defence in depth: scope to the current team's projects, then to
        // the task's current assignee. Matches the auth on
        // TasksController::fixExceptionWithAi so the "who can drive AI for
        // this task" rule stays consistent across request, accept, retry.
        abort_unless(
            $project !== null && $project->team_id === $team->id,
            404,
        );

        abort_unless(
            isset($task->assigned_to) && (int) $task->assigned_to === (int) $user->id,
            403,
            __('Only the assignee can apply this AI fix.'),
        );

        try {
            $aiFixAttempt = $this->applyService->apply($aiFixAttempt);
        } catch (RuntimeException $e) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => $e->getMessage(),
            ]);

            return back();
        }

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => $aiFixAttempt->apply_pr_url
                ? __('AI fix applied — PR #:number opened.', ['number' => $aiFixAttempt->apply_pr_number])
                : __('AI fix applied.'),
        ]);

        return back();
    }
}

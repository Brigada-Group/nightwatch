<?php

namespace App\Services;

use App\Mail\ExceptionResolvedMail;
use App\Models\HubException;
use Illuminate\Support\Facades\Mail;

/**
 * Single-responsibility service for the resolution side-effect on a task: when
 * a developer marks their assigned exception as finished, notify the user who
 * assigned it. Everything mail-related lives here so the task service stays
 * focused on persistence and authorization.
 */
class ExceptionResolutionService
{
    /**
     * Notify the original assigner that the exception has been resolved.
     *
     * Silently no-ops if any required actor or relation is missing — that
     * usually means an assignment was wiped or the assigner was deleted, and
     * it shouldn't be allowed to break a successful status transition.
     * Mail-send failures are reported but never raised, mirroring the pattern
     * established in ExceptionAssigneeService.
     */
    public function notifyAssigner(HubException $exception): void
    {
        $exception->loadMissing([
            'project',
            'project.team',
            'assignee',
            'assignedBy',
        ]);

        $project = $exception->project;
        $team = $project?->team;
        $resolver = $exception->assignee;
        $recipient = $exception->assignedBy;

        if ($project === null || $team === null || $resolver === null || $recipient === null) {
            return;
        }

        if (! filter_var($recipient->email, FILTER_VALIDATE_EMAIL)) {
            return;
        }

        try {
            Mail::to($recipient->email)->send(new ExceptionResolvedMail(
                $exception,
                $project,
                $team,
                $resolver,
                $recipient,
            ));
        } catch (\Throwable $e) {
            report($e);
        }
    }
}

<?php

namespace App\Services;

use App\Models\HubException;

/**
 * Read-side service for the exception details page. Owns:
 *
 * 1. Loading a single exception scoped by the team's accessible projects
 *    (so cross-team access is impossible by ID guessing).
 * 2. Serializing the exception into a stable shape the React page consumes.
 * 3. Producing an AI-friendly Markdown rendering used by the "Copy as
 *    Markdown" button and reusable for future webhook/email surfaces.
 *
 * Authorization (team membership, role) is the controller's job; this
 * service only enforces the project-scope filter.
 */
class ExceptionDetailService
{
    /**
     * Load a single exception with the relations the detail page needs,
     * restricted to projects the actor can access. Throws 404 if the
     * exception does not exist or belongs to a project outside the
     * actor's scope.
     *
     * @param  list<int>  $accessibleProjectIds
     */
    public function loadForActor(int $exceptionId, array $accessibleProjectIds): HubException
    {
        return HubException::query()
            ->with([
                'project:id,name,environment',
                'assignee:id,name,email',
                'assignedBy:id,name,email',
                'originalException:id,recurrence_count',
            ])
            ->whereIn('project_id', $accessibleProjectIds)
            ->findOrFail($exceptionId);
    }

    /**
     * @return array<string, mixed>
     */
    public function serializeForPage(HubException $exception): array
    {
        return [
            'id' => $exception->id,
            'exception_class' => (string) $exception->exception_class,
            'message' => (string) $exception->message,
            'severity' => (string) $exception->severity,
            'environment' => $exception->environment,
            'server' => $exception->server,
            'file' => $exception->file,
            'line' => $exception->line,
            'url' => $exception->url,
            'status_code' => $exception->status_code,
            'user' => $exception->user,
            'ip' => $exception->ip,
            'headers' => $exception->headers,
            'stack_trace' => $exception->stack_trace,
            'sent_at' => $exception->sent_at?->toIso8601String(),
            'task_status' => $exception->task_status,
            'task_finished_at' => $exception->task_finished_at?->toIso8601String(),
            'assigned_at' => $exception->assigned_at?->toIso8601String(),
            'is_recurrence' => (bool) $exception->is_recurrence,
            'recurrence_count' => (int) $exception->recurrence_count,
            'original_exception_id' => $exception->original_exception_id,
            // The chain count for this bug. In the current "issue" model the
            // row IS the chain anchor, so we read the row's own count. The
            // legacy model (a separate "original" row pointed to via
            // original_exception_id) is preserved here for any pre-existing
            // recurrence rows: in that case we read the original's count.
            'total_recurrences' => $exception->is_recurrence && $exception->original_exception_id !== null
                ? (int) ($exception->originalException?->recurrence_count ?? 0)
                : (int) $exception->recurrence_count,
            'project' => $exception->project
                ? [
                    'id' => $exception->project->id,
                    'name' => $exception->project->name,
                    'environment' => $exception->project->environment,
                ]
                : null,
            'assignee' => $exception->assignee
                ? [
                    'id' => $exception->assignee->id,
                    'name' => $exception->assignee->name,
                    'email' => $exception->assignee->email,
                ]
                : null,
            'assigned_by' => $exception->assignedBy
                ? [
                    'id' => $exception->assignedBy->id,
                    'name' => $exception->assignedBy->name,
                    'email' => $exception->assignedBy->email,
                ]
                : null,
        ];
    }

    /**
     * Render the exception as structured Markdown optimized for an LLM to
     * read: clear headings, no decoration, code-fenced raw fields. Sections
     * with no data are omitted so the AI doesn't see noisy "N/A" lines.
     */
    public function formatAsMarkdown(HubException $exception): string
    {
        $sections = [];

        $sections[] = '# Exception: '.$exception->exception_class;

        $overview = [];
        $overview[] = '- **Severity:** '.$exception->severity;
        if ($exception->project) {
            $overview[] = '- **Project:** '.$exception->project->name;
        }
        if ($exception->environment) {
            $overview[] = '- **Environment:** '.$exception->environment;
        }
        if ($exception->server) {
            $overview[] = '- **Server:** '.$exception->server;
        }
        if ($exception->status_code !== null) {
            $overview[] = '- **Status code:** '.$exception->status_code;
        }
        if ($exception->url) {
            $overview[] = '- **URL:** '.$exception->url;
        }
        if ($exception->sent_at) {
            $overview[] = '- **Captured at:** '.$exception->sent_at->toIso8601String();
        }
        $sections[] = "## Overview\n".implode("\n", $overview);

        if ($exception->message) {
            $sections[] = "## Message\n".$exception->message;
        }

        if ($exception->file || $exception->line !== null) {
            $location = [];
            if ($exception->file) {
                $location[] = '- **File:** '.$exception->file;
            }
            if ($exception->line !== null) {
                $location[] = '- **Line:** '.$exception->line;
            }
            $sections[] = "## Location\n".implode("\n", $location);
        }

        if ($exception->user || $exception->ip) {
            $userContext = [];
            if ($exception->user) {
                $userContext[] = '- **User:** '.$exception->user;
            }
            if ($exception->ip) {
                $userContext[] = '- **IP:** '.$exception->ip;
            }
            $sections[] = "## User context\n".implode("\n", $userContext);
        }

        if ($exception->headers) {
            $sections[] = "## Headers\n```\n".$this->formatRawBlock($exception->headers)."\n```";
        }

        if ($exception->stack_trace) {
            $sections[] = "## Stack trace\n```\n".$this->formatRawBlock($exception->stack_trace)."\n```";
        }

        if ($exception->assigned_to !== null) {
            $assignment = [];
            if ($exception->assignee) {
                $assignment[] = '- **Assigned to:** '.$exception->assignee->name.' <'.$exception->assignee->email.'>';
            }
            if ($exception->assignedBy) {
                $assignment[] = '- **Assigned by:** '.$exception->assignedBy->name.' <'.$exception->assignedBy->email.'>';
            }
            if ($exception->task_status) {
                $assignment[] = '- **Task status:** '.$exception->task_status;
            }
            if ($exception->assigned_at) {
                $assignment[] = '- **Assigned at:** '.$exception->assigned_at->toIso8601String();
            }
            if ($exception->task_finished_at) {
                $assignment[] = '- **Finished at:** '.$exception->task_finished_at->toIso8601String();
            }
            if ($assignment !== []) {
                $sections[] = "## Assignment\n".implode("\n", $assignment);
            }
        }

        if ($exception->is_recurrence) {
            $totalRecurrences = $exception->original_exception_id !== null
                ? (int) ($exception->originalException?->recurrence_count ?? 0)
                : (int) $exception->recurrence_count;

            $recurrence = ['- **Status:** Recurrence (this exception was resolved before and has come back)'];
            if ($exception->original_exception_id) {
                $recurrence[] = '- **Original exception ID:** '.$exception->original_exception_id;
            }
            if ($totalRecurrences > 0) {
                $recurrence[] = '- **Times recurred:** '.$totalRecurrences;
            }
            $sections[] = "## Recurrence\n".implode("\n", $recurrence);
        }

        return implode("\n\n", $sections)."\n";
    }

    /**
     * Pretty-print a value when it's valid JSON, otherwise return it as-is.
     * Headers are usually JSON-encoded but we don't trust the column type, so
     * we inspect at runtime rather than relying on a model cast.
     */
    private function formatRawBlock(string $value): string
    {
        $decoded = json_decode($value, associative: true, flags: JSON_THROW_ON_ERROR & 0);

        if (is_array($decoded)) {
            $pretty = json_encode($decoded, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);

            if ($pretty !== false) {
                return $pretty;
            }
        }

        return $value;
    }
}

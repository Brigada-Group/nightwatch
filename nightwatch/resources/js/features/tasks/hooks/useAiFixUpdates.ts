import { router } from '@inertiajs/react';
import { useCallback } from 'react';
import { toast } from 'sonner';
import { usePrivateChannel } from '@/shared/hooks/useChannel';
import type { AiFixAttemptStatus } from '../types';

type AiFixUpdatedPayload = {
    user_id: number;
    attempt_id: number;
    task_type: string;
    task_id: number;
    project_id: number;
    status: AiFixAttemptStatus;
    changes_count: number;
    error: string | null;
    applied: boolean;
    pr_url: string | null;
    pr_number: number | null;
    apply_error: string | null;
};

/**
 * Subscribes the current user to their per-user AI-fix channel and reacts to
 * lifecycle events (running / succeeded / failed) by refetching the kanban
 * prop and surfacing a toast. Replaces the old polling loop in the common
 * case — when the broadcaster is up, kanban transitions are effectively
 * instant; the polling hook stays around as a fallback for outages.
 */
export function useAiFixUpdates(currentUserId: number | null) {
    const onUpdated = useCallback((data: unknown) => {
        const payload = data as AiFixUpdatedPayload;

        // Refetch the kanban so card status, badge, and the Review button
        // all reflect the new attempt state. We only pull the one prop so
        // the rest of the page (stats, configs) doesn't churn.
        router.reload({ only: ['kanban'] });

        // Apply lifecycle: surface separately from the AI-fix lifecycle so
        // the toast wording matches what just changed. apply_error fires
        // when the writer tripped on something (bad branch, missing perms,
        // stale base sha); applied = true fires when the PR landed cleanly.
        if (payload.apply_error) {
            toast.error('Could not apply AI fix', {
                description: payload.apply_error.slice(0, 160),
            });
            return;
        }

        if (payload.applied && payload.pr_url) {
            toast.success(
                payload.pr_number !== null
                    ? `AI fix applied — PR #${payload.pr_number} opened`
                    : 'AI fix applied — PR opened',
                {
                    description: payload.pr_url,
                    action: {
                        label: 'View PR',
                        onClick: () => window.open(payload.pr_url ?? '', '_blank'),
                    },
                },
            );
            return;
        }

        if (payload.status === 'succeeded') {
            if (payload.changes_count > 0) {
                toast.success('AI suggested a fix', {
                    description: `${payload.changes_count} file${payload.changes_count === 1 ? '' : 's'} ready for review.`,
                });
            } else {
                // Soft, informational tone — the AI looked but had nothing
                // to propose. Not an error; just a "nothing to do" outcome.
                toast.info('AI found nothing to change', {
                    description:
                        'The model ran successfully but didn’t identify any changes for this task.',
                });
            }
        } else if (payload.status === 'failed') {
            toast.warning('AI couldn’t finish this run', {
                description: (payload.error ?? '').slice(0, 160),
            });
        }
    }, []);

    usePrivateChannel(currentUserId === null ? null : `ai-fix.user.${currentUserId}`, {
        '.ai-fix.updated': onUpdated,
    });
}

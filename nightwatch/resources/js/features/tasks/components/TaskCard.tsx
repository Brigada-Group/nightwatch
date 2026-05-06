import { router } from '@inertiajs/react';
import { format, parseISO } from 'date-fns';
import { ExternalLink, GitCompare, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { RecurrenceBadge } from '@/features/exceptions/components/RecurrenceBadge';
import { cn } from '@/lib/utils';
import type {
    AiFixAttemptStatus,
    DeveloperTask,
    TaskSourceType,
} from '../types';
import { AiFixReviewModal } from './AiFixReviewModal';

type Props = {
    task: DeveloperTask;
    isDragging: boolean;
    aiEnabled: boolean;
    onDragStart: (task: DeveloperTask) => void;
    onDragEnd: () => void;
};

const SOURCE_LABEL: Record<TaskSourceType, string> = {
    exception: 'bug',
    slow_query: 'slow query',
    slow_request: 'slow request',
};

const SOURCE_TONE: Record<TaskSourceType, string> = {
    exception:
        'border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300',
    slow_query:
        'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300',
    slow_request:
        'border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-300',
};

function formatRelative(iso: string | null): string {
    if (!iso) {
        return '';
    }

    try {
        return format(parseISO(iso), 'MMM d, h:mm a');
    } catch {
        return '';
    }
}

const AI_STATUS_LABEL: Record<AiFixAttemptStatus, string> = {
    queued: 'AI queued',
    running: 'AI working…',
    succeeded: 'AI suggested a fix',
    failed: 'AI couldn’t finish',
};

const AI_STATUS_TONE: Record<AiFixAttemptStatus, string> = {
    queued: 'border-violet-500/40 bg-violet-500/10 text-violet-700 dark:text-violet-300',
    running: 'border-violet-500/40 bg-violet-500/10 text-violet-700 dark:text-violet-300',
    succeeded: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
    failed: 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300',
};

// The succeeded-with-no-changes case isn't a "fix" but it isn't a failure
// either — the AI ran cleanly and just didn't find anything to change.
// We render it as an informational state, separate from the green
// "suggested a fix" badge.
const AI_NO_CHANGES_LABEL = 'AI found nothing to change';
const AI_NO_CHANGES_TONE =
    'border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-300';

function fixWithAiUrl(task: DeveloperTask): string {
    return task.source_type === 'exception'
        ? `/tasks/${task.id}/fix-with-ai`
        : `/tasks/issues/${task.id}/fix-with-ai`;
}

export function TaskCard({
    task,
    isDragging,
    aiEnabled,
    onDragStart,
    onDragEnd,
}: Props) {
    const [reviewOpen, setReviewOpen] = useState(false);
    const latestAttempt = task.latest_ai_fix_attempt;
    const aiInFlight =
        latestAttempt !== null &&
        (latestAttempt.status === 'queued' ||
            latestAttempt.status === 'running');
    const aiSucceeded = latestAttempt?.status === 'succeeded';
    const aiFailed = latestAttempt?.status === 'failed';
    const proposedChangeCount =
        latestAttempt?.result?.changes?.length ?? 0;
    const hasReviewableChanges = aiSucceeded && proposedChangeCount > 0;
    // Succeeded but with zero proposed changes — the AI ran cleanly and
    // just had nothing to suggest. Surfaced with its own neutral badge so
    // the user doesn't think something broke.
    const aiNoChanges = aiSucceeded && proposedChangeCount === 0;
    // Only the "actionable" columns show the Fix-with-AI button. Review means
    // a human is checking the work, Finished is done; AI shouldn't insert
    // itself into either of those phases.
    const showAiButton =
        aiEnabled &&
        (task.task_status === 'started' || task.task_status === 'ongoing');
    // The Review button surfaces in the Review column whenever there's an
    // AI proposal to look at — that's exactly when the assignee needs the
    // diff modal one click away.
    const showReviewButton =
        task.task_status === 'review' && hasReviewableChanges;
    // Check-PR button appears alongside Review whenever the proposal has
    // already been applied to GitHub. Covers both flows:
    //   - manual: developer clicked Accept → AiFixApplyService opened a PR.
    //   - self-heal: SelfHealTask job auto-applied without a click.
    // Same end state in both cases, same UI.
    const prUrl = latestAttempt?.apply_pr_url ?? null;
    const showCheckPrButton =
        task.task_status === 'review' && !!prUrl;

    const onFixWithAi = () => {
        if (aiInFlight) return;
        router.post(
            fixWithAiUrl(task),
            {},
            {
                preserveScroll: true,
                only: ['kanban', 'flash'],
                onSuccess: () => router.reload({ only: ['kanban'] }),
            },
        );
    };

    const onBadgeClick = () => {
        if (aiSucceeded || aiFailed) {
            setReviewOpen(true);
        }
    };

    const onReviewClick = () => setReviewOpen(true);

    return (
        <div
            draggable
            onDragStart={() => onDragStart(task)}
            onDragEnd={onDragEnd}
            className={cn(
                'group bg-card hover:border-primary/40 cursor-grab rounded-md border p-3 shadow-sm transition active:cursor-grabbing',
                isDragging && 'opacity-50',
            )}
        >
            <div className="flex items-start justify-between gap-2">
                <p
                    className="flex min-w-0 flex-1 items-center gap-1.5 font-mono text-xs font-semibold leading-tight"
                    title={task.exception_class}
                >
                    <span className="truncate">{task.exception_class}</span>
                    {task.is_recurrence ? <RecurrenceBadge compact /> : null}
                </p>
                <div className="flex shrink-0 items-center gap-1">
                    <Badge
                        variant="outline"
                        className={cn(
                            'text-[10px] uppercase tracking-wide',
                            SOURCE_TONE[task.source_type],
                        )}
                    >
                        {SOURCE_LABEL[task.source_type]}
                    </Badge>
                    <Badge
                        variant="outline"
                        className="text-[10px] uppercase tracking-wide"
                    >
                        {task.severity}
                    </Badge>
                </div>
            </div>
            <p className="text-muted-foreground mt-1.5 line-clamp-2 text-xs">
                {task.message}
            </p>
            <div className="text-muted-foreground mt-3 flex items-center justify-between text-[10px]">
                <span className="truncate">
                    {task.project?.name ?? `#${task.id}`}
                </span>
                <span className="tabular-nums">
                    {formatRelative(task.assigned_at ?? task.sent_at)}
                </span>
            </div>
            {task.assigned_by ? (
                <p className="text-muted-foreground/80 mt-1 text-[10px]">
                    from {task.assigned_by.name}
                </p>
            ) : null}

            {showAiButton ? (
                <div className="mt-3 flex items-center justify-between gap-2 border-t pt-2">
                    {latestAttempt !== null ? (
                        <button
                            type="button"
                            onClick={onBadgeClick}
                            disabled={!aiSucceeded && !aiFailed}
                            className={cn(
                                'rounded-md transition',
                                (aiSucceeded || aiFailed) &&
                                    'cursor-pointer hover:opacity-80',
                                !aiSucceeded &&
                                    !aiFailed &&
                                    'cursor-default',
                            )}
                            title={
                                aiSucceeded
                                    ? 'View AI fix proposal'
                                    : aiFailed
                                      ? 'View AI failure details'
                                      : undefined
                            }
                        >
                            <Badge
                                variant="outline"
                                className={cn(
                                    'text-[10px] uppercase tracking-wide',
                                    aiNoChanges
                                        ? AI_NO_CHANGES_TONE
                                        : AI_STATUS_TONE[latestAttempt.status],
                                )}
                            >
                                {aiNoChanges
                                    ? AI_NO_CHANGES_LABEL
                                    : AI_STATUS_LABEL[latestAttempt.status]}
                            </Badge>
                        </button>
                    ) : (
                        <span className="text-muted-foreground/70 text-[10px]">
                            AI is enabled for this project
                        </span>
                    )}

                    <button
                        type="button"
                        onClick={onFixWithAi}
                        disabled={aiInFlight}
                        className={cn(
                            'inline-flex items-center gap-1 rounded-md border border-violet-500/40 bg-violet-500/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-violet-700 transition hover:bg-violet-500/15 dark:text-violet-300',
                            aiInFlight &&
                                'cursor-not-allowed opacity-60 hover:bg-violet-500/10',
                        )}
                    >
                        <Sparkles className="size-3" />
                        {aiInFlight ? 'Working…' : 'Fix with AI'}
                    </button>
                </div>
            ) : null}

            {showReviewButton ? (
                <div className="mt-3 flex items-center justify-between gap-2 border-t pt-2">
                    <span className="text-muted-foreground/80 text-[10px]">
                        {prUrl ? (
                            <>
                                AI fix applied —{' '}
                                <span className="text-foreground font-semibold tabular-nums">
                                    {proposedChangeCount}
                                </span>{' '}
                                file{proposedChangeCount === 1 ? '' : 's'}
                            </>
                        ) : (
                            <>
                                AI proposed{' '}
                                <span className="text-foreground font-semibold tabular-nums">
                                    {proposedChangeCount}
                                </span>{' '}
                                file{proposedChangeCount === 1 ? '' : 's'} to change
                            </>
                        )}
                    </span>
                    <div className="flex shrink-0 items-center gap-1.5">
                        <button
                            type="button"
                            onClick={onReviewClick}
                            className="inline-flex items-center gap-1 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 transition hover:bg-emerald-500/15 dark:text-emerald-300"
                        >
                            <GitCompare className="size-3" />
                            Review
                        </button>
                        {showCheckPrButton ? (
                            <a
                                href={prUrl ?? '#'}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-1 rounded-md border border-sky-500/40 bg-sky-500/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-sky-700 transition hover:bg-sky-500/15 dark:text-sky-300"
                            >
                                <ExternalLink className="size-3" />
                                Check PR
                            </a>
                        ) : null}
                    </div>
                </div>
            ) : null}

            {latestAttempt && (aiSucceeded || aiFailed) ? (
                <AiFixReviewModal
                    open={reviewOpen}
                    onOpenChange={setReviewOpen}
                    result={latestAttempt.result ?? null}
                    error={aiFailed ? (latestAttempt.error ?? null) : null}
                    attempt={latestAttempt}
                />
            ) : null}
        </div>
    );
}

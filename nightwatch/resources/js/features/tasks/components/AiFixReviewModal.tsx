import { router } from '@inertiajs/react';
import { CheckCircle2, ExternalLink, Sparkles } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { countDiffStats, diffLines, type DiffLine } from '../lib/diff';
import type { AiFixAttemptSummary, AiFixChange, AiFixResult } from '../types';

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    result: AiFixResult | null | undefined;
    error?: string | null;
    attempt?: AiFixAttemptSummary | null;
};

/**
 * Tabbed modal for reviewing the AI's proposed fix. One tab per changed file;
 * each tab renders a unified diff between the original (pre-fix) content and
 * the AI's new content. Old attempts that don't carry the original content
 * fall back to showing the new content as fully-added.
 */
export function AiFixReviewModal({
    open,
    onOpenChange,
    result,
    error,
    attempt,
}: Props) {
    const changes = result?.changes ?? [];
    const firstFile = changes[0]?.file_name ?? '';
    const [activeTab, setActiveTab] = useState<string>(firstFile);
    const [accepting, setAccepting] = useState(false);

    const activeFile = activeTab || firstFile;
    const applied = !!attempt?.applied_at;
    const applyError = attempt?.apply_error ?? null;
    const canAccept =
        !!attempt &&
        attempt.status === 'succeeded' &&
        changes.length > 0 &&
        !applied;

    const onAccept = () => {
        if (!attempt || accepting) return;
        setAccepting(true);
        router.post(
            `/ai-fix-attempts/${attempt.id}/apply`,
            {},
            {
                preserveScroll: true,
                only: ['kanban', 'flash'],
                onFinish: () => setAccepting(false),
                onSuccess: () => router.reload({ only: ['kanban'] }),
            },
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex h-[90vh] w-[min(1100px,96vw)] flex-col gap-0 p-0 sm:max-w-[1100px]">
                {/* Header — fixed at top of the dialog. */}
                <DialogHeader className="border-b px-6 py-4">
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="size-4 text-violet-500" />
                        Review AI fix
                    </DialogTitle>
                    {result?.repo ? (
                        <DialogDescription>
                            {result.repo.full_name} · {result.repo.branch}
                        </DialogDescription>
                    ) : null}
                </DialogHeader>

                {/* Body — flex-1 + min-h-0 so the diff inside can claim a real
                    bounded height; everything below it gets pushed to the bottom
                    of the dialog regardless of how large/small the diff is. */}
                <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden px-6 py-4">
                    {error ? (
                        <p className="rounded-md border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-700 dark:text-red-300">
                            {error}
                        </p>
                    ) : null}

                    {result?.summary ? (
                        <p className="text-muted-foreground shrink-0 text-sm leading-relaxed">
                            {result.summary}
                        </p>
                    ) : null}

                    {result?.suspect_files && result.suspect_files.length > 0 ? (
                        <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                            <span className="text-muted-foreground text-[11px] uppercase tracking-wide">
                                Inspected:
                            </span>
                            {result.suspect_files.map((path) => (
                                <Badge
                                    key={path}
                                    variant="outline"
                                    className="font-mono text-[10px]"
                                >
                                    {path}
                                </Badge>
                            ))}
                        </div>
                    ) : null}

                    {changes.length === 0 ? (
                        <div className="text-muted-foreground rounded-md border border-dashed p-6 text-center text-sm">
                            AI did not propose any file changes.
                        </div>
                    ) : (
                        <Tabs
                            value={activeFile}
                            onValueChange={setActiveTab}
                            className="flex min-h-0 flex-1 flex-col gap-3"
                        >
                            <ScrollArea className="w-full shrink-0">
                                <TabsList className="w-max max-w-full">
                                    {changes.map((change) => (
                                        <TabsTrigger
                                            key={change.file_name}
                                            value={change.file_name}
                                            className="font-mono text-xs"
                                            title={change.file_name}
                                        >
                                            {basename(change.file_name)}
                                        </TabsTrigger>
                                    ))}
                                </TabsList>
                            </ScrollArea>

                            {changes.map((change) => (
                                <TabsContent
                                    key={change.file_name}
                                    value={change.file_name}
                                    className="m-0 flex min-h-0 flex-1 flex-col"
                                >
                                    <FileDiffView change={change} />
                                </TabsContent>
                            ))}
                        </Tabs>
                    )}
                </div>

                {/* Footer — pinned to the bottom; banners stack above the buttons. */}
                <div className="flex shrink-0 flex-col gap-3 border-t px-6 py-4">
                    {applied && attempt?.apply_pr_url ? (
                        <div className="flex items-center gap-2 rounded-md border border-emerald-500/40 bg-emerald-500/10 p-3 text-xs text-emerald-700 dark:text-emerald-300">
                            <CheckCircle2 className="size-4 shrink-0" />
                            <span className="flex-1">
                                Applied — PR
                                {attempt.apply_pr_number !== null
                                    ? ` #${attempt.apply_pr_number}`
                                    : ''}{' '}
                                opened on{' '}
                                <span className="font-mono">
                                    {attempt.apply_branch_name}
                                </span>
                                .
                            </span>
                            <a
                                href={attempt.apply_pr_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex shrink-0 items-center gap-1 font-semibold underline-offset-2 hover:underline"
                            >
                                View PR
                                <ExternalLink className="size-3" />
                            </a>
                        </div>
                    ) : null}

                    {applyError ? (
                        <div className="rounded-md border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-700 dark:text-red-300">
                            <p className="font-semibold">
                                Couldn't apply this fix
                            </p>
                            <p className="mt-1 break-words">{applyError}</p>
                        </div>
                    ) : null}

                    <div className="flex items-center justify-end gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onOpenChange(false)}
                        >
                            Close
                        </Button>
                        {canAccept ? (
                            <Button
                                size="sm"
                                onClick={onAccept}
                                disabled={accepting}
                                className="bg-emerald-600 text-white hover:bg-emerald-700"
                            >
                                {accepting ? 'Applying…' : 'Accept & open PR'}
                            </Button>
                        ) : null}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function basename(path: string): string {
    const idx = path.lastIndexOf('/');
    return idx === -1 ? path : path.slice(idx + 1);
}

function FileDiffView({ change }: { change: AiFixChange }) {
    const lines = useMemo<DiffLine[]>(() => {
        const original = change.original_content ?? '';
        return diffLines(original, change.content);
    }, [change.original_content, change.content]);

    const stats = useMemo(() => countDiffStats(lines), [lines]);

    return (
        <div className="flex min-h-0 flex-1 flex-col gap-2">
            <div className="flex shrink-0 items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                    <p
                        className="truncate font-mono text-xs"
                        title={change.file_name}
                    >
                        {change.file_name}
                    </p>
                    {change.is_new_file ? (
                        <Badge
                            variant="outline"
                            className="shrink-0 border-emerald-500/40 bg-emerald-500/10 text-[10px] uppercase tracking-wide text-emerald-700 dark:text-emerald-300"
                        >
                            new file
                        </Badge>
                    ) : null}
                </div>
                <div className="flex shrink-0 items-center gap-2 text-[11px] tabular-nums">
                    <span className="text-emerald-600 dark:text-emerald-400">
                        +{stats.added}
                    </span>
                    <span className="text-red-600 dark:text-red-400">
                        −{stats.removed}
                    </span>
                </div>
            </div>

            {change.is_new_file ? (
                <p className="shrink-0 rounded-md border border-emerald-500/40 bg-emerald-500/10 p-2 text-[11px] text-emerald-700 dark:text-emerald-300">
                    The AI proposes creating this file. It does not exist in
                    the linked repository yet — every line is shown as added.
                </p>
            ) : null}

            {change.original_truncated ? (
                <p className="shrink-0 rounded-md border border-amber-500/40 bg-amber-500/10 p-2 text-[11px] text-amber-700 dark:text-amber-300">
                    The original file was truncated when sent to the AI; the
                    diff below reflects only the portion that was reviewed.
                </p>
            ) : null}

            {/* Native overflow-auto on a flex-1 + min-h-0 child is the most
                reliable scroll container inside a flex chain — shadcn's
                ScrollArea sometimes refuses to claim a bounded height in
                deeply-nested flex layouts and ends up flat. */}
            <div className="bg-background min-h-0 flex-1 overflow-auto rounded-md border">
                <table className="w-full border-collapse font-mono text-[11px] leading-snug">
                    <tbody>
                        {lines.map((line, idx) => (
                            <DiffRow key={idx} line={line} />
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function DiffRow({ line }: { line: DiffLine }) {
    const rowTone =
        line.type === 'add'
            ? 'bg-emerald-500/10'
            : line.type === 'remove'
              ? 'bg-red-500/10'
              : '';

    const op = line.type === 'add' ? '+' : line.type === 'remove' ? '−' : ' ';
    const opTone =
        line.type === 'add'
            ? 'text-emerald-700 dark:text-emerald-300'
            : line.type === 'remove'
              ? 'text-red-700 dark:text-red-300'
              : 'text-muted-foreground/50';

    return (
        <tr className={cn(rowTone)}>
            <td className="text-muted-foreground/60 select-none px-2 text-right tabular-nums w-[3rem]">
                {line.oldLine ?? ''}
            </td>
            <td className="text-muted-foreground/60 select-none px-2 text-right tabular-nums w-[3rem]">
                {line.newLine ?? ''}
            </td>
            <td
                className={cn(
                    'select-none px-1 text-center font-bold w-[1.5rem]',
                    opTone,
                )}
            >
                {op}
            </td>
            <td className="whitespace-pre-wrap break-words px-2 py-0">
                {line.content}
            </td>
        </tr>
    );
}

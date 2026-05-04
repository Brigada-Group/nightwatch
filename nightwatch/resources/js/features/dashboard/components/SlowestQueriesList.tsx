import { Database } from 'lucide-react';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { SlowQueryRow } from '../api/dashboardService';

type Props = {
    rows: SlowQueryRow[];
    timePeriod?: string;
};

function relativeTime(iso: string): string {
    if (!iso) return '';
    try {
        const then = new Date(iso).getTime();
        const diffMs = Date.now() - then;
        if (diffMs < 0) return 'just now';

        const minutes = Math.floor(diffMs / 60_000);
        if (minutes < 1) return 'just now';
        if (minutes < 60) return `${minutes}m ago`;

        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;

        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    } catch {
        return '';
    }
}

function formatDuration(ms: number): string {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
}

export function SlowestQueriesList({ rows, timePeriod = '24H' }: Props) {
    return (
        <Card className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
                <CardTitle className="text-sm font-semibold">
                    Slowest Queries
                </CardTitle>
                <span className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider">
                    {timePeriod}
                </span>
            </CardHeader>
            <CardContent className="px-3 pb-3 pt-0">
                {rows.length === 0 ? (
                    <p className="text-muted-foreground py-8 text-center text-xs">
                        No queries recorded in the last {timePeriod}.
                    </p>
                ) : (
                    <ol className="divide-y divide-border">
                        {rows.map((row, index) => (
                            <li
                                key={row.id}
                                className="flex items-start gap-3 py-2.5 first:pt-1 last:pb-1"
                            >
                                <span className="text-muted-foreground mt-0.5 w-5 shrink-0 text-right text-[11px] tabular-nums">
                                    {index + 1}
                                </span>
                                <Database className="text-muted-foreground mt-0.5 size-3.5 shrink-0" />
                                <div className="min-w-0 flex-1">
                                    <p
                                        className="text-foreground truncate font-mono text-xs"
                                        title={row.sql}
                                    >
                                        {row.sql}
                                    </p>
                                    <div className="text-muted-foreground mt-0.5 flex flex-wrap items-center gap-2 text-[11px]">
                                        <span
                                            className={cn(
                                                'font-mono tabular-nums font-semibold',
                                                row.duration_ms >= 1000
                                                    ? 'text-red-600 dark:text-red-300'
                                                    : row.duration_ms >= 200
                                                      ? 'text-amber-600 dark:text-amber-300'
                                                      : 'text-foreground',
                                            )}
                                        >
                                            {formatDuration(row.duration_ms)}
                                        </span>
                                        {row.is_slow ? (
                                            <span className="rounded-md border border-amber-500/40 bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                                                slow
                                            </span>
                                        ) : null}
                                        {row.is_n_plus_one ? (
                                            <span className="rounded-md border border-violet-500/40 bg-violet-500/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-violet-700 dark:text-violet-300">
                                                N+1
                                            </span>
                                        ) : null}
                                        {row.file ? (
                                            <span
                                                className="truncate"
                                                title={`${row.file}${row.line ? ':' + row.line : ''}`}
                                            >
                                                {row.file.split('/').pop()}
                                                {row.line ? `:${row.line}` : ''}
                                            </span>
                                        ) : null}
                                        <span className="ml-auto shrink-0 tabular-nums">
                                            {relativeTime(row.sent_at)}
                                        </span>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ol>
                )}
            </CardContent>
        </Card>
    );
}

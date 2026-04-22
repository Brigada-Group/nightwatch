import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

export type JobDurationRow = {
    job_class: string;
    runs: number;
    p50: number;
    p95: number;
    p99: number;
    avg: number;
};

type Props = {
    rows: JobDurationRow[];
};

function durationClass(ms: number): string {
    if (ms >= 10_000) {
        return 'text-rose-600 dark:text-rose-300';
    }
    if (ms >= 3_000) {
        return 'text-amber-600 dark:text-amber-300';
    }

    return 'text-foreground';
}

function formatMs(ms: number): string {
    if (ms >= 1000) {
        return `${(ms / 1000).toFixed(1)} s`;
    }

    return `${ms} ms`;
}

export function JobDurationTable({ rows }: Props) {
    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-base">
                    Job duration percentiles
                </CardTitle>
                <CardDescription>
                    Top {rows.length ? rows.length : 'N'} job classes by run
                    count — P50 / P95 / P99 of <code>duration_ms</code>. Amber
                    at 3 s, red at 10 s.
                </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Job class</TableHead>
                            <TableHead className="text-right">Runs</TableHead>
                            <TableHead className="text-right">Avg</TableHead>
                            <TableHead className="text-right">P50</TableHead>
                            <TableHead className="text-right">P95</TableHead>
                            <TableHead className="text-right">P99</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rows.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={6}
                                    className="text-muted-foreground py-8 text-center text-sm"
                                >
                                    No job data in this window.
                                </TableCell>
                            </TableRow>
                        ) : (
                            rows.map((r) => (
                                <TableRow key={r.job_class}>
                                    <TableCell className="max-w-xs truncate font-mono text-xs">
                                        {r.job_class}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-right text-xs tabular-nums">
                                        {r.runs.toLocaleString()}
                                    </TableCell>
                                    <TableCell
                                        className={cn(
                                            'text-right text-xs tabular-nums',
                                            durationClass(r.avg),
                                        )}
                                    >
                                        {formatMs(r.avg)}
                                    </TableCell>
                                    <TableCell
                                        className={cn(
                                            'text-right text-xs tabular-nums',
                                            durationClass(r.p50),
                                        )}
                                    >
                                        {formatMs(r.p50)}
                                    </TableCell>
                                    <TableCell
                                        className={cn(
                                            'text-right text-xs tabular-nums',
                                            durationClass(r.p95),
                                        )}
                                    >
                                        {formatMs(r.p95)}
                                    </TableCell>
                                    <TableCell
                                        className={cn(
                                            'text-right text-xs font-semibold tabular-nums',
                                            durationClass(r.p99),
                                        )}
                                    >
                                        {formatMs(r.p99)}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

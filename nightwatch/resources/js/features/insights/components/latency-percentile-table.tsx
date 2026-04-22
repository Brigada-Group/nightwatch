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

export type LatencyRow = {
    endpoint: string;
    requests: number;
    p50: number;
    p95: number;
    p99: number;
    avg: number;
};

type Props = {
    rows: LatencyRow[];
};

function latencyClass(ms: number): string {
    if (ms >= 1000) {
        return 'text-rose-600 dark:text-rose-300';
    }
    if (ms >= 500) {
        return 'text-amber-600 dark:text-amber-300';
    }

    return 'text-foreground';
}

export function LatencyPercentileTable({ rows }: Props) {
    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-base">
                    Latency percentiles per endpoint
                </CardTitle>
                <CardDescription>
                    Top {rows.length ? rows.length : 'N'} endpoints by traffic —
                    P50 / P95 / P99 of <code>duration_ms</code>. Columns turn
                    amber at 500 ms and red at 1 s.
                </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Endpoint</TableHead>
                            <TableHead className="text-right">Requests</TableHead>
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
                                    No request data in this window.
                                </TableCell>
                            </TableRow>
                        ) : (
                            rows.map((r) => (
                                <TableRow key={r.endpoint}>
                                    <TableCell className="max-w-xs truncate font-mono text-xs">
                                        {r.endpoint}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-right text-xs tabular-nums">
                                        {r.requests.toLocaleString()}
                                    </TableCell>
                                    <TableCell
                                        className={cn(
                                            'text-right text-xs tabular-nums',
                                            latencyClass(r.avg),
                                        )}
                                    >
                                        {r.avg} ms
                                    </TableCell>
                                    <TableCell
                                        className={cn(
                                            'text-right text-xs tabular-nums',
                                            latencyClass(r.p50),
                                        )}
                                    >
                                        {r.p50} ms
                                    </TableCell>
                                    <TableCell
                                        className={cn(
                                            'text-right text-xs tabular-nums',
                                            latencyClass(r.p95),
                                        )}
                                    >
                                        {r.p95} ms
                                    </TableCell>
                                    <TableCell
                                        className={cn(
                                            'text-right text-xs font-semibold tabular-nums',
                                            latencyClass(r.p99),
                                        )}
                                    >
                                        {r.p99} ms
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

import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { formatRelativeDate } from '../utils/formatters';
import type { Firing } from '../types';
import { SeverityBadge } from './SeverityBadge';

type Props = {
    firings: Firing[];
};

export function RecentFiringsTable({ firings }: Props) {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Rule</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Fired</TableHead>
                    <TableHead>Resolved</TableHead>
                    <TableHead className="text-right">Match count</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {firings.length === 0 ? (
                    <TableRow>
                        <TableCell
                            colSpan={5}
                            className="text-muted-foreground py-10 text-center text-sm"
                        >
                            No firings yet.
                        </TableCell>
                    </TableRow>
                ) : (
                    firings.map((f) => (
                        <TableRow key={f.id}>
                            <TableCell className="font-medium">
                                {f.rule_name ?? `#${f.alert_rule_id}`}
                            </TableCell>
                            <TableCell>
                                <SeverityBadge severity={f.severity} />
                            </TableCell>
                            <TableCell className="text-muted-foreground text-xs">
                                {formatRelativeDate(f.fired_at)}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-xs">
                                {f.resolved_at ? (
                                    formatRelativeDate(f.resolved_at)
                                ) : (
                                    <Badge
                                        variant="outline"
                                        className="border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300"
                                    >
                                        ongoing
                                    </Badge>
                                )}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                                {f.matched_count}
                            </TableCell>
                        </TableRow>
                    ))
                )}
            </TableBody>
        </Table>
    );
}

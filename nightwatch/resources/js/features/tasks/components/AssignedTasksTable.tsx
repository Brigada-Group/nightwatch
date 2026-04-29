import { format, parseISO } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { TASK_STATUS_LABELS, type ManagerTask, type TaskStatus } from '../types';

type Props = {
    tasks: ManagerTask[];
};

const STATUS_TONE: Record<TaskStatus, string> = {
    started: 'border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-300',
    ongoing:
        'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300',
    finished:
        'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
};

function formatRelative(iso: string | null): string {
    if (!iso) {
        return '—';
    }

    try {
        return format(parseISO(iso), 'MMM d, h:mm a');
    } catch {
        return '—';
    }
}

export function AssignedTasksTable({ tasks }: Props) {
    return (
        <Card className="overflow-hidden">
            <CardContent className="p-0">
                <Table className="table-fixed">
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[34%]">Exception</TableHead>
                            <TableHead className="w-[14%]">Project</TableHead>
                            <TableHead className="w-[20%]">Assignee</TableHead>
                            <TableHead className="w-[10%]">Severity</TableHead>
                            <TableHead className="w-[10%]">Status</TableHead>
                            <TableHead className="w-[12%] text-right">
                                Assigned
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {tasks.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={6}
                                    className="text-muted-foreground py-12 text-center text-sm whitespace-normal"
                                >
                                    You haven't assigned any exceptions yet.
                                    Open the{' '}
                                    <a
                                        href="/exceptions"
                                        className="text-foreground underline-offset-2 hover:underline"
                                    >
                                        Exceptions
                                    </a>{' '}
                                    page and pick an assignee to get started.
                                </TableCell>
                            </TableRow>
                        ) : (
                            tasks.map((task) => (
                                <TableRow key={task.id}>
                                    <TableCell className="align-top">
                                        <div className="min-w-0">
                                            <p
                                                className="truncate font-mono text-xs"
                                                title={task.exception_class}
                                            >
                                                {task.exception_class}
                                            </p>
                                            <p
                                                className="text-muted-foreground truncate text-xs"
                                                title={task.message}
                                            >
                                                {task.message}
                                            </p>
                                        </div>
                                    </TableCell>
                                    <TableCell className="align-top text-sm">
                                        <p
                                            className="truncate"
                                            title={task.project?.name}
                                        >
                                            {task.project?.name ?? `#${task.id}`}
                                        </p>
                                    </TableCell>
                                    <TableCell className="align-top text-sm">
                                        {task.assignee ? (
                                            <div className="min-w-0">
                                                <p
                                                    className="truncate font-medium"
                                                    title={task.assignee.name}
                                                >
                                                    {task.assignee.name}
                                                </p>
                                                {task.assignee.email ? (
                                                    <p
                                                        className="text-muted-foreground truncate text-xs"
                                                        title={task.assignee.email}
                                                    >
                                                        {task.assignee.email}
                                                    </p>
                                                ) : null}
                                            </div>
                                        ) : (
                                            <span className="text-muted-foreground">
                                                —
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell className="align-top">
                                        <Badge variant="outline">
                                            {task.severity}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="align-top">
                                        <span
                                            className={cn(
                                                'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium',
                                                STATUS_TONE[task.task_status],
                                            )}
                                        >
                                            {TASK_STATUS_LABELS[task.task_status]}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground align-top text-right text-xs">
                                        {formatRelative(task.assigned_at)}
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

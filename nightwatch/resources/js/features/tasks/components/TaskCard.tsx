import { format, parseISO } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { RecurrenceBadge } from '@/features/exceptions/components/RecurrenceBadge';
import { cn } from '@/lib/utils';
import type { DeveloperTask, TaskSourceType } from '../types';

type Props = {
    task: DeveloperTask;
    isDragging: boolean;
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

export function TaskCard({ task, isDragging, onDragStart, onDragEnd }: Props) {
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
        </div>
    );
}

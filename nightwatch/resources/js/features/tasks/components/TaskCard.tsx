import { format, parseISO } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { DeveloperTask } from '../types';

type Props = {
    task: DeveloperTask;
    isDragging: boolean;
    onDragStart: (task: DeveloperTask) => void;
    onDragEnd: () => void;
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
                    className="min-w-0 flex-1 truncate font-mono text-xs font-semibold leading-tight"
                    title={task.exception_class}
                >
                    {task.exception_class}
                </p>
                <Badge
                    variant="outline"
                    className="shrink-0 text-[10px] uppercase tracking-wide"
                >
                    {task.severity}
                </Badge>
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

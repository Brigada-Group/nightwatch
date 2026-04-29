import { useState } from 'react';
import { cn } from '@/lib/utils';
import { TaskCard } from './TaskCard';
import { TASK_STATUS_LABELS, type DeveloperTask, type TaskStatus } from '../types';

type Props = {
    status: TaskStatus;
    tasks: DeveloperTask[];
    accentClass: string;
    draggingId: number | null;
    onCardDragStart: (task: DeveloperTask) => void;
    onCardDragEnd: () => void;
    onDrop: (status: TaskStatus) => void;
};

export function TaskColumn({
    status,
    tasks,
    accentClass,
    draggingId,
    onCardDragStart,
    onCardDragEnd,
    onDrop,
}: Props) {
    const [isOver, setIsOver] = useState(false);

    return (
        <div
            onDragOver={(event) => {
                event.preventDefault();
                if (!isOver) {
                    setIsOver(true);
                }
            }}
            onDragLeave={() => setIsOver(false)}
            onDrop={(event) => {
                event.preventDefault();
                setIsOver(false);
                onDrop(status);
            }}
            className={cn(
                'bg-muted/30 flex h-full min-h-[400px] flex-col gap-3 rounded-lg border p-3 transition',
                isOver && 'border-primary/60 bg-primary/5',
            )}
        >
            <div className="flex items-center gap-2">
                <span className={cn('size-2 rounded-full', accentClass)} />
                <h2 className="text-foreground text-xs font-semibold uppercase tracking-wider">
                    {TASK_STATUS_LABELS[status]}
                </h2>
                <span className="text-muted-foreground ml-auto text-xs tabular-nums">
                    {tasks.length}
                </span>
            </div>

            <div className="flex flex-1 flex-col gap-2">
                {tasks.length === 0 ? (
                    <div className="text-muted-foreground/60 flex flex-1 items-center justify-center rounded-md border border-dashed py-8 text-center text-xs">
                        Drag a card here
                    </div>
                ) : (
                    tasks.map((task) => (
                        <TaskCard
                            key={task.id}
                            task={task}
                            isDragging={draggingId === task.id}
                            onDragStart={onCardDragStart}
                            onDragEnd={onCardDragEnd}
                        />
                    ))
                )}
            </div>
        </div>
    );
}

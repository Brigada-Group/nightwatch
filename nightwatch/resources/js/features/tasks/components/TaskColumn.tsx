import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { TaskCard } from './TaskCard';
import {
    TASK_STATUS_LABELS,
    type DeveloperTask,
    type ProjectAiConfigMap,
    type TaskStatus,
} from '../types';

type Props = {
    status: TaskStatus;
    tasks: DeveloperTask[];
    accentClass: string;
    draggingId: number | null;
    cleared: boolean;
    projectAiConfigs: ProjectAiConfigMap;
    onCardDragStart: (task: DeveloperTask) => void;
    onCardDragEnd: () => void;
    onDrop: (status: TaskStatus) => void;
    onToggleCleared: () => void;
};

export function TaskColumn({
    status,
    tasks,
    accentClass,
    draggingId,
    cleared,
    projectAiConfigs,
    onCardDragStart,
    onCardDragEnd,
    onDrop,
    onToggleCleared,
}: Props) {
    const [isOver, setIsOver] = useState(false);
    const hasCards = tasks.length > 0;

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
                'bg-muted/30 flex min-h-[240px] max-h-[calc(100vh-14rem)] flex-col gap-3 rounded-lg border p-3 transition',
                isOver && 'border-primary/60 bg-primary/5',
            )}
        >
            <div className="flex shrink-0 items-center gap-2">
                <span className={cn('size-2 rounded-full', accentClass)} />
                <h2 className="text-foreground text-xs font-semibold uppercase tracking-wider">
                    {TASK_STATUS_LABELS[status]}
                </h2>
                <span className="text-muted-foreground ml-auto text-xs tabular-nums">
                    {tasks.length}
                </span>
                {hasCards ? (
                    <button
                        type="button"
                        onClick={onToggleCleared}
                        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider transition hover:bg-muted"
                        title={
                            cleared
                                ? 'Show hidden cards'
                                : 'Hide cards in this column (UI only)'
                        }
                    >
                        {cleared ? (
                            <>
                                <Eye className="size-3" />
                                See
                            </>
                        ) : (
                            <>
                                <EyeOff className="size-3" />
                                Clear
                            </>
                        )}
                    </button>
                ) : null}
            </div>

            <div className="-mr-1 flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-1">
                {!hasCards ? (
                    <div className="text-muted-foreground/60 flex flex-1 items-center justify-center rounded-md border border-dashed py-8 text-center text-xs">
                        Drag a card here
                    </div>
                ) : cleared ? (
                    <div className="text-muted-foreground/70 flex flex-1 flex-col items-center justify-center gap-2 rounded-md border border-dashed py-8 text-center text-xs">
                        <span>
                            {tasks.length} card{tasks.length === 1 ? '' : 's'}{' '}
                            hidden
                        </span>
                        <button
                            type="button"
                            onClick={onToggleCleared}
                            className="text-foreground inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-[10px] font-medium hover:bg-muted"
                        >
                            <Eye className="size-3" />
                            Show again
                        </button>
                    </div>
                ) : (
                    tasks.map((task) => (
                        <TaskCard
                            key={task.id}
                            task={task}
                            isDragging={draggingId === task.id}
                            aiEnabled={
                                task.project !== null &&
                                projectAiConfigs[task.project.id]?.use_ai ===
                                    true
                            }
                            onDragStart={onCardDragStart}
                            onDragEnd={onCardDragEnd}
                        />
                    ))
                )}
            </div>
        </div>
    );
}

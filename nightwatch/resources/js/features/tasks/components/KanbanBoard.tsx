import { useCallback, useState } from 'react';
import { useLocalStorageState } from '@/hooks/use-local-storage';
import { useTaskBoard } from '../hooks/useTaskBoard';
import {
    TASK_STATUSES,
    type DeveloperTask,
    type KanbanColumns,
    type TaskStatus,
} from '../types';
import { TaskColumn } from './TaskColumn';

type Props = {
    initial: KanbanColumns;
};

const COLUMN_ACCENTS: Record<TaskStatus, string> = {
    started: 'bg-sky-500',
    ongoing: 'bg-amber-500',
    review: 'bg-violet-500',
    finished: 'bg-emerald-500',
};

const DEFAULT_CLEARED: Record<TaskStatus, boolean> = {
    started: false,
    ongoing: false,
    review: false,
    finished: false,
};

export function KanbanBoard({ initial }: Props) {
    const { columns, moveTask } = useTaskBoard(initial);
    const [dragging, setDragging] = useState<DeveloperTask | null>(null);
    const [cleared, setCleared] = useLocalStorageState<
        Record<TaskStatus, boolean>
    >('kanban.cleared', DEFAULT_CLEARED);

    const onCardDragStart = useCallback(
        (task: DeveloperTask) => setDragging(task),
        [],
    );

    const onCardDragEnd = useCallback(() => setDragging(null), []);

    const onDrop = useCallback(
        (toStatus: TaskStatus) => {
            if (!dragging) {
                return;
            }
            void moveTask(dragging, toStatus);
            setDragging(null);
        },
        [dragging, moveTask],
    );

    const onToggleCleared = useCallback(
        (status: TaskStatus) => {
            setCleared({ ...cleared, [status]: !cleared[status] });
        },
        [cleared, setCleared],
    );

    return (
        <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {TASK_STATUSES.map((status) => (
                <TaskColumn
                    key={status}
                    status={status}
                    tasks={columns[status]}
                    accentClass={COLUMN_ACCENTS[status]}
                    draggingId={dragging?.id ?? null}
                    cleared={cleared[status]}
                    onCardDragStart={onCardDragStart}
                    onCardDragEnd={onCardDragEnd}
                    onDrop={onDrop}
                    onToggleCleared={() => onToggleCleared(status)}
                />
            ))}
        </div>
    );
}

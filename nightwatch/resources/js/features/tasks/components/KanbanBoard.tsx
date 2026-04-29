import { useCallback, useState } from 'react';
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
    finished: 'bg-emerald-500',
};

export function KanbanBoard({ initial }: Props) {
    const { columns, moveTask } = useTaskBoard(initial);
    const [dragging, setDragging] = useState<DeveloperTask | null>(null);

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

    return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {TASK_STATUSES.map((status) => (
                <TaskColumn
                    key={status}
                    status={status}
                    tasks={columns[status]}
                    accentClass={COLUMN_ACCENTS[status]}
                    draggingId={dragging?.id ?? null}
                    onCardDragStart={onCardDragStart}
                    onCardDragEnd={onCardDragEnd}
                    onDrop={onDrop}
                />
            ))}
        </div>
    );
}

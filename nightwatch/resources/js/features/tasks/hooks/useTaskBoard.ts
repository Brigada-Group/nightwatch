import { router } from '@inertiajs/react';
import type { AxiosError } from 'axios';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { updateTaskStatus } from '../api/tasksService';
import type { DeveloperTask, KanbanColumns, TaskStatus } from '../types';

type ApiErrorPayload = {
    message?: string;
    errors?: Record<string, string[]>;
};

function readErrorMessage(error: unknown, fallback: string): string {
    const axiosError = error as AxiosError<ApiErrorPayload>;
    const validation = axiosError.response?.data?.errors
        ? Object.values(axiosError.response.data.errors)[0]?.[0]
        : undefined;

    return validation ?? axiosError.response?.data?.message ?? fallback;
}

function moveCard(
    columns: KanbanColumns,
    taskId: number,
    fromStatus: TaskStatus,
    toStatus: TaskStatus,
): KanbanColumns {
    if (fromStatus === toStatus) {
        return columns;
    }

    const card = columns[fromStatus].find((t) => t.id === taskId);

    if (!card) {
        return columns;
    }

    return {
        ...columns,
        [fromStatus]: columns[fromStatus].filter((t) => t.id !== taskId),
        [toStatus]: [{ ...card, task_status: toStatus }, ...columns[toStatus]],
    };
}

/**
 * Owns the kanban state, the optimistic move, and rollback on failure. Keeps
 * the visible UI snappy while the server response settles, and re-fetches the
 * canonical board via Inertia partial reload afterwards so other props stay
 * in sync.
 */
export function useTaskBoard(initial: KanbanColumns) {
    const [columns, setColumns] = useState<KanbanColumns>(initial);

    const moveTask = useCallback(
        async (task: DeveloperTask, toStatus: TaskStatus) => {
            const fromStatus = task.task_status;
            if (fromStatus === toStatus) {
                return;
            }

            setColumns((prev) => moveCard(prev, task.id, fromStatus, toStatus));

            try {
                await updateTaskStatus(task.id, toStatus, task.source_type);
                router.reload({ only: ['kanban'] });
            } catch (error) {
                setColumns((prev) => moveCard(prev, task.id, toStatus, fromStatus));
                toast.error(readErrorMessage(error, 'Could not move the task.'));
            }
        },
        [],
    );

    return { columns, moveTask };
}

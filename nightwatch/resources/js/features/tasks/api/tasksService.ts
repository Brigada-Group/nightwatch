import { webApi } from '@/shared/api/client';
import type { TaskSourceType, TaskStatus } from '../types';

type UpdateStatusResponse = {
    data: {
        id: number;
        task_status: TaskStatus;
    };
};

export async function updateTaskStatus(
    taskId: number,
    status: TaskStatus,
    sourceType: TaskSourceType,
): Promise<UpdateStatusResponse['data']> {
    const path =
        sourceType === 'exception'
            ? `/tasks/${taskId}/status`
            : `/tasks/issues/${taskId}/status`;

    const { data } = await webApi.patch<UpdateStatusResponse>(path, { status });

    return data.data;
}

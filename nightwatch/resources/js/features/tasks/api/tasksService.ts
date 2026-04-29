import { webApi } from '@/shared/api/client';
import type { TaskStatus } from '../types';

type UpdateStatusResponse = {
    data: {
        id: number;
        task_status: TaskStatus;
    };
};

export async function updateTaskStatus(
    exceptionId: number,
    status: TaskStatus,
): Promise<UpdateStatusResponse['data']> {
    const { data } = await webApi.patch<UpdateStatusResponse>(
        `/tasks/${exceptionId}/status`,
        { status },
    );

    return data.data;
}

import type { HubScheduledTask, PaginatedResponse } from '@/entities';
import { api } from '@/shared/api/client';

type ScheduledTaskFilters = {
    project_id?: number;
    status?: string;
    environment?: string;
    page?: number;
    per_page?: number;
};

export const getScheduledTasks = async (
    filters: ScheduledTaskFilters = {},
): Promise<PaginatedResponse<HubScheduledTask>> => {
    const { data } = await api.get('/scheduled-tasks', { params: filters });
    return data;
};

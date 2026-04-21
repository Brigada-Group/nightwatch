import type { HubLog, PaginatedResponse } from '@/entities';
import { api } from '@/shared/api/client';

type LogFilters = {
    project_id?: number;
    level?: string;
    environment?: string;
    page?: number;
    per_page?: number;
};

export const getLogs = async (
    filters: LogFilters = {},
): Promise<PaginatedResponse<HubLog>> => {
    const { data } = await api.get('/logs', { params: filters });
    return data;
};

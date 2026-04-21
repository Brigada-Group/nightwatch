import type { HubException, PaginatedResponse } from '@/entities';
import { api } from '@/shared/api/client';

type ExceptionFilters = {
    project_id?: number;
    severity?: string;
    environment?: string;
    page?: number;
    per_page?: number;
};

export const getExceptions = async (
    filters: ExceptionFilters = {},
): Promise<PaginatedResponse<HubException>> => {
    const { data } = await api.get('/exceptions', { params: filters });
    return data;
};

export const getException = async (id: number): Promise<HubException> => {
    const { data } = await api.get(`/exceptions/${id}`);
    return data;
};

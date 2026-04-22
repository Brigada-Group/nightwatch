import type { HubRequest, PaginatedResponse } from '@/entities';
import { api } from '@/shared/api/client';

type RequestFilters = {
    project_id?: number;
    method?: string;
    status_code?: number;
    environment?: string;
    page?: number;
    per_page?: number;
};

export const getRequests = async (
    filters: RequestFilters = {},
): Promise<PaginatedResponse<HubRequest>> => {
    const { data } = await api.get('/requests', { params: filters });

    return data;
};

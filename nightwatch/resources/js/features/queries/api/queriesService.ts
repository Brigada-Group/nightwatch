import type { HubQuery, PaginatedResponse } from '@/entities';
import { api } from '@/shared/api/client';

type QueryFilters = {
    project_id?: number;
    is_slow?: boolean;
    is_n_plus_one?: boolean;
    environment?: string;
    page?: number;
    per_page?: number;
};

export const getQueries = async (
    filters: QueryFilters = {},
): Promise<PaginatedResponse<HubQuery>> => {
    const { data } = await api.get('/queries', { params: filters });
    return data;
};

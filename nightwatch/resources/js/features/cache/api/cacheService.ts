import type { HubCache, PaginatedResponse } from '@/entities';
import { api } from '@/shared/api/client';

type CacheFilters = {
    project_id?: number;
    environment?: string;
    page?: number;
    per_page?: number;
};

export const getCacheStats = async (
    filters: CacheFilters = {},
): Promise<PaginatedResponse<HubCache>> => {
    const { data } = await api.get('/cache', { params: filters });

    return data;
};

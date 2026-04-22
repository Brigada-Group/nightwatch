import type { HubHealthCheck, PaginatedResponse } from '@/entities';
import { api } from '@/shared/api/client';

type HealthFilters = {
    project_id?: number;
    status?: string;
    environment?: string;
    page?: number;
    per_page?: number;
};

export const getHealthChecks = async (
    filters: HealthFilters = {},
): Promise<PaginatedResponse<HubHealthCheck>> => {
    const { data } = await api.get('/health-checks', { params: filters });

    return data;
};

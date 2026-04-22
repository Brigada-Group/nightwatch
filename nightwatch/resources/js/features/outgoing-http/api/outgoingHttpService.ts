import type { HubOutgoingHttp, PaginatedResponse } from '@/entities';
import { api } from '@/shared/api/client';

type OutgoingHttpFilters = {
    project_id?: number;
    failed?: boolean;
    environment?: string;
    page?: number;
    per_page?: number;
};

export const getOutgoingHttp = async (
    filters: OutgoingHttpFilters = {},
): Promise<PaginatedResponse<HubOutgoingHttp>> => {
    const { data } = await api.get('/outgoing-http', { params: filters });

    return data;
};

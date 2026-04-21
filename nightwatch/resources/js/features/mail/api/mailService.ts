import type { HubMail, PaginatedResponse } from '@/entities';
import { api } from '@/shared/api/client';

type MailFilters = {
    project_id?: number;
    status?: string;
    environment?: string;
    page?: number;
    per_page?: number;
};

export const getMails = async (
    filters: MailFilters = {},
): Promise<PaginatedResponse<HubMail>> => {
    const { data } = await api.get('/mail', { params: filters });
    return data;
};

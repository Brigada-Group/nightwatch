import type { HubJob, PaginatedResponse } from '@/entities';
import { api } from '@/shared/api/client';

type JobFilters = {
    project_id?: number;
    status?: string;
    environment?: string;
    page?: number;
    per_page?: number;
};

export const getJobs = async (
    filters: JobFilters = {},
): Promise<PaginatedResponse<HubJob>> => {
    const { data } = await api.get('/jobs', { params: filters });

    return data;
};

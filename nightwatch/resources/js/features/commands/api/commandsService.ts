import type { HubCommand, PaginatedResponse } from '@/entities';
import { api } from '@/shared/api/client';

type CommandFilters = {
    project_id?: number;
    environment?: string;
    page?: number;
    per_page?: number;
};

export const getCommands = async (
    filters: CommandFilters = {},
): Promise<PaginatedResponse<HubCommand>> => {
    const { data } = await api.get('/commands', { params: filters });
    return data;
};

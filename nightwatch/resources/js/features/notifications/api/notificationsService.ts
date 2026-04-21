import type { HubNotification, PaginatedResponse } from '@/entities';
import { api } from '@/shared/api/client';

type NotificationFilters = {
    project_id?: number;
    status?: string;
    environment?: string;
    page?: number;
    per_page?: number;
};

export const getNotifications = async (
    filters: NotificationFilters = {},
): Promise<PaginatedResponse<HubNotification>> => {
    const { data } = await api.get('/notifications', { params: filters });
    return data;
};

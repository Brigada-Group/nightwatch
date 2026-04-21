import type { PaginatedResponse, Project } from '@/entities';
import { api } from '@/shared/api/client';

export const getProjects = async (): Promise<PaginatedResponse<Project>> => {
    const { data } = await api.get('/projects');
    return data;
};

export const getProject = async (id: number): Promise<Project> => {
    const { data } = await api.get(`/projects/${id}`);
    return data;
};

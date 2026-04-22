import type { PaginatedResponse, Project } from '@/entities';
import { api } from '@/shared/api/client';

export const getProjects = async (): Promise<PaginatedResponse<Project>> => {
    const { data } = await api.get('/projects');

    return data;
};

export const getProject = async (uuid: string): Promise<Project> => {
    const { data } = await api.get(`/projects/${uuid}`);

    return data;
};

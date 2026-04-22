import { useQuery } from '@tanstack/react-query';
import { getProject, getProjects } from '../api/projectsService';

export function useProjects() {
    return useQuery({
        queryKey: ['projects'],
        queryFn: getProjects,
    });
}

export function useProject(uuid: string) {
    return useQuery({
        queryKey: ['projects', uuid],
        queryFn: () => getProject(uuid),
        enabled: Boolean(uuid),
    });
}

import { useQuery } from '@tanstack/react-query';
import { getProject, getProjects } from '../api/projectsService';

export function useProjects() {
    return useQuery({
        queryKey: ['projects'],
        queryFn: getProjects,
    });
}

export function useProject(id: number) {
    return useQuery({
        queryKey: ['projects', id],
        queryFn: () => getProject(id),
        enabled: id > 0,
    });
}

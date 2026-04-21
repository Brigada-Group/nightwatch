import { useQuery } from '@tanstack/react-query';
import { getJobs } from '../api/jobsService';

type UseJobsOptions = {
    projectId?: number;
    status?: string;
    environment?: string;
    page?: number;
    perPage?: number;
};

export function useJobs(options: UseJobsOptions = {}) {
    return useQuery({
        queryKey: ['jobs', options],
        queryFn: () =>
            getJobs({
                project_id: options.projectId,
                status: options.status,
                environment: options.environment,
                page: options.page,
                per_page: options.perPage,
            }),
    });
}

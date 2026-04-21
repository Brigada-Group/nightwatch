import { useQuery } from '@tanstack/react-query';
import { getRequests } from '../api/requestsService';

type UseRequestsOptions = {
    projectId?: number;
    method?: string;
    statusCode?: number;
    environment?: string;
    page?: number;
    perPage?: number;
};

export function useRequests(options: UseRequestsOptions = {}) {
    return useQuery({
        queryKey: ['requests', options],
        queryFn: () =>
            getRequests({
                project_id: options.projectId,
                method: options.method,
                status_code: options.statusCode,
                environment: options.environment,
                page: options.page,
                per_page: options.perPage,
            }),
    });
}

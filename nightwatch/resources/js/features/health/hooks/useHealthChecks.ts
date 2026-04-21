import { useQuery } from '@tanstack/react-query';
import { getHealthChecks } from '../api/healthService';

type UseHealthChecksOptions = {
    projectId?: number;
    status?: string;
    environment?: string;
    page?: number;
    perPage?: number;
};

export function useHealthChecks(options: UseHealthChecksOptions = {}) {
    return useQuery({
        queryKey: ['health-checks', options],
        queryFn: () =>
            getHealthChecks({
                project_id: options.projectId,
                status: options.status,
                environment: options.environment,
                page: options.page,
                per_page: options.perPage,
            }),
    });
}

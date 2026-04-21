import { useQuery } from '@tanstack/react-query';
import { getException, getExceptions } from '../api/exceptionsService';

type UseExceptionsOptions = {
    projectId?: number;
    severity?: string;
    environment?: string;
    page?: number;
    perPage?: number;
};

export function useExceptions(options: UseExceptionsOptions = {}) {
    return useQuery({
        queryKey: ['exceptions', options],
        queryFn: () =>
            getExceptions({
                project_id: options.projectId,
                severity: options.severity,
                environment: options.environment,
                page: options.page,
                per_page: options.perPage,
            }),
    });
}

export function useException(id: number) {
    return useQuery({
        queryKey: ['exceptions', id],
        queryFn: () => getException(id),
        enabled: id > 0,
    });
}

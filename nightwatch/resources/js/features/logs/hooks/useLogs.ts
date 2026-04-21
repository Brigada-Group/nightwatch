import { useQuery } from '@tanstack/react-query';
import { getLogs } from '../api/logsService';

type UseLogsOptions = {
    projectId?: number;
    level?: string;
    environment?: string;
    page?: number;
    perPage?: number;
};

export function useLogs(options: UseLogsOptions = {}) {
    return useQuery({
        queryKey: ['logs', options],
        queryFn: () =>
            getLogs({
                project_id: options.projectId,
                level: options.level,
                environment: options.environment,
                page: options.page,
                per_page: options.perPage,
            }),
    });
}

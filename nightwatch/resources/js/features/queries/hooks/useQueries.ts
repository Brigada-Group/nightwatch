import { useQuery } from '@tanstack/react-query';
import { getQueries } from '../api/queriesService';

type UseQueriesOptions = {
    projectId?: number;
    isSlow?: boolean;
    isNPlusOne?: boolean;
    environment?: string;
    page?: number;
    perPage?: number;
};

export function useHubQueries(options: UseQueriesOptions = {}) {
    return useQuery({
        queryKey: ['queries', options],
        queryFn: () =>
            getQueries({
                project_id: options.projectId,
                is_slow: options.isSlow,
                is_n_plus_one: options.isNPlusOne,
                environment: options.environment,
                page: options.page,
                per_page: options.perPage,
            }),
    });
}

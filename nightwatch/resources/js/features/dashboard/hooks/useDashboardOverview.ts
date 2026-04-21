import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
    EMPTY_FILTERS,
    filtersAreActive,
    getDashboardOverview,
    type DashboardFilters,
    type DashboardOverview,
} from '../api/dashboardService';

export function useDashboardOverview(
    initial: DashboardOverview,
    filters: DashboardFilters = EMPTY_FILTERS,
) {
    const active = filtersAreActive(filters);
    const normalized: DashboardFilters = {
        search: filters.search.trim(),
        statuses: [...filters.statuses].sort(),
        environments: [...filters.environments].sort(),
    };

    return useQuery({
        queryKey: ['dashboard', 'overview', normalized],
        queryFn: () => getDashboardOverview(active ? normalized : undefined),
        initialData: active ? undefined : initial,
        refetchInterval: 30_000,
        placeholderData: keepPreviousData,
    });
}

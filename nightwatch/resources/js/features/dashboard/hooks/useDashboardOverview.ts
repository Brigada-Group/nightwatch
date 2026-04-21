import { useQuery } from '@tanstack/react-query';
import {
    getDashboardOverview,
    type DashboardOverview,
} from '../api/dashboardService';

export function useDashboardOverview(initial: DashboardOverview) {
    return useQuery({
        queryKey: ['dashboard', 'overview'],
        queryFn: getDashboardOverview,
        initialData: initial,
        refetchInterval: 30_000,
    });
}

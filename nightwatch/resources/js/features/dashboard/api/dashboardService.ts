import { api } from '@/shared/api/client';

export type DashboardStats = {
    total_projects: number;
    active_projects: number;
    critical_projects: number;
    total_exceptions_24h: number;
    total_requests_24h: number;
    avg_response_time_24h: number;
    failed_jobs_24h: number;
    health_check_failures: number;
};

export type ProjectSummary = {
    id: number;
    name: string;
    status: string;
    environment: string;
    last_heartbeat_at: string | null;
    exceptions_24h: number;
    requests_24h: number;
    logs_24h?: number;
};

export type IncidentFlowPoint = {
    time: string;
    exceptions: number;
    warnings: number;
};

export type IncidentVolumePoint = {
    time: string;
    errors: number;
    warnings: number;
};

export type ChartBarPoint = { value: number };

export type DashboardOverview = {
    stats: DashboardStats;
    recent_projects: ProjectSummary[];
    incident_flow: IncidentFlowPoint[];
    incident_volume: IncidentVolumePoint[];
    throughput_chart: ChartBarPoint[];
    bugs_chart: ChartBarPoint[];
    running_checks_chart: ChartBarPoint[];
    filter_active: boolean;
};

export type DashboardFilters = {
    search: string;
    statuses: string[];
    environments: string[];
};

export const EMPTY_FILTERS: DashboardFilters = {
    search: '',
    statuses: [],
    environments: [],
};

export function filtersAreActive(filters: DashboardFilters): boolean {
    return (
        filters.search.trim() !== '' ||
        filters.statuses.length > 0 ||
        filters.environments.length > 0
    );
}

export function emptyDashboardOverview(): DashboardOverview {
    return {
        stats: {
            total_projects: 0,
            active_projects: 0,
            critical_projects: 0,
            total_exceptions_24h: 0,
            total_requests_24h: 0,
            avg_response_time_24h: 0,
            failed_jobs_24h: 0,
            health_check_failures: 0,
        },
        recent_projects: [],
        incident_flow: [],
        incident_volume: [],
        throughput_chart: Array.from({ length: 24 }, () => ({ value: 0 })),
        bugs_chart: Array.from({ length: 7 }, () => ({ value: 0 })),
        running_checks_chart: Array.from({ length: 24 }, () => ({
            value: 0,
        })),
        filter_active: false,
    };
}

export function mergeDashboardOverview(
    partial: Partial<DashboardOverview>,
): DashboardOverview {
    const base = emptyDashboardOverview();

    return {
        stats: { ...base.stats, ...partial.stats },
        recent_projects: partial.recent_projects ?? base.recent_projects,
        incident_flow: partial.incident_flow ?? base.incident_flow,
        incident_volume: partial.incident_volume ?? base.incident_volume,
        throughput_chart:
            partial.throughput_chart ?? base.throughput_chart,
        bugs_chart: partial.bugs_chart ?? base.bugs_chart,
        running_checks_chart:
            partial.running_checks_chart ?? base.running_checks_chart,
        filter_active: partial.filter_active ?? base.filter_active,
    };
}

export async function getDashboardOverview(
    filters?: DashboardFilters,
): Promise<DashboardOverview> {
    const params: Record<string, string> = {};

    if (filters) {
        const trimmed = filters.search.trim();

        if (trimmed !== '') {
params.search = trimmed;
}

        if (filters.statuses.length > 0) {
            params.statuses = filters.statuses.join(',');
        }

        if (filters.environments.length > 0) {
            params.environments = filters.environments.join(',');
        }
    }

    const { data } = await api.get<DashboardOverview>('/dashboard', { params });

    return data;
}

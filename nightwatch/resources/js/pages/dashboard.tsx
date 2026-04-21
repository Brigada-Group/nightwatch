import { Head } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import type { ProjectStatus } from '@/entities';
import { ActiveProjectsCard } from '@/features/dashboard/components/ActiveProjectsCard';
import { DashboardToolbar } from '@/features/dashboard/components/DashboardToolbar';
import { ErrorTrendChart } from '@/features/dashboard/components/ErrorTrendChart';
import { FilteredProjectsGrid } from '@/features/dashboard/components/FilteredProjectsGrid';
import { SeverityBreakdownChart } from '@/features/dashboard/components/SeverityBreakdownChart';
import { StatCard } from '@/features/dashboard/components/StatCard';
import {
    EMPTY_FILTERS,
    filtersAreActive,
    mergeDashboardOverview,
    type DashboardFilters,
    type DashboardOverview,
    type ProjectSummary,
} from '@/features/dashboard/api/dashboardService';
import { useDashboardOverview } from '@/features/dashboard/hooks/useDashboardOverview';
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue';

type DashboardPageProps = Partial<DashboardOverview>;

export default function Dashboard(raw: DashboardPageProps) {
    const initial = mergeDashboardOverview(raw);

    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState<DashboardFilters>(EMPTY_FILTERS);

    const debouncedSearch = useDebouncedValue(searchQuery, 300);

    const effectiveFilters = useMemo<DashboardFilters>(
        () => ({
            search: debouncedSearch,
            statuses: filters.statuses,
            environments: filters.environments,
        }),
        [debouncedSearch, filters.statuses, filters.environments],
    );

    const { data } = useDashboardOverview(initial, effectiveFilters);
    const view = data ?? initial;

    const stats = view.stats;
    const projects = (view.recent_projects ?? []) as ProjectSummary[];
    const isFiltered = filtersAreActive(effectiveFilters) && view.filter_active;

    const throughputTxPerS =
        stats.total_requests_24h > 0
            ? (stats.total_requests_24h / 86400).toFixed(2)
            : '0.00';

    const availableEnvironments = useMemo(() => {
        const set = new Set<string>();
        for (const p of projects) {
            if (p.environment) set.add(p.environment);
        }
        return [...set];
    }, [projects]);

    return (
        <>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <h1 className="text-2xl font-bold tracking-tight">
                        Dashboard
                    </h1>
                </div>

                <DashboardToolbar
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    filters={filters}
                    onFiltersChange={(next) => {
                        setFilters(next);
                        if (next.search !== searchQuery) {
                            setSearchQuery(next.search);
                        }
                    }}
                    availableEnvironments={availableEnvironments}
                />

                {isFiltered ? (
                    <>
                        <div className="text-muted-foreground text-sm">
                            Showing{' '}
                            <span className="text-foreground font-semibold">
                                {projects.length}
                            </span>{' '}
                            {projects.length === 1 ? 'project' : 'projects'} matching
                            your filters.
                        </div>
                        <FilteredProjectsGrid projects={projects} />
                    </>
                ) : (
                    <>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            <StatCard
                                title="System Throughput"
                                value={throughputTxPerS}
                                subtitle="TX/S"
                                timePeriod="24H"
                                chartData={view.throughput_chart}
                                chartColor="#6d8cff"
                            />

                            <ActiveProjectsCard
                                projects={projects.map((p) => ({
                                    ...p,
                                    status: p.status as ProjectStatus,
                                }))}
                                activeCount={stats.active_projects}
                                totalCount={stats.total_projects}
                                timePeriod="24H"
                                activityData={view.running_checks_chart}
                            />

                            <StatCard
                                title="Found Bugs"
                                value={stats.total_exceptions_24h}
                                subtitle="Bugs Found"
                                timePeriod="7 Days"
                                chartData={view.bugs_chart}
                                chartColor="#ef4444"
                            />
                        </div>

                        <div className="grid gap-6 lg:grid-cols-2">
                            <ErrorTrendChart
                                data={view.incident_flow}
                                timePeriod="24H"
                            />
                            <SeverityBreakdownChart
                                data={view.incident_volume}
                                timePeriod="24H"
                            />
                        </div>
                    </>
                )}
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: '/dashboard',
        },
    ],
};

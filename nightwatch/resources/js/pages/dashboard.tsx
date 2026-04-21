import { Head } from '@inertiajs/react';
import { useState } from 'react';
import type { ProjectStatus } from '@/entities';
import { ActiveProjectsCard } from '@/features/dashboard/components/ActiveProjectsCard';
import { DashboardToolbar } from '@/features/dashboard/components/DashboardToolbar';
import { ErrorTrendChart } from '@/features/dashboard/components/ErrorTrendChart';
import { SeverityBreakdownChart } from '@/features/dashboard/components/SeverityBreakdownChart';
import { StatCard } from '@/features/dashboard/components/StatCard';
import {
    mergeDashboardOverview,
    type DashboardOverview,
    type ProjectSummary,
} from '@/features/dashboard/api/dashboardService';
import { useDashboardOverview } from '@/features/dashboard/hooks/useDashboardOverview';

type DashboardPageProps = Partial<DashboardOverview>;

export default function Dashboard(raw: DashboardPageProps) {
    const initial = mergeDashboardOverview(raw);
    const { data } = useDashboardOverview(initial);
    
    const stats = data.stats;
    const projects = (data.recent_projects ?? []) as ProjectSummary[];
    const [searchQuery, setSearchQuery] = useState('');

    const throughputTxPerS =
        stats.total_requests_24h > 0
            ? (stats.total_requests_24h / 86400).toFixed(2)
            : '0.00';

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
                />

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <StatCard
                        title="System Throughput"
                        value={throughputTxPerS}
                        subtitle="TX/S"
                        timePeriod="24H"
                        chartData={data.throughput_chart}
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
                        activityData={data.running_checks_chart}
                    />

                    <StatCard
                        title="Found Bugs"
                        value={stats.total_exceptions_24h}
                        subtitle="Bugs Found"
                        timePeriod="7 Days"
                        chartData={data.bugs_chart}
                        chartColor="#ef4444"
                    />
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    <ErrorTrendChart
                        data={data.incident_flow}
                        timePeriod="24H"
                    />
                    <SeverityBreakdownChart
                        data={data.incident_volume}
                        timePeriod="24H"
                    />
                </div>
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

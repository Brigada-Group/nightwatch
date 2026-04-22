import { Head, router, usePage } from '@inertiajs/react';
import { ProjectFilter } from '@/components/monitoring/project-filter';
import { ResourcePageHeader } from '@/components/monitoring/resource-page-header';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ErrorHeatmap } from '@/features/insights/components/error-heatmap';
import type { HeatmapCell } from '@/features/insights/components/error-heatmap';
import { JobDurationTable } from '@/features/insights/components/job-duration-table';
import type { JobDurationRow } from '@/features/insights/components/job-duration-table';
import { JobThroughputChart } from '@/features/insights/components/job-throughput-chart';
import type { ThroughputPoint } from '@/features/insights/components/job-throughput-chart';
import { LatencyPercentileTable } from '@/features/insights/components/latency-percentile-table';
import type { LatencyRow } from '@/features/insights/components/latency-percentile-table';
import { RetryDistributionChart } from '@/features/insights/components/retry-distribution-chart';
import type { RetryBucket } from '@/features/insights/components/retry-distribution-chart';
import { StatusMixChart } from '@/features/insights/components/status-mix-chart';
import type { StatusMixPoint } from '@/features/insights/components/status-mix-chart';
import type { ProjectOption } from '@/types/monitoring';

type Tab = 'requests' | 'jobs';
type Window = '24h' | '7d' | '30d';

type Filters = {
    project_id: number | null;
    window: Window;
    tab: Tab;
};

type RequestsData = {
    status_mix: StatusMixPoint[];
    latency: LatencyRow[];
    heatmap: { cells: HeatmapCell[]; max: number };
};

type JobsData = {
    throughput: ThroughputPoint[];
    retry_distribution: RetryBucket[];
    job_durations: JobDurationRow[];
};

type PageProps = {
    tab: Tab;
    window: Window;
    filters: Filters;
    projectOptions: ProjectOption[];
    windowOptions: Window[];
    data: RequestsData | JobsData;
};

const WINDOW_LABELS: Record<Window, string> = {
    '24h': 'Last 24 hours',
    '7d': 'Last 7 days',
    '30d': 'Last 30 days',
};

export default function InsightsIndex() {
    const { tab, window, filters, projectOptions, windowOptions, data } =
        usePage<PageProps>().props;

    const navigate = (next: Partial<Filters>) => {
        router.get(
            '/insights',
            {
                tab: next.tab ?? filters.tab,
                window: next.window ?? filters.window,
                project_id:
                    next.project_id !== undefined
                        ? next.project_id ?? undefined
                        : (filters.project_id ?? undefined),
            },
            { preserveScroll: true, preserveState: true, replace: true },
        );
    };

    const requestsData = tab === 'requests' ? (data as RequestsData) : null;
    const jobsData = tab === 'jobs' ? (data as JobsData) : null;

    return (
        <>
            <Head title="Insights" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <ResourcePageHeader
                    title="Insights"
                    description="Visual deep-dive on HTTP request reliability and job health, powered by ingested Guardian telemetry."
                    toolbar={
                        <div className="flex flex-wrap items-end gap-3">
                            <Select
                                value={window}
                                onValueChange={(v) =>
                                    navigate({ window: v as Window })
                                }
                            >
                                <SelectTrigger className="w-40">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {windowOptions.map((w) => (
                                        <SelectItem key={w} value={w}>
                                            {WINDOW_LABELS[w]}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <ProjectFilter
                                path="/insights"
                                value={filters.project_id}
                                options={projectOptions}
                                filters={{
                                    tab: filters.tab,
                                    window: filters.window,
                                }}
                            />
                        </div>
                    }
                />

                <Tabs
                    value={tab}
                    onValueChange={(v) => navigate({ tab: v as Tab })}
                >
                    <TabsList>
                        <TabsTrigger value="requests">
                            Request Reliability
                        </TabsTrigger>
                        <TabsTrigger value="jobs">Jobs Health</TabsTrigger>
                    </TabsList>

                    <TabsContent value="requests" className="space-y-4">
                        {requestsData && (
                            <>
                                <StatusMixChart data={requestsData.status_mix} />
                                <LatencyPercentileTable
                                    rows={requestsData.latency}
                                />
                                <ErrorHeatmap
                                    cells={requestsData.heatmap.cells}
                                    max={requestsData.heatmap.max}
                                />
                            </>
                        )}
                    </TabsContent>

                    <TabsContent value="jobs" className="space-y-4">
                        {jobsData && (
                            <>
                                <JobThroughputChart data={jobsData.throughput} />
                                <RetryDistributionChart
                                    data={jobsData.retry_distribution}
                                />
                                <JobDurationTable rows={jobsData.job_durations} />
                            </>
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </>
    );
}

InsightsIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Insights', href: '/insights' },
    ],
};

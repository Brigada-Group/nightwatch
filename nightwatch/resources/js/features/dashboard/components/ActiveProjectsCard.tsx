import { useMemo } from 'react';
import {
    Bar,
    BarChart,
    ResponsiveContainer,
} from 'recharts';
import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import type { ProjectStatus } from '@/entities';
import { StatusIndicator } from '@/features/dashboard/components/StatusIndicator';

type ProjectSummary = {
    id: number;
    name: string;
    status: ProjectStatus;
    environment: string;
    last_heartbeat_at: string | null;
    exceptions_24h: number;
    requests_24h: number;
};

type Props = {
    projects: ProjectSummary[];
    activeCount: number;
    totalCount: number;
    timePeriod?: string;
    /** Last 24 hourly values: distinct projects with traffic per hour (from API). */
    activityData?: { value: number }[];
};

const statusLabel: Record<ProjectStatus, string> = {
    normal: 'Running',
    warning: 'Warning',
    critical: 'Critical',
    unknown: 'Inactive',
};

export function ActiveProjectsCard({
    projects,
    activeCount,
    totalCount,
    timePeriod = '24H',
    activityData: activityDataProp,
}: Props) {
    const activityData = useMemo(() => {
        if (activityDataProp && activityDataProp.length > 0) {
            return activityDataProp;
        }
        return Array.from({ length: 24 }, () => ({ value: 0 }));
    }, [activityDataProp]);
    const inactivePercent =
        totalCount > 0
            ? Math.round(((totalCount - activeCount) / totalCount) * 100)
            : 0;

    return (
        <Card className="flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-muted-foreground text-[11px] font-semibold tracking-widest uppercase">
                    Running Checks
                </CardTitle>
                <span className="text-muted-foreground text-[10px] font-medium tracking-wide uppercase">
                    {timePeriod}
                </span>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold tracking-tight">
                            {activeCount}
                        </span>
                        <span className="text-muted-foreground text-xs">
                            Apps Running
                        </span>
                    </div>
                </div>

                <div className="h-[60px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={activityData} barCategoryGap="15%">
                            <Bar
                                dataKey="value"
                                radius={[2, 2, 0, 0]}
                                fill="#6d8cff"
                                opacity={0.8}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="flex items-center gap-3 text-xs">
                    <div className="flex items-center gap-1.5">
                        <span className="inline-block size-2 rounded-sm bg-[#6d8cff]" />
                        <span className="text-muted-foreground">
                            Active {totalCount > 0 ? `${100 - inactivePercent}%` : '0%'}
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="bg-muted-foreground/40 inline-block size-2 rounded-sm" />
                        <span className="text-muted-foreground">
                            Inactive {inactivePercent}%
                        </span>
                    </div>
                </div>

                {projects.length > 0 && (
                    <div className="space-y-2 pt-1">
                        {projects.slice(0, 5).map((project) => (
                            <div
                                key={project.id}
                                className="flex items-center justify-between"
                            >
                                <div className="flex items-center gap-2.5">
                                    <StatusIndicator
                                        status={project.status}
                                        showLabel={false}
                                    />
                                    <span className="text-sm font-medium">
                                        {project.name}
                                    </span>
                                </div>
                                <Badge
                                    variant="secondary"
                                    className="text-[10px] font-medium"
                                >
                                    {statusLabel[project.status]}
                                </Badge>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

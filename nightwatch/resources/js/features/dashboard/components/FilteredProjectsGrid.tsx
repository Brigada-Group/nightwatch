import { memo } from 'react';
import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import type { ProjectStatus } from '@/entities';
import type { ProjectSummary } from '@/features/dashboard/api/dashboardService';
import { StatusIndicator } from '@/features/dashboard/components/StatusIndicator';

type Props = {
    projects: ProjectSummary[];
};

const statusLabel: Record<ProjectStatus, string> = {
    normal: 'Running',
    warning: 'Warning',
    critical: 'Critical',
    unknown: 'Inactive',
};

function formatRelativeTime(iso: string | null): string {
    if (!iso) {
return 'never';
}

    const then = new Date(iso).getTime();

    if (Number.isNaN(then)) {
return 'never';
}

    const diffSec = Math.max(0, Math.round((Date.now() - then) / 1000));

    if (diffSec < 60) {
return `${diffSec}s ago`;
}

    const diffMin = Math.round(diffSec / 60);

    if (diffMin < 60) {
return `${diffMin}m ago`;
}

    const diffHr = Math.round(diffMin / 60);

    if (diffHr < 24) {
return `${diffHr}h ago`;
}

    const diffDay = Math.round(diffHr / 24);

    return `${diffDay}d ago`;
}

function ProjectCard({ project }: { project: ProjectSummary }) {
    const status = project.status as ProjectStatus;

    return (
        <Card className="flex flex-col">
            <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div className="flex items-center gap-2 min-w-0">
                    <StatusIndicator status={status} showLabel={false} />
                    <CardTitle className="text-sm font-semibold truncate">
                        {project.name}
                    </CardTitle>
                </div>
                <Badge
                    variant="secondary"
                    className="text-[10px] font-medium shrink-0"
                >
                    {statusLabel[status] ?? status}
                </Badge>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
                <div className="text-muted-foreground text-[10px] tracking-wide uppercase">
                    {project.environment}
                </div>
                <div className="grid grid-cols-3 gap-2">
                    <Metric label="Errors" value={project.exceptions_24h} tone="error" />
                    <Metric label="Requests" value={project.requests_24h} />
                    <Metric label="Logs" value={project.logs_24h ?? 0} />
                </div>
                <div className="text-muted-foreground text-xs">
                    Last heartbeat: {formatRelativeTime(project.last_heartbeat_at)}
                </div>
            </CardContent>
        </Card>
    );
}

function Metric({
    label,
    value,
    tone,
}: {
    label: string;
    value: number;
    tone?: 'error';
}) {
    return (
        <div>
            <div
                className={
                    tone === 'error' && value > 0
                        ? 'text-lg font-bold text-red-500'
                        : 'text-lg font-bold'
                }
            >
                {value}
            </div>
            <div className="text-muted-foreground text-[10px] tracking-wide uppercase">
                {label}
            </div>
        </div>
    );
}

function FilteredProjectsGridImpl({ projects }: Props) {
    if (projects.length === 0) {
        return (
            <Card className="flex flex-col">
                <CardContent className="flex flex-col items-center justify-center gap-2 py-12">
                    <div className="text-sm font-medium">
                        No projects match your filters
                    </div>
                    <div className="text-muted-foreground text-xs">
                        Try adjusting the search term or removing filters.
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
                <ProjectCard key={project.id} project={project} />
            ))}
        </div>
    );
}

export const FilteredProjectsGrid = memo(FilteredProjectsGridImpl);

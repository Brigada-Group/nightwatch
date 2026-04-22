import { Head, router, usePage } from '@inertiajs/react';
import { InertiaPagination } from '@/components/monitoring/inertia-pagination';
import { ProjectFilter } from '@/components/monitoring/project-filter';
import { ResourcePageHeader } from '@/components/monitoring/resource-page-header';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import type { HubHealthCheck, PaginatedResponse } from '@/entities';
import type { ProjectOption, WithProjectRelation } from '@/types/monitoring';

type Filters = {
    project_id: number | null;
    status: string | null;
};

type PageProps = {
    healthChecks: PaginatedResponse<WithProjectRelation<HubHealthCheck>>;
    filters: Filters;
    projectOptions: ProjectOption[];
};

const STATUSES = ['ok', 'warning', 'critical', 'error'] as const;

export default function HealthChecksIndex() {
    const { healthChecks, filters, projectOptions } = usePage<PageProps>().props;

    const filterPayload = {
        project_id: filters.project_id ?? undefined,
        status: filters.status ?? undefined,
        per_page: healthChecks.per_page,
    };

    return (
        <>
            <Head title="Health Checks" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <ResourcePageHeader
                    title="Health Checks"
                    description="Health probe results from monitored applications"
                    toolbar={
                        <>
                            <ProjectFilter
                                path="/health-checks"
                                value={filters.project_id}
                                options={projectOptions}
                                filters={filterPayload}
                            />
                            <div className="flex flex-col gap-1.5">
                                <Label className="text-muted-foreground text-xs">
                                    Status
                                </Label>
                                <Select
                                    value={filters.status ?? 'all'}
                                    onValueChange={(v) => {
                                        router.get(
                                            '/health-checks',
                                            {
                                                ...filterPayload,
                                                status:
                                                    v === 'all'
                                                        ? undefined
                                                        : v,
                                                page: 1,
                                            },
                                            {
                                                preserveScroll: true,
                                                replace: true,
                                            },
                                        );
                                    }}
                                >
                                    <SelectTrigger className="w-[160px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Any</SelectItem>
                                        {STATUSES.map((s) => (
                                            <SelectItem key={s} value={s}>
                                                {s}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </>
                    }
                />
                <Card>
                    <CardContent className="p-0 pt-4">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Check</TableHead>
                                    <TableHead>Message</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Project</TableHead>
                                    <TableHead className="text-right">
                                        Sent
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {healthChecks.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={5}
                                            className="text-muted-foreground py-10 text-center text-sm"
                                        >
                                            No health check events.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    healthChecks.data.map((row) => (
                                        <TableRow key={row.id}>
                                            <TableCell className="font-mono text-xs">
                                                {row.check_name}
                                            </TableCell>
                                            <TableCell className="max-w-md truncate text-xs">
                                                {row.message ?? '—'}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={
                                                        row.status === 'ok'
                                                            ? 'outline'
                                                            : 'destructive'
                                                    }
                                                >
                                                    {row.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {row.project?.name ??
                                                    `#${row.project_id}`}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-right text-xs">
                                                {new Date(
                                                    row.sent_at,
                                                ).toLocaleString()}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                        <div className="border-border border-t p-4">
                            <InertiaPagination
                                path="/health-checks"
                                meta={healthChecks}
                                filters={filterPayload}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

HealthChecksIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Health Checks', href: '/health-checks' },
    ],
};

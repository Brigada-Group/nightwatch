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
import type { HubLog, PaginatedResponse } from '@/entities';
import type { ProjectOption, WithProjectRelation } from '@/types/monitoring';

type Filters = {
    project_id: number | null;
    level: string | null;
};

type PageProps = {
    logs: PaginatedResponse<WithProjectRelation<HubLog>>;
    filters: Filters;
    projectOptions: ProjectOption[];
};

const LEVELS = [
    'emergency',
    'alert',
    'critical',
    'error',
    'warning',
    'notice',
    'info',
    'debug',
];

export default function LogsIndex() {
    const { logs, filters, projectOptions } = usePage<PageProps>().props;

    const filterPayload = {
        project_id: filters.project_id ?? undefined,
        level: filters.level ?? undefined,
        per_page: logs.per_page,
    };

    return (
        <>
            <Head title="Logs" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <ResourcePageHeader
                    title="Logs"
                    description="Application log lines ingested from monitored projects"
                    toolbar={
                        <>
                            <ProjectFilter
                                path="/logs"
                                value={filters.project_id}
                                options={projectOptions}
                                filters={filterPayload}
                            />
                            <div className="flex flex-col gap-1.5">
                                <Label className="text-muted-foreground text-xs">
                                    Level
                                </Label>
                                <Select
                                    value={filters.level ?? 'all'}
                                    onValueChange={(v) => {
                                        router.get(
                                            '/logs',
                                            {
                                                ...filterPayload,
                                                level:
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
                                        <SelectItem value="all">
                                            Any level
                                        </SelectItem>
                                        {LEVELS.map((l) => (
                                            <SelectItem key={l} value={l}>
                                                {l}
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
                                    <TableHead>Level</TableHead>
                                    <TableHead>Message</TableHead>
                                    <TableHead>Channel</TableHead>
                                    <TableHead>Project</TableHead>
                                    <TableHead className="text-right">
                                        Sent
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {logs.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={5}
                                            className="text-muted-foreground py-10 text-center text-sm"
                                        >
                                            No logs recorded.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    logs.data.map((row) => (
                                        <TableRow key={row.id}>
                                            <TableCell>
                                                <Badge variant="outline">
                                                    {row.level}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="max-w-md truncate text-sm">
                                                {row.message}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-xs">
                                                {row.channel ?? '—'}
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
                                path="/logs"
                                meta={logs}
                                filters={filterPayload}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

LogsIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Logs', href: '/logs' },
    ],
};

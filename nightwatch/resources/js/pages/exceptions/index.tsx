import { Head, Link, router, usePage } from '@inertiajs/react';
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
import type { HubException, PaginatedResponse } from '@/entities';
import type { ProjectOption, WithProjectRelation } from '@/types/monitoring';
import { AssigneeCell } from '@/features/exceptions/components/AssigneeCell';
import { RecurrenceBadge } from '@/features/exceptions/components/RecurrenceBadge';

type Filters = {
    project_id: number | null;
    severity: string | null;
};

type PageProps = {
    exceptions: PaginatedResponse<WithProjectRelation<HubException>>;
    filters: Filters;
    projectOptions: ProjectOption[];
};

const SEVERITIES = ['error', 'critical', 'warning', 'info', 'debug'] as const;

export default function ExceptionsIndex() {
    const { exceptions, filters, projectOptions } = usePage<PageProps>().props;

    const filterPayload = {
        project_id: filters.project_id ?? undefined,
        severity: filters.severity ?? undefined,
        per_page: exceptions.per_page,
    };

    return (
        <>
            <Head title="Exceptions" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <ResourcePageHeader
                    title="Exceptions"
                    description="Errors and warnings captured from monitored applications"
                    toolbar={
                        <>
                            <ProjectFilter
                                path="/exceptions"
                                value={filters.project_id}
                                options={projectOptions}
                                filters={filterPayload}
                            />
                            <div className="flex flex-col gap-1.5">
                                <Label className="text-muted-foreground text-xs">
                                    Severity
                                </Label>
                                <Select
                                    value={filters.severity ?? 'all'}
                                    onValueChange={(v) => {
                                        router.get(
                                            '/exceptions',
                                            {
                                                ...filterPayload,
                                                severity:
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
                                        <SelectValue placeholder="Any severity" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            Any severity
                                        </SelectItem>
                                        {SEVERITIES.map((s) => (
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
                                    <TableHead>Exception</TableHead>
                                    <TableHead>Project</TableHead>
                                    <TableHead>Severity</TableHead>
                                    <TableHead>Assignee</TableHead>
                                    <TableHead className="text-right">
                                        Sent
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {exceptions.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={5}
                                            className="text-muted-foreground py-10 text-center text-sm"
                                        >
                                            No exceptions in this range.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    exceptions.data.map((row) => (
                                        <TableRow key={row.id}>
                                            <TableCell>
                                                <Link
                                                    href={`/exceptions/${row.id}`}
                                                    className="block max-w-md hover:underline"
                                                >
                                                    <p className="flex items-center gap-2 truncate font-mono text-xs font-medium">
                                                        <span className="truncate">
                                                            {row.exception_class}
                                                        </span>
                                                        {row.is_recurrence ? (
                                                            <RecurrenceBadge />
                                                        ) : null}
                                                    </p>
                                                    <p className="text-muted-foreground truncate text-xs">
                                                        {row.message}
                                                    </p>
                                                </Link>
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {row.project?.name ?? `#${row.project_id}`}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">
                                                    {row.severity}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <AssigneeCell
                                                    exceptionId={row.id}
                                                    assignee={row.assignee}
                                                />
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
                                path="/exceptions"
                                meta={exceptions}
                                filters={filterPayload}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

ExceptionsIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Exceptions', href: '/exceptions' },
    ],
};

import { Head, Link, router, usePage } from '@inertiajs/react';
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
import { InertiaPagination } from '@/components/monitoring/inertia-pagination';
import { ProjectFilter } from '@/components/monitoring/project-filter';
import { ResourcePageHeader } from '@/components/monitoring/resource-page-header';
import type { ClientErrorEvent, PaginatedResponse } from '@/entities';
import type { ProjectOption, WithProjectRelation } from '@/types/monitoring';

type Filters = {
    project_id: number | null;
    severity: string | null;
    runtime: string | null;
};

type PageProps = {
    clientErrors: PaginatedResponse<WithProjectRelation<ClientErrorEvent>>;
    filters: Filters;
    projectOptions: ProjectOption[];
};

const SEVERITIES = ['critical', 'error', 'warning', 'info', 'debug'] as const;
const RUNTIMES = ['javascript', 'typescript'] as const;

export default function ClientErrorsIndex() {
    const { clientErrors, filters, projectOptions } = usePage<PageProps>().props;

    const filterPayload = {
        project_id: filters.project_id ?? undefined,
        severity: filters.severity ?? undefined,
        runtime: filters.runtime ?? undefined,
        per_page: clientErrors.per_page,
    };

    return (
        <>
            <Head title="Client Errors" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <ResourcePageHeader
                    title="Client Errors"
                    description="Browser-side errors, exceptions, and diagnostics reported by Guardian."
                    toolbar={
                        <>
                            <ProjectFilter
                                path="/client-errors"
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
                                    onValueChange={(value) => {
                                        router.get(
                                            '/client-errors',
                                            {
                                                ...filterPayload,
                                                severity: value === 'all' ? undefined : value,
                                                page: 1,
                                            },
                                            {
                                                preserveScroll: true,
                                                replace: true,
                                            },
                                        );
                                    }}
                                >
                                    <SelectTrigger className="w-[150px]">
                                        <SelectValue placeholder="Any severity" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Any severity</SelectItem>
                                        {SEVERITIES.map((severity) => (
                                            <SelectItem key={severity} value={severity}>
                                                {severity}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <Label className="text-muted-foreground text-xs">
                                    Runtime
                                </Label>
                                <Select
                                    value={filters.runtime ?? 'all'}
                                    onValueChange={(value) => {
                                        router.get(
                                            '/client-errors',
                                            {
                                                ...filterPayload,
                                                runtime: value === 'all' ? undefined : value,
                                                page: 1,
                                            },
                                            {
                                                preserveScroll: true,
                                                replace: true,
                                            },
                                        );
                                    }}
                                >
                                    <SelectTrigger className="w-[150px]">
                                        <SelectValue placeholder="Any runtime" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Any runtime</SelectItem>
                                        {RUNTIMES.map((runtime) => (
                                            <SelectItem key={runtime} value={runtime}>
                                                {runtime}
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
                                    <TableHead>Error</TableHead>
                                    <TableHead>Location</TableHead>
                                    <TableHead>Project</TableHead>
                                    <TableHead>Runtime</TableHead>
                                    <TableHead>Severity</TableHead>
                                    <TableHead className="text-right">Occurred</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {clientErrors.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={6}
                                            className="text-muted-foreground py-10 text-center text-sm"
                                        >
                                            No client-side errors recorded yet.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    clientErrors.data.map((row) => (
                                        <TableRow key={row.id}>
                                            <TableCell>
                                                <div className="max-w-md space-y-1">
                                                    <Link
                                                        href={`/client-errors/${row.id}`}
                                                        className="truncate font-mono text-xs underline-offset-2 hover:underline"
                                                    >
                                                        {row.exception_class}
                                                    </Link>
                                                    <p className="text-muted-foreground line-clamp-2 text-xs">
                                                        {row.message}
                                                    </p>
                                                    {row.request_url ? (
                                                        <p className="text-muted-foreground truncate font-mono text-[11px]">
                                                            {row.request_url}
                                                        </p>
                                                    ) : null}
                                                </div>
                                            </TableCell>
                                            <TableCell className="max-w-[280px]">
                                                <p className="truncate font-mono text-xs">
                                                    {row.source_file ?? '—'}
                                                </p>
                                                <p className="text-muted-foreground text-xs">
                                                    line {row.line}
                                                    {row.colno != null ? `, col ${row.colno}` : ''}
                                                </p>
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {row.project?.name ?? row.project_id}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{row.runtime}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{row.severity}</Badge>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-right text-xs">
                                                {new Date(row.occurred_at).toLocaleString()}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                        <div className="border-border border-t p-4">
                            <InertiaPagination
                                path="/client-errors"
                                meta={clientErrors}
                                filters={filterPayload}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

ClientErrorsIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Client Errors', href: '/client-errors' },
    ],
};

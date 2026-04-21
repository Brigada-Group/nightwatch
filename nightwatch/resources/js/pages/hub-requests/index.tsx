import { Head, router, usePage } from '@inertiajs/react';
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
import type { HubRequest, PaginatedResponse } from '@/entities';
import type { ProjectOption, WithProjectRelation } from '@/types/monitoring';

type Filters = {
    project_id: number | null;
    status_code: number | null;
};

type PageProps = {
    requests: PaginatedResponse<WithProjectRelation<HubRequest>>;
    filters: Filters;
    projectOptions: ProjectOption[];
};

const STATUS_CODES = [200, 201, 204, 301, 302, 400, 401, 403, 404, 422, 500, 503];

export default function HubRequestsIndex() {
    const { requests, filters, projectOptions } = usePage<PageProps>().props;

    const filterPayload = {
        project_id: filters.project_id ?? undefined,
        status_code: filters.status_code ?? undefined,
        per_page: requests.per_page,
    };

    return (
        <>
            <Head title="Requests" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <ResourcePageHeader
                    title="Requests"
                    description="HTTP requests reported by your monitored applications"
                    toolbar={
                        <>
                            <ProjectFilter
                                path="/hub-requests"
                                value={filters.project_id}
                                options={projectOptions}
                                filters={filterPayload}
                            />
                            <div className="flex flex-col gap-1.5">
                                <Label className="text-muted-foreground text-xs">
                                    Status code
                                </Label>
                                <Select
                                    value={
                                        filters.status_code != null
                                            ? String(filters.status_code)
                                            : 'all'
                                    }
                                    onValueChange={(v) => {
                                        router.get(
                                            '/hub-requests',
                                            {
                                                ...filterPayload,
                                                status_code:
                                                    v === 'all'
                                                        ? undefined
                                                        : Number(v),
                                                page: 1,
                                            },
                                            {
                                                preserveScroll: true,
                                                replace: true,
                                            },
                                        );
                                    }}
                                >
                                    <SelectTrigger className="w-[140px]">
                                        <SelectValue placeholder="Any code" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            Any code
                                        </SelectItem>
                                        {STATUS_CODES.map((c) => (
                                            <SelectItem
                                                key={c}
                                                value={String(c)}
                                            >
                                                {c}
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
                                    <TableHead>Method</TableHead>
                                    <TableHead>URI</TableHead>
                                    <TableHead>Code</TableHead>
                                    <TableHead className="text-right">
                                        ms
                                    </TableHead>
                                    <TableHead>Project</TableHead>
                                    <TableHead className="text-right">
                                        Sent
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {requests.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={6}
                                            className="text-muted-foreground py-10 text-center text-sm"
                                        >
                                            No requests recorded.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    requests.data.map((row) => (
                                        <TableRow key={row.id}>
                                            <TableCell className="font-mono text-xs">
                                                {row.method}
                                            </TableCell>
                                            <TableCell className="max-w-md truncate text-xs">
                                                {row.uri}
                                            </TableCell>
                                            <TableCell className="font-mono text-xs">
                                                {row.status_code}
                                            </TableCell>
                                            <TableCell className="text-right text-xs">
                                                {row.duration_ms.toFixed(1)}
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
                                path="/hub-requests"
                                meta={requests}
                                filters={filterPayload}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

HubRequestsIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Requests', href: '/hub-requests' },
    ],
};

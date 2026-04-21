import { Head, usePage } from '@inertiajs/react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
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
import type { HubOutgoingHttp, PaginatedResponse } from '@/entities';
import type { ProjectOption, WithProjectRelation } from '@/types/monitoring';

type Filters = {
    project_id: number | null;
};

type PageProps = {
    outgoingHttp: PaginatedResponse<WithProjectRelation<HubOutgoingHttp>>;
    filters: Filters;
    projectOptions: ProjectOption[];
};

export default function OutgoingHttpIndex() {
    const { outgoingHttp, filters, projectOptions } = usePage<PageProps>().props;

    const filterPayload = {
        project_id: filters.project_id ?? undefined,
        per_page: outgoingHttp.per_page,
    };

    return (
        <>
            <Head title="Outgoing HTTP" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <ResourcePageHeader
                    title="Outgoing HTTP"
                    description="Outbound HTTP calls made by monitored applications"
                    toolbar={
                        <ProjectFilter
                            path="/outgoing-http"
                            value={filters.project_id}
                            options={projectOptions}
                            filters={filterPayload}
                        />
                    }
                />
                <Card>
                    <CardContent className="p-0 pt-4">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Method</TableHead>
                                    <TableHead>URL</TableHead>
                                    <TableHead>Code</TableHead>
                                    <TableHead>Failed</TableHead>
                                    <TableHead>Project</TableHead>
                                    <TableHead className="text-right">
                                        Sent
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {outgoingHttp.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={6}
                                            className="text-muted-foreground py-10 text-center text-sm"
                                        >
                                            No outgoing HTTP events.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    outgoingHttp.data.map((row) => (
                                        <TableRow key={row.id}>
                                            <TableCell className="font-mono text-xs">
                                                {row.method}
                                            </TableCell>
                                            <TableCell className="max-w-md truncate text-xs">
                                                {row.url}
                                            </TableCell>
                                            <TableCell className="font-mono text-xs">
                                                {row.status_code ?? '—'}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={
                                                        row.failed
                                                            ? 'destructive'
                                                            : 'outline'
                                                    }
                                                >
                                                    {row.failed ? 'yes' : 'no'}
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
                                path="/outgoing-http"
                                meta={outgoingHttp}
                                filters={filterPayload}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

OutgoingHttpIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Outgoing HTTP', href: '/outgoing-http' },
    ],
};

import { Head, router, usePage } from '@inertiajs/react';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
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
import type { HubQuery, PaginatedResponse } from '@/entities';
import type { ProjectOption, WithProjectRelation } from '@/types/monitoring';

type Filters = {
    project_id: number | null;
    slow_only: boolean;
};

type PageProps = {
    queries: PaginatedResponse<WithProjectRelation<HubQuery>>;
    filters: Filters;
    projectOptions: ProjectOption[];
};

export default function QueriesIndex() {
    const { queries, filters, projectOptions } = usePage<PageProps>().props;

    const filterPayload = {
        project_id: filters.project_id ?? undefined,
        slow_only: filters.slow_only ? 1 : undefined,
        per_page: queries.per_page,
    };

    return (
        <>
            <Head title="Queries" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <ResourcePageHeader
                    title="Queries"
                    description="Database queries captured from monitored applications"
                    toolbar={
                        <>
                            <ProjectFilter
                                path="/queries"
                                value={filters.project_id}
                                options={projectOptions}
                                filters={filterPayload}
                            />
                            <div className="flex items-center gap-2 pt-6">
                                <Checkbox
                                    id="slow_only"
                                    checked={filters.slow_only}
                                    onCheckedChange={(checked) => {
                                        router.get(
                                            '/queries',
                                            {
                                                ...filterPayload,
                                                slow_only: checked
                                                    ? 1
                                                    : undefined,
                                                page: 1,
                                            },
                                            {
                                                preserveScroll: true,
                                                replace: true,
                                            },
                                        );
                                    }}
                                />
                                <Label
                                    htmlFor="slow_only"
                                    className="text-muted-foreground text-sm"
                                >
                                    Slow queries only
                                </Label>
                            </div>
                        </>
                    }
                />
                <Card>
                    <CardContent className="p-0 pt-4">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>SQL</TableHead>
                                    <TableHead className="text-right">
                                        ms
                                    </TableHead>
                                    <TableHead>Flags</TableHead>
                                    <TableHead>Project</TableHead>
                                    <TableHead className="text-right">
                                        Sent
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {queries.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={5}
                                            className="text-muted-foreground py-10 text-center text-sm"
                                        >
                                            No queries recorded.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    queries.data.map((row) => (
                                        <TableRow key={row.id}>
                                            <TableCell className="max-w-lg truncate font-mono text-xs">
                                                {row.sql}
                                            </TableCell>
                                            <TableCell className="text-right text-xs">
                                                {row.duration_ms.toFixed(2)}
                                            </TableCell>
                                            <TableCell className="text-xs">
                                                {row.is_slow ? 'slow ' : ''}
                                                {row.is_n_plus_one ? 'n+1' : '—'}
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
                                path="/queries"
                                meta={queries}
                                filters={filterPayload}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

QueriesIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Queries', href: '/queries' },
    ],
};

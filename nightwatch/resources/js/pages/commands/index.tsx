import { Head, usePage } from '@inertiajs/react';
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
import type { HubCommand, PaginatedResponse } from '@/entities';
import type { ProjectOption, WithProjectRelation } from '@/types/monitoring';

type Filters = {
    project_id: number | null;
};

type PageProps = {
    commands: PaginatedResponse<WithProjectRelation<HubCommand>>;
    filters: Filters;
    projectOptions: ProjectOption[];
};

export default function CommandsIndex() {
    const { commands, filters, projectOptions } = usePage<PageProps>().props;

    const filterPayload = {
        project_id: filters.project_id ?? undefined,
        per_page: commands.per_page,
    };

    return (
        <>
            <Head title="Commands" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <ResourcePageHeader
                    title="Commands"
                    description="Artisan commands executed on monitored instances"
                    toolbar={
                        <ProjectFilter
                            path="/commands"
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
                                    <TableHead>Command</TableHead>
                                    <TableHead className="text-right">
                                        Exit
                                    </TableHead>
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
                                {commands.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={5}
                                            className="text-muted-foreground py-10 text-center text-sm"
                                        >
                                            No command events.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    commands.data.map((row) => (
                                        <TableRow key={row.id}>
                                            <TableCell className="max-w-lg truncate font-mono text-xs">
                                                {row.command}
                                            </TableCell>
                                            <TableCell className="text-right font-mono text-xs">
                                                {row.exit_code ?? '—'}
                                            </TableCell>
                                            <TableCell className="text-right text-xs">
                                                {row.duration_ms != null
                                                    ? row.duration_ms.toFixed(
                                                          0,
                                                      )
                                                    : '—'}
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
                                path="/commands"
                                meta={commands}
                                filters={filterPayload}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

CommandsIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Commands', href: '/commands' },
    ],
};

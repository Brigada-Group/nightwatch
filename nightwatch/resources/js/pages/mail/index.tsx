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
import type { HubMail, PaginatedResponse } from '@/entities';
import type { ProjectOption, WithProjectRelation } from '@/types/monitoring';

type Filters = {
    project_id: number | null;
    status: string | null;
};

type PageProps = {
    mail: PaginatedResponse<WithProjectRelation<HubMail>>;
    filters: Filters;
    projectOptions: ProjectOption[];
};

export default function MailIndex() {
    const { mail, filters, projectOptions } = usePage<PageProps>().props;

    const filterPayload = {
        project_id: filters.project_id ?? undefined,
        status: filters.status ?? undefined, 
        per_page: mail.per_page,
    };

    return (
        <>
            <Head title="Mail" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <ResourcePageHeader
                    title="Mail"
                    description="Outbound mail events reported by monitored applications"
                    toolbar={
                        <>
                            <ProjectFilter
                                path="/mail"
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
                                            '/mail',
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
                                    <SelectTrigger className="w-[140px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Any</SelectItem>
                                        <SelectItem value="sent">
                                            sent
                                        </SelectItem>
                                        <SelectItem value="failed">
                                            failed
                                        </SelectItem>
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
                                    <TableHead>Mailable</TableHead>
                                    <TableHead>Subject</TableHead>
                                    <TableHead>To</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Project</TableHead>
                                    <TableHead className="text-right">
                                        Sent
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {mail.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={6}
                                            className="text-muted-foreground py-10 text-center text-sm"
                                        >
                                            No mail events.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    mail.data.map((row) => (
                                        <TableRow key={row.id}>
                                            <TableCell className="max-w-xs truncate font-mono text-xs">
                                                {row.mailable ?? '—'}
                                            </TableCell>
                                            <TableCell className="max-w-xs truncate text-sm">
                                                {row.subject ?? '—'}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground truncate text-xs">
                                                {row.to ?? '—'}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={
                                                        row.status === 'failed'
                                                            ? 'destructive'
                                                            : 'outline'
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
                                path="/mail"
                                meta={mail}
                                filters={filterPayload}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

MailIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Mail', href: '/mail' },
    ],
};

import { Head, Link, router, usePage } from '@inertiajs/react';
import { ChevronRight } from 'lucide-react';
import { InertiaPagination } from '@/components/monitoring/inertia-pagination';
import { ProjectFilter } from '@/components/monitoring/project-filter';
import { ResourcePageHeader } from '@/components/monitoring/resource-page-header';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type {
    HubComposerAudit,
    HubNpmAudit,
    PaginatedResponse,
} from '@/entities';
import type { ProjectOption, WithProjectRelation } from '@/types/monitoring';

type Filters = {
    project_id: number | null;
    tab: 'composer' | 'npm';
};

type PageProps = {
    composerAudits: PaginatedResponse<WithProjectRelation<HubComposerAudit>>;
    npmAudits: PaginatedResponse<WithProjectRelation<HubNpmAudit>>;
    filters: Filters;
    projectOptions: ProjectOption[];
};

function SeverityChip({ label, count }: { label: string; count: number }) {
    if (count === 0) {
        return (
            <span className="text-muted-foreground text-xs">
                {label}: 0
            </span>
        );
    }

    const tone: Record<string, string> = {
        critical: 'bg-red-500/15 text-red-600 dark:text-red-400',
        high: 'bg-orange-500/15 text-orange-600 dark:text-orange-400',
        moderate: 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400',
        low: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
        info: 'bg-slate-500/15 text-slate-600 dark:text-slate-400',
    };

    return (
        <span
            className={`rounded-md px-1.5 py-0.5 text-xs font-medium ${tone[label] ?? ''}`}
        >
            {label}: {count}
        </span>
    );
}

export default function AuditsIndex() {
    const { composerAudits, npmAudits, filters, projectOptions } =
        usePage<PageProps>().props;

    const filterPayload = {
        project_id: filters.project_id ?? undefined,
        tab: filters.tab,
        per_page: composerAudits.per_page,
    };

    const onTabChange = (tab: string) => {
        router.get(
            '/audits',
            { ...filterPayload, tab },
            { preserveScroll: true, replace: true },
        );
    };

    return (
        <>
            <Head title="Audits" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <ResourcePageHeader
                    title="Audits"
                    description="Composer and npm vulnerability audits ingested from monitored projects"
                    toolbar={
                        <ProjectFilter
                            path="/audits"
                            value={filters.project_id}
                            options={projectOptions}
                            filters={filterPayload}
                        />
                    }
                />

                <Tabs value={filters.tab} onValueChange={onTabChange}>
                    <TabsList>
                        <TabsTrigger value="composer">
                            Composer ({composerAudits.total})
                        </TabsTrigger>
                        <TabsTrigger value="npm">
                            npm ({npmAudits.total})
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="composer">
                        <Card>
                            <CardContent className="p-0 pt-4">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Project</TableHead>
                                            <TableHead>Environment</TableHead>
                                            <TableHead>Advisories</TableHead>
                                            <TableHead>Abandoned</TableHead>
                                            <TableHead className="text-right">
                                                Sent
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {composerAudits.data.length === 0 ? (
                                            <TableRow>
                                                <TableCell
                                                    colSpan={5}
                                                    className="text-muted-foreground py-10 text-center text-sm"
                                                >
                                                    No composer audits
                                                    recorded.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            composerAudits.data.map((row) => (
                                                <TableRow
                                                    key={row.id}
                                                    onClick={() =>
                                                        router.visit(
                                                            `/audits/composer/${row.id}`,
                                                        )
                                                    }
                                                    className="group cursor-pointer"
                                                >
                                                    <TableCell className="text-sm">
                                                        <Link
                                                            href={`/audits/composer/${row.id}`}
                                                            className="hover:text-violet-300 hover:underline"
                                                            onClick={(e) =>
                                                                e.stopPropagation()
                                                            }
                                                        >
                                                            {row.project
                                                                ?.name ??
                                                                `#${row.project_id}`}
                                                        </Link>
                                                    </TableCell>
                                                    <TableCell className="text-muted-foreground text-xs">
                                                        {row.environment}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge
                                                            variant={
                                                                row.advisories_count >
                                                                0
                                                                    ? 'destructive'
                                                                    : 'outline'
                                                            }
                                                        >
                                                            {
                                                                row.advisories_count
                                                            }
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline">
                                                            {
                                                                row.abandoned_count
                                                            }
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-muted-foreground text-right text-xs">
                                                        <div className="inline-flex items-center gap-1.5">
                                                            {new Date(
                                                                row.sent_at,
                                                            ).toLocaleString()}
                                                            <ChevronRight className="size-3.5 text-zinc-600 opacity-0 transition-opacity group-hover:opacity-100" />
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                                <div className="border-border border-t p-4">
                                    <InertiaPagination
                                        path="/audits"
                                        meta={composerAudits}
                                        filters={{
                                            ...filterPayload,
                                            tab: 'composer',
                                        }}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="npm">
                        <Card>
                            <CardContent className="p-0 pt-4">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Project</TableHead>
                                            <TableHead>Environment</TableHead>
                                            <TableHead>Total</TableHead>
                                            <TableHead>Breakdown</TableHead>
                                            <TableHead className="text-right">
                                                Sent
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {npmAudits.data.length === 0 ? (
                                            <TableRow>
                                                <TableCell
                                                    colSpan={5}
                                                    className="text-muted-foreground py-10 text-center text-sm"
                                                >
                                                    No npm audits recorded.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            npmAudits.data.map((row) => (
                                                <TableRow
                                                    key={row.id}
                                                    onClick={() =>
                                                        router.visit(
                                                            `/audits/npm/${row.id}`,
                                                        )
                                                    }
                                                    className="group cursor-pointer"
                                                >
                                                    <TableCell className="text-sm">
                                                        <Link
                                                            href={`/audits/npm/${row.id}`}
                                                            className="hover:text-violet-300 hover:underline"
                                                            onClick={(e) =>
                                                                e.stopPropagation()
                                                            }
                                                        >
                                                            {row.project
                                                                ?.name ??
                                                                `#${row.project_id}`}
                                                        </Link>
                                                    </TableCell>
                                                    <TableCell className="text-muted-foreground text-xs">
                                                        {row.environment}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge
                                                            variant={
                                                                row.total_vulnerabilities >
                                                                0
                                                                    ? 'destructive'
                                                                    : 'outline'
                                                            }
                                                        >
                                                            {
                                                                row.total_vulnerabilities
                                                            }
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-wrap gap-1.5">
                                                            <SeverityChip
                                                                label="critical"
                                                                count={
                                                                    row.critical_count
                                                                }
                                                            />
                                                            <SeverityChip
                                                                label="high"
                                                                count={
                                                                    row.high_count
                                                                }
                                                            />
                                                            <SeverityChip
                                                                label="moderate"
                                                                count={
                                                                    row.moderate_count
                                                                }
                                                            />
                                                            <SeverityChip
                                                                label="low"
                                                                count={
                                                                    row.low_count
                                                                }
                                                            />
                                                            <SeverityChip
                                                                label="info"
                                                                count={
                                                                    row.info_count
                                                                }
                                                            />
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-muted-foreground text-right text-xs">
                                                        <div className="inline-flex items-center gap-1.5">
                                                            {new Date(
                                                                row.sent_at,
                                                            ).toLocaleString()}
                                                            <ChevronRight className="size-3.5 text-zinc-600 opacity-0 transition-opacity group-hover:opacity-100" />
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                                <div className="border-border border-t p-4">
                                    <InertiaPagination
                                        path="/audits"
                                        meta={npmAudits}
                                        filters={{
                                            ...filterPayload,
                                            tab: 'npm',
                                        }}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </>
    );
}

AuditsIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Audits', href: '/audits' },
    ],
};

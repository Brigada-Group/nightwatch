import { Head, router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { InertiaPagination } from '@/components/monitoring/inertia-pagination';
import { ProjectFilter } from '@/components/monitoring/project-filter';
import { ResourcePageHeader } from '@/components/monitoring/resource-page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import type { HubCache, PaginatedResponse } from '@/entities';
import type { ProjectOption, WithProjectRelation } from '@/types/monitoring';

type Filters = {
    project_id: number | null;
    store: string | null;
};

type PageProps = {
    cache: PaginatedResponse<WithProjectRelation<HubCache>>;
    filters: Filters;
    projectOptions: ProjectOption[];
};

export default function CacheIndex() {
    const { cache, filters, projectOptions } = usePage<PageProps>().props;
    const [storeDraft, setStoreDraft] = useState(filters.store ?? '');

    useEffect(() => {
        setStoreDraft(filters.store ?? '');
    }, [filters.store]);

    const filterPayload = {
        project_id: filters.project_id ?? undefined,
        store: filters.store ?? undefined,
        per_page: cache.per_page,
    };

    const applyStore = () => {
        router.get(
            '/cache',
            {
                ...filterPayload,
                store: storeDraft.trim() || undefined,
                page: 1,
            },
            { preserveScroll: true, replace: true },
        );
    };

    return (
        <>
            <Head title="Cache" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <ResourcePageHeader
                    title="Cache"
                    description="Cache store statistics reported by monitored applications"
                    toolbar={
                        <>
                            <ProjectFilter
                                path="/cache"
                                value={filters.project_id}
                                options={projectOptions}
                                filters={filterPayload}
                            />
                            <div className="flex flex-col gap-1.5">
                                <Label className="text-muted-foreground text-xs">
                                    Store name
                                </Label>
                                <div className="flex gap-2">
                                    <Input
                                        className="w-[180px]"
                                        placeholder="e.g. redis"
                                        value={storeDraft}
                                        onChange={(e) =>
                                            setStoreDraft(e.target.value)
                                        }
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                applyStore();
                                            }
                                        }}
                                    />
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        size="sm"
                                        className="mt-auto"
                                        onClick={applyStore}
                                    >
                                        Apply
                                    </Button>
                                </div>
                            </div>
                        </>
                    }
                />
                <Card>
                    <CardContent className="p-0 pt-4">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Store</TableHead>
                                    <TableHead className="text-right">
                                        Hits
                                    </TableHead>
                                    <TableHead className="text-right">
                                        Misses
                                    </TableHead>
                                    <TableHead className="text-right">
                                        Hit rate
                                    </TableHead>
                                    <TableHead>Project</TableHead>
                                    <TableHead className="text-right">
                                        Sent
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {cache.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={6}
                                            className="text-muted-foreground py-10 text-center text-sm"
                                        >
                                            No cache snapshots.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    cache.data.map((row) => (
                                        <TableRow key={row.id}>
                                            <TableCell className="font-mono text-xs">
                                                {row.store}
                                            </TableCell>
                                            <TableCell className="text-right text-xs">
                                                {row.hits}
                                            </TableCell>
                                            <TableCell className="text-right text-xs">
                                                {row.misses}
                                            </TableCell>
                                            <TableCell className="text-right text-xs">
                                                {row.hit_rate != null
                                                    ? `${(row.hit_rate * 100).toFixed(1)}%`
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
                                path="/cache"
                                meta={cache}
                                filters={filterPayload}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

CacheIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Cache', href: '/cache' },
    ],
};

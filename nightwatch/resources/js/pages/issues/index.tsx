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
import { RecurrenceBadge } from '@/features/exceptions/components/RecurrenceBadge';
import { IssueAssigneeCell } from '@/features/issues/components/IssueAssigneeCell';
import { cn } from '@/lib/utils';
import type { ProjectOption } from '@/types/monitoring';

type SourceType = 'slow_query' | 'slow_request';

type IssueRow = {
    id: number;
    project_id: number;
    source_type: SourceType;
    summary: string;
    severity: string;
    is_recurrence: boolean;
    recurrence_count: number;
    task_status: string | null;
    last_seen_at: string | null;
    project: { id: number; name: string } | null;
    assignee: { id: number; name: string; email: string } | null;
};

type Paginated<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
};

type Filters = {
    project_id: number | null;
    source_type: SourceType | null;
    severity: string | null;
    task_status: string | null;
};

type PageProps = {
    issues: Paginated<IssueRow>;
    filters: Filters;
    projectOptions: ProjectOption[];
};

const SEVERITIES = ['error', 'warning', 'info'] as const;
const TASK_STATUSES = [
    { value: 'unassigned', label: 'Unassigned' },
    { value: 'started', label: 'Started' },
    { value: 'ongoing', label: 'Ongoing' },
    { value: 'review', label: 'Review' },
    { value: 'finished', label: 'Finished' },
];

const SOURCE_LABEL: Record<SourceType, string> = {
    slow_query: 'slow query',
    slow_request: 'slow request',
};

const SOURCE_TONE: Record<SourceType, string> = {
    slow_query:
        'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300',
    slow_request:
        'border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-300',
};

export default function IssuesIndex() {
    const { issues, filters, projectOptions } = usePage<PageProps>().props;

    const filterPayload = {
        project_id: filters.project_id ?? undefined,
        source_type: filters.source_type ?? undefined,
        severity: filters.severity ?? undefined,
        task_status: filters.task_status ?? undefined,
        per_page: issues.per_page,
    };

    const updateFilter = (key: keyof Filters, value: string) => {
        router.get(
            '/issues',
            {
                ...filterPayload,
                [key]: value === 'all' ? undefined : value,
                page: 1,
            },
            { preserveScroll: true, replace: true },
        );
    };

    return (
        <>
            <Head title="Issues" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <ResourcePageHeader
                    title="Issues"
                    description="Slow queries and slow requests promoted into trackable, assignable tasks."
                    toolbar={
                        <>
                            <ProjectFilter
                                path="/issues"
                                value={filters.project_id}
                                options={projectOptions}
                                filters={filterPayload}
                            />
                            <div className="flex flex-col gap-1.5">
                                <Label className="text-muted-foreground text-xs">
                                    Type
                                </Label>
                                <Select
                                    value={filters.source_type ?? 'all'}
                                    onValueChange={(v) =>
                                        updateFilter('source_type', v)
                                    }
                                >
                                    <SelectTrigger className="w-[160px]">
                                        <SelectValue placeholder="Any type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            Any type
                                        </SelectItem>
                                        <SelectItem value="slow_query">
                                            Slow query
                                        </SelectItem>
                                        <SelectItem value="slow_request">
                                            Slow request
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <Label className="text-muted-foreground text-xs">
                                    Severity
                                </Label>
                                <Select
                                    value={filters.severity ?? 'all'}
                                    onValueChange={(v) =>
                                        updateFilter('severity', v)
                                    }
                                >
                                    <SelectTrigger className="w-[140px]">
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
                            <div className="flex flex-col gap-1.5">
                                <Label className="text-muted-foreground text-xs">
                                    Status
                                </Label>
                                <Select
                                    value={filters.task_status ?? 'all'}
                                    onValueChange={(v) =>
                                        updateFilter('task_status', v)
                                    }
                                >
                                    <SelectTrigger className="w-[160px]">
                                        <SelectValue placeholder="Any status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            Any status
                                        </SelectItem>
                                        {TASK_STATUSES.map((s) => (
                                            <SelectItem
                                                key={s.value}
                                                value={s.value}
                                            >
                                                {s.label}
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
                                    <TableHead>Issue</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Project</TableHead>
                                    <TableHead>Severity</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Assignee</TableHead>
                                    <TableHead className="text-right">
                                        Last seen
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {issues.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={7}
                                            className="text-muted-foreground py-10 text-center text-sm"
                                        >
                                            No issues match these filters.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    issues.data.map((row) => (
                                        <TableRow key={row.id}>
                                            <TableCell>
                                                <Link
                                                    href={`/issues/${row.id}`}
                                                    className="block max-w-md hover:underline"
                                                >
                                                    <p className="flex items-center gap-2 truncate font-mono text-xs font-medium">
                                                        <span className="truncate">
                                                            {row.summary}
                                                        </span>
                                                        {row.is_recurrence ? (
                                                            <RecurrenceBadge />
                                                        ) : null}
                                                    </p>
                                                    {row.recurrence_count >
                                                    0 ? (
                                                        <p className="text-muted-foreground text-xs">
                                                            seen{' '}
                                                            {row.recurrence_count +
                                                                1}{' '}
                                                            times
                                                        </p>
                                                    ) : null}
                                                </Link>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="outline"
                                                    className={cn(
                                                        'text-[10px] uppercase tracking-wide',
                                                        SOURCE_TONE[
                                                            row.source_type
                                                        ],
                                                    )}
                                                >
                                                    {SOURCE_LABEL[row.source_type]}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {row.project?.name ??
                                                    `#${row.project_id}`}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">
                                                    {row.severity}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-xs">
                                                {row.task_status ?? '—'}
                                            </TableCell>
                                            <TableCell>
                                                <IssueAssigneeCell
                                                    issueId={row.id}
                                                    assignee={row.assignee}
                                                />
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-right text-xs">
                                                {row.last_seen_at
                                                    ? new Date(
                                                          row.last_seen_at,
                                                      ).toLocaleString()
                                                    : '—'}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                        <div className="border-border border-t p-4">
                            <InertiaPagination
                                path="/issues"
                                meta={issues}
                                filters={filterPayload}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

IssuesIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Issues', href: '/issues' },
    ],
};

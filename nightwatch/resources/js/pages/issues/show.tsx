import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RecurrenceBadge } from '@/features/exceptions/components/RecurrenceBadge';
import { IssueAssigneeCell } from '@/features/issues/components/IssueAssigneeCell';
import { cn } from '@/lib/utils';

type IssueSourceType = 'slow_query' | 'slow_request';

type IssuePayload = {
    id: number;
    source_type: IssueSourceType;
    source_id: number;
    summary: string;
    severity: string;
    fingerprint: string;
    is_recurrence: boolean;
    recurrence_count: number;
    first_seen_at: string | null;
    last_seen_at: string | null;
    task_status: string | null;
    task_finished_at: string | null;
    assigned_at: string | null;
    project: { id: number; name: string } | null;
    assignee: { id: number; name: string; email: string } | null;
    assigned_by: { id: number; name: string; email: string } | null;
};

type SlowQuerySource = {
    type: 'slow_query';
    sql: string;
    duration_ms: number;
    connection: string | null;
    file: string | null;
    line: number | null;
    is_slow: boolean;
    is_n_plus_one: boolean;
    sent_at: string | null;
    trace_id: string | null;
};

type SlowRequestSource = {
    type: 'slow_request';
    method: string;
    uri: string;
    route_name: string | null;
    status_code: number;
    duration_ms: number;
    ip: string | null;
    sent_at: string | null;
    trace_id: string | null;
};

type SourcePayload = SlowQuerySource | SlowRequestSource | null;

type PageProps = {
    issue: IssuePayload;
    source: SourcePayload;
};

const SOURCE_LABEL: Record<IssueSourceType, string> = {
    slow_query: 'Slow query',
    slow_request: 'Slow request',
};

const SOURCE_TONE: Record<IssueSourceType, string> = {
    slow_query:
        'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300',
    slow_request:
        'border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-300',
};

const SEVERITY_TONE: Record<string, string> = {
    critical: 'border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300',
    error: 'border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300',
    warning:
        'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300',
    info: 'border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-300',
};

function formatDateTime(iso: string | null): string {
    if (!iso) return '—';
    try {
        return new Date(iso).toLocaleString();
    } catch {
        return iso;
    }
}

export default function IssueShow() {
    const { issue, source } = usePage<PageProps>().props;
    const severityTone = SEVERITY_TONE[issue.severity] ?? SEVERITY_TONE.info;

    return (
        <>
            <Head title={`${SOURCE_LABEL[issue.source_type]} #${issue.id}`} />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <Button
                    variant="ghost"
                    size="sm"
                    className="w-fit gap-2 px-2"
                    asChild
                >
                    <Link href="/tasks">
                        <ArrowLeft className="size-4" />
                        Tasks
                    </Link>
                </Button>

                <Card>
                    <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                            <p className="text-muted-foreground text-[11px] font-medium uppercase tracking-wider">
                                Issue
                            </p>
                            <h1 className="text-foreground mt-1 break-words font-mono text-lg font-semibold">
                                {SOURCE_LABEL[issue.source_type]} #{issue.id}
                            </h1>
                            <p className="text-muted-foreground mt-2 break-words text-sm">
                                {issue.summary}
                            </p>
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                                <Badge
                                    variant="outline"
                                    className={cn(SOURCE_TONE[issue.source_type])}
                                >
                                    {SOURCE_LABEL[issue.source_type]}
                                </Badge>
                                <Badge variant="outline" className={severityTone}>
                                    {issue.severity}
                                </Badge>
                                {issue.task_status ? (
                                    <Badge variant="outline">
                                        Status: {issue.task_status}
                                    </Badge>
                                ) : null}
                                {issue.is_recurrence ? <RecurrenceBadge /> : null}
                            </div>
                        </div>

                        <div className="shrink-0">
                            <IssueAssigneeCell
                                issueId={issue.id}
                                assignee={issue.assignee}
                            />
                        </div>
                    </CardHeader>
                </Card>

                {issue.is_recurrence || issue.recurrence_count > 0 ? (
                    <Card className="border-red-500/40">
                        <CardHeader>
                            <CardTitle className="text-base text-red-700 dark:text-red-300">
                                Recurrence
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
                            <div>
                                <p className="text-muted-foreground text-[11px] font-medium uppercase tracking-wider">
                                    Times recurred
                                </p>
                                <p className="text-foreground mt-0.5">
                                    {issue.recurrence_count}
                                </p>
                            </div>
                            <div>
                                <p className="text-muted-foreground text-[11px] font-medium uppercase tracking-wider">
                                    First seen
                                </p>
                                <p className="text-foreground mt-0.5">
                                    {formatDateTime(issue.first_seen_at)}
                                </p>
                            </div>
                            <div>
                                <p className="text-muted-foreground text-[11px] font-medium uppercase tracking-wider">
                                    Last seen
                                </p>
                                <p className="text-foreground mt-0.5">
                                    {formatDateTime(issue.last_seen_at)}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                ) : null}

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Overview</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <dl className="grid gap-3 text-sm sm:grid-cols-2 md:grid-cols-3">
                            <Field
                                label="Project"
                                value={issue.project?.name ?? null}
                            />
                            <Field
                                label="Assignee"
                                value={
                                    issue.assignee
                                        ? `${issue.assignee.name} (${issue.assignee.email})`
                                        : null
                                }
                            />
                            <Field
                                label="Assigned by"
                                value={
                                    issue.assigned_by
                                        ? issue.assigned_by.name
                                        : null
                                }
                            />
                            <Field
                                label="Assigned at"
                                value={formatDateTime(issue.assigned_at)}
                            />
                            <Field
                                label="Task status"
                                value={issue.task_status}
                            />
                            <Field
                                label="Finished at"
                                value={formatDateTime(issue.task_finished_at)}
                            />
                            <Field label="Fingerprint" value={issue.fingerprint} mono />
                        </dl>
                    </CardContent>
                </Card>

                {source !== null ? (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">
                                Latest occurrence
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {source.type === 'slow_query' ? (
                                <SlowQueryDetails source={source} />
                            ) : (
                                <SlowRequestDetails source={source} />
                            )}
                        </CardContent>
                    </Card>
                ) : null}
            </div>
        </>
    );
}

function SlowQueryDetails({ source }: { source: SlowQuerySource }) {
    return (
        <div className="space-y-3">
            <pre className="bg-muted/40 max-h-80 overflow-auto rounded-md border border-border p-3 font-mono text-xs leading-relaxed">
                {source.sql}
            </pre>
            <dl className="grid gap-3 text-sm sm:grid-cols-2 md:grid-cols-3">
                <Field
                    label="Duration"
                    value={`${source.duration_ms.toFixed(1)}ms`}
                />
                <Field label="Connection" value={source.connection} />
                <Field
                    label="Location"
                    value={
                        source.file
                            ? `${source.file}${source.line !== null ? `:${source.line}` : ''}`
                            : null
                    }
                    mono
                />
                <Field label="Slow" value={source.is_slow ? 'yes' : 'no'} />
                <Field
                    label="N+1"
                    value={source.is_n_plus_one ? 'yes' : 'no'}
                />
                <Field label="Trace ID" value={source.trace_id} mono />
            </dl>
        </div>
    );
}

function SlowRequestDetails({ source }: { source: SlowRequestSource }) {
    return (
        <dl className="grid gap-3 text-sm sm:grid-cols-2 md:grid-cols-3">
            <Field label="Method" value={source.method} />
            <Field label="URI" value={source.uri} mono />
            <Field label="Route name" value={source.route_name} />
            <Field label="Status code" value={String(source.status_code)} />
            <Field
                label="Duration"
                value={`${source.duration_ms.toFixed(1)}ms`}
            />
            <Field label="IP" value={source.ip} />
            <Field label="Trace ID" value={source.trace_id} mono />
        </dl>
    );
}

function Field({
    label,
    value,
    mono,
}: {
    label: string;
    value: string | null;
    mono?: boolean;
}) {
    return (
        <div>
            <p className="text-muted-foreground text-[11px] font-medium uppercase tracking-wider">
                {label}
            </p>
            <p
                className={
                    mono
                        ? 'text-foreground mt-0.5 break-all font-mono text-xs'
                        : 'text-foreground mt-0.5 text-sm'
                }
            >
                {value ?? '—'}
            </p>
        </div>
    );
}

IssueShow.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Tasks', href: '/tasks' },
        { title: 'Issue', href: '#' },
    ],
};

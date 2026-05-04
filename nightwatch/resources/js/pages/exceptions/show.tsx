import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CopyMarkdownButton } from '@/features/exceptions/components/CopyMarkdownButton';
import {
    ExceptionFieldList,
    type ExceptionField,
} from '@/features/exceptions/components/ExceptionFieldList';
import {
    ExceptionTimeline,
    type TimelinePayload,
} from '@/features/exceptions/components/ExceptionTimeline';
import { RecurrenceBadge } from '@/features/exceptions/components/RecurrenceBadge';

type ExceptionPayload = {
    id: number;
    exception_class: string;
    message: string;
    severity: string;
    environment: string | null;
    server: string | null;
    file: string | null;
    line: number | null;
    url: string | null;
    status_code: number | null;
    user: string | null;
    ip: string | null;
    headers: string | null;
    stack_trace: string | null;
    sent_at: string | null;
    task_status: string | null;
    task_finished_at: string | null;
    assigned_at: string | null;
    is_recurrence: boolean;
    recurrence_count: number;
    total_recurrences: number;
    original_exception_id: number | null;
    project: { id: number; name: string; environment: string | null } | null;
    assignee: { id: number; name: string; email: string } | null;
    assigned_by: { id: number; name: string; email: string } | null;
};

type PageProps = {
    exception: ExceptionPayload;
    markdown: string;
    timeline: TimelinePayload;
};

const SEVERITY_TONE: Record<string, string> = {
    critical: 'border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300',
    error: 'border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300',
    warning:
        'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300',
    info: 'border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-300',
    debug: 'border-border bg-muted text-muted-foreground',
};

function formatDateTime(iso: string | null): string {
    if (!iso) {
        return '';
    }
    try {
        return new Date(iso).toLocaleString();
    } catch {
        return iso;
    }
}

export default function ExceptionShow() {
    const { exception, markdown, timeline } = usePage<PageProps>().props;

    const overviewFields: ExceptionField[] = [
        {
            label: 'Project',
            value: exception.project ? exception.project.name : null,
        },
        { label: 'Environment', value: exception.environment },
        { label: 'Server', value: exception.server },
        { label: 'Status code', value: exception.status_code },
        { label: 'URL', value: exception.url },
        { label: 'Captured at', value: formatDateTime(exception.sent_at) },
    ];

    const locationFields: ExceptionField[] = [
        { label: 'File', value: exception.file },
        { label: 'Line', value: exception.line },
    ];

    const userContextFields: ExceptionField[] = [
        { label: 'User', value: exception.user },
        { label: 'IP', value: exception.ip },
    ];

    const assignmentFields: ExceptionField[] = [
        {
            label: 'Assigned to',
            value: exception.assignee
                ? `${exception.assignee.name} (${exception.assignee.email})`
                : null,
        },
        {
            label: 'Assigned by',
            value: exception.assigned_by
                ? `${exception.assigned_by.name} (${exception.assigned_by.email})`
                : null,
        },
        { label: 'Task status', value: exception.task_status },
        {
            label: 'Assigned at',
            value: formatDateTime(exception.assigned_at),
        },
        {
            label: 'Finished at',
            value: formatDateTime(exception.task_finished_at),
        },
    ];

    const isAssigned = exception.assignee !== null;
    const severityTone =
        SEVERITY_TONE[exception.severity.toLowerCase()] ?? SEVERITY_TONE.debug;

    return (
        <>
            <Head title={`Exception #${exception.id}`} />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <Button
                    variant="ghost"
                    size="sm"
                    className="w-fit gap-2 px-2"
                    asChild
                >
                    <Link href="/exceptions">
                        <ArrowLeft className="size-4" />
                        Exceptions
                    </Link>
                </Button>

                <Card>
                    <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                            <p className="text-muted-foreground text-[11px] font-medium uppercase tracking-wider">
                                Exception
                            </p>
                            <h1
                                className="text-foreground mt-1 break-words font-mono text-lg font-semibold"
                                title={exception.exception_class}
                            >
                                {exception.exception_class}
                            </h1>
                            <p className="text-muted-foreground mt-2 break-words text-sm">
                                {exception.message}
                            </p>
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                                <Badge
                                    variant="outline"
                                    className={severityTone}
                                >
                                    {exception.severity}
                                </Badge>
                                {exception.environment ? (
                                    <Badge variant="outline">
                                        {exception.environment}
                                    </Badge>
                                ) : null}
                                {exception.task_status ? (
                                    <Badge variant="outline">
                                        Status: {exception.task_status}
                                    </Badge>
                                ) : null}
                                {exception.is_recurrence ? (
                                    <RecurrenceBadge />
                                ) : null}
                            </div>
                        </div>

                        <div className="shrink-0">
                            <CopyMarkdownButton markdown={markdown} />
                        </div>
                    </CardHeader>
                </Card>

                {exception.is_recurrence ? (
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
                                    {exception.total_recurrences}
                                </p>
                            </div>
                            {exception.original_exception_id ? (
                                <div>
                                    <p className="text-muted-foreground text-[11px] font-medium uppercase tracking-wider">
                                        Original occurrence
                                    </p>
                                    <p className="text-foreground mt-0.5">
                                        <Link
                                            href={`/exceptions/${exception.original_exception_id}`}
                                            className="underline-offset-2 hover:underline"
                                        >
                                            #{exception.original_exception_id}
                                        </Link>
                                    </p>
                                </div>
                            ) : null}
                        </CardContent>
                    </Card>
                ) : null}

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Overview</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ExceptionFieldList fields={overviewFields} />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Timeline</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ExceptionTimeline
                            timeline={timeline}
                            exceptionClass={exception.exception_class}
                            exceptionMessage={exception.message}
                        />
                    </CardContent>
                </Card>

                {exception.file || exception.line !== null ? (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">
                                Location
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ExceptionFieldList fields={locationFields} />
                        </CardContent>
                    </Card>
                ) : null}

                {exception.user || exception.ip ? (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">
                                User context
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ExceptionFieldList fields={userContextFields} />
                        </CardContent>
                    </Card>
                ) : null}

                {isAssigned ? (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">
                                Assignment
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ExceptionFieldList fields={assignmentFields} />
                        </CardContent>
                    </Card>
                ) : null}

                {exception.headers ? (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Headers</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <pre className="bg-muted/40 max-h-80 overflow-auto rounded-md border border-border p-3 font-mono text-xs leading-relaxed">
                                {exception.headers}
                            </pre>
                        </CardContent>
                    </Card>
                ) : null}

                {exception.stack_trace ? (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">
                                Stack trace
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <pre className="bg-muted/40 max-h-[28rem] overflow-auto rounded-md border border-border p-3 font-mono text-xs leading-relaxed">
                                {exception.stack_trace}
                            </pre>
                        </CardContent>
                    </Card>
                ) : null}
            </div>
        </>
    );
}

ExceptionShow.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Exceptions', href: '/exceptions' },
        { title: 'Details', href: '#' },
    ],
};

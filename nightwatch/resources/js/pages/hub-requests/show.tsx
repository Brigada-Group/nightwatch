import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    TraceWaterfall,
    type TraceEvent,
} from '@/features/traces/components/TraceWaterfall';

type RequestPayload = {
    id: number;
    method: string;
    uri: string;
    route_name: string | null;
    status_code: number;
    duration_ms: number;
    ip: string | null;
    user_id: number | null;
    environment: string | null;
    server: string | null;
    trace_id: string | null;
    sent_at: string | null;
    project: { id: number; name: string } | null;
};

type TracePayload = {
    events: TraceEvent[];
    trace_id: string | null;
    total_duration_ms: number;
    truncated_sources: Record<string, number>;
};

type PageProps = {
    request: RequestPayload;
    trace: TracePayload;
};

function statusTone(code: number): string {
    if (code >= 500)
        return 'border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300';
    if (code >= 400)
        return 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300';
    return 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300';
}

function formatDateTime(iso: string | null): string {
    if (!iso) return '';
    try {
        return new Date(iso).toLocaleString();
    } catch {
        return iso;
    }
}

export default function HubRequestShow() {
    const { request, trace } = usePage<PageProps>().props;

    const truncatedEntries = Object.entries(trace.truncated_sources);
    const exceptionEvents = trace.events.filter((e) => e.type === 'exception');

    return (
        <>
            <Head title={`${request.method} ${request.uri}`} />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <Button
                    variant="ghost"
                    size="sm"
                    className="w-fit gap-2 px-2"
                    asChild
                >
                    <Link href="/hub-requests">
                        <ArrowLeft className="size-4" />
                        Requests
                    </Link>
                </Button>

                <Card>
                    <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                            <p className="text-muted-foreground text-[11px] font-medium uppercase tracking-wider">
                                Request
                            </p>
                            <h1 className="text-foreground mt-1 break-words font-mono text-lg font-semibold">
                                {request.method} {request.uri}
                            </h1>
                            {request.route_name ? (
                                <p className="text-muted-foreground mt-1 break-words font-mono text-xs">
                                    {request.route_name}
                                </p>
                            ) : null}
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                                <Badge
                                    variant="outline"
                                    className={statusTone(request.status_code)}
                                >
                                    HTTP {request.status_code}
                                </Badge>
                                <Badge variant="outline">
                                    {request.duration_ms.toFixed(0)}ms
                                </Badge>
                                {request.environment ? (
                                    <Badge variant="outline">
                                        {request.environment}
                                    </Badge>
                                ) : null}
                                {request.project ? (
                                    <Badge variant="outline">
                                        {request.project.name}
                                    </Badge>
                                ) : null}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <dl className="grid gap-3 text-sm sm:grid-cols-2 md:grid-cols-3">
                            <Field
                                label="Captured at"
                                value={formatDateTime(request.sent_at)}
                            />
                            <Field label="Server" value={request.server} />
                            <Field label="IP" value={request.ip} />
                            <Field
                                label="User ID"
                                value={
                                    request.user_id !== null
                                        ? String(request.user_id)
                                        : null
                                }
                            />
                            <Field
                                label="Trace ID"
                                value={request.trace_id}
                                mono
                            />
                        </dl>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">
                            Trace waterfall
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {request.trace_id === null ? (
                            <p className="text-muted-foreground text-sm">
                                This request was captured without a trace ID.
                                Distributed tracing requires the sender SDK to
                                generate and propagate a trace ID per request.
                            </p>
                        ) : (
                            <>
                                <TraceWaterfall
                                    events={trace.events}
                                    totalDurationMs={trace.total_duration_ms}
                                />
                                {truncatedEntries.length > 0 ? (
                                    <p className="text-muted-foreground mt-3 text-xs">
                                        Some events were truncated:{' '}
                                        {truncatedEntries
                                            .map(
                                                ([k, n]) =>
                                                    `+${n} more ${k}`,
                                            )
                                            .join(', ')}
                                    </p>
                                ) : null}
                            </>
                        )}
                    </CardContent>
                </Card>

                {exceptionEvents.length > 0 ? (
                    <Card className="border-red-500/40">
                        <CardHeader>
                            <CardTitle className="text-base text-red-700 dark:text-red-300">
                                Exceptions in this trace
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-2">
                                {exceptionEvents.map((event) => {
                                    const exceptionId = event.details.id as
                                        | number
                                        | undefined;
                                    return (
                                        <li
                                            key={event.id}
                                            className="rounded-md border border-red-500/30 bg-red-500/5 p-3"
                                        >
                                            <p className="text-foreground break-words font-mono text-xs">
                                                {event.summary}
                                            </p>
                                            {exceptionId ? (
                                                <Link
                                                    href={`/exceptions/${exceptionId}`}
                                                    className="text-red-700 dark:text-red-300 mt-1 inline-block text-xs underline-offset-2 hover:underline"
                                                >
                                                    View exception #
                                                    {exceptionId}
                                                </Link>
                                            ) : null}
                                        </li>
                                    );
                                })}
                            </ul>
                        </CardContent>
                    </Card>
                ) : null}
            </div>
        </>
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

HubRequestShow.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Requests', href: '/hub-requests' },
        { title: 'Trace', href: '#' },
    ],
};

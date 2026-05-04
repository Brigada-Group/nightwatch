import {
    Activity,
    AlertTriangle,
    Database,
    FileText,
    Globe,
    HardDrive,
    Mail,
    Send,
    Workflow,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export type TimelineEventType =
    | 'request'
    | 'query'
    | 'log'
    | 'job'
    | 'outgoing_http'
    | 'cache'
    | 'mail'
    | 'notification'
    | 'exception';

export type TimelineSeverity = 'success' | 'info' | 'warning' | 'error';

export type TimelineEventData = {
    id: string;
    type: TimelineEventType;
    occurred_at: string;
    offset_ms: number;
    summary: string;
    severity: TimelineSeverity;
    details: Record<string, unknown>;
};

type Props = {
    event: TimelineEventData;
};

const TYPE_LABEL: Record<TimelineEventType, string> = {
    request: 'request',
    query: 'query',
    log: 'log',
    job: 'job',
    outgoing_http: 'http',
    cache: 'cache',
    mail: 'mail',
    notification: 'notif',
    exception: 'error',
};

const ICON_FOR_TYPE: Record<
    TimelineEventType,
    React.ComponentType<{ className?: string }>
> = {
    request: Globe,
    query: Database,
    log: FileText,
    job: Workflow,
    outgoing_http: Send,
    cache: HardDrive,
    mail: Mail,
    notification: Activity,
    exception: AlertTriangle,
};

const SEVERITY_TONE: Record<TimelineSeverity, string> = {
    success:
        'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
    info: 'border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-300',
    warning:
        'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300',
    error: 'border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300',
};

function formatOffset(offsetMs: number): string {
    const seconds = offsetMs / 1000;
    const sign = seconds >= 0 ? '+' : '−';
    const abs = Math.abs(seconds);

    if (abs < 1) {
        return `${sign}${Math.round(abs * 1000)}ms`;
    }

    return `${sign}${abs.toFixed(1)}s`;
}

function renderDetails(
    type: TimelineEventType,
    details: Record<string, unknown>,
) {
    const entries = Object.entries(details).filter(
        ([, v]) => v !== null && v !== undefined && v !== '',
    );

    if (entries.length === 0) {
        return null;
    }

    return (
        <dl className="bg-muted/30 mt-2 grid gap-1 rounded-md border border-border p-2 text-xs sm:grid-cols-2">
            {entries.map(([k, v]) => (
                <div key={k} className="min-w-0">
                    <dt className="text-muted-foreground text-[10px] uppercase tracking-wider">
                        {k.replace(/_/g, ' ')}
                    </dt>
                    <dd className="text-foreground font-mono break-words">
                        {typeof v === 'object'
                            ? JSON.stringify(v)
                            : String(v)}
                    </dd>
                </div>
            ))}
        </dl>
    );
}

export function TimelineEvent({ event }: Props) {
    const [expanded, setExpanded] = useState(false);
    const Icon = ICON_FOR_TYPE[event.type];

    return (
        <li className="group flex items-start gap-3">
            <span className="text-muted-foreground w-14 shrink-0 pt-1.5 text-right text-[11px] font-medium tabular-nums">
                {formatOffset(event.offset_ms)}
            </span>

            <span
                className={cn(
                    'mt-1 flex size-6 shrink-0 items-center justify-center rounded-full border',
                    SEVERITY_TONE[event.severity],
                )}
            >
                <Icon className="size-3" />
            </span>

            <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="min-w-0 flex-1 text-left"
            >
                <div className="flex items-start gap-2">
                    <span className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wider pt-0.5">
                        {TYPE_LABEL[event.type]}
                    </span>
                    <span className="text-foreground min-w-0 break-words text-xs leading-relaxed">
                        {event.summary}
                    </span>
                </div>
                {expanded ? renderDetails(event.type, event.details) : null}
            </button>
        </li>
    );
}

/**
 * Used to render the exception itself as a centerpiece in the timeline.
 * Stays visually distinct from the surrounding events so the moment of
 * failure is unmistakable.
 */
export function TimelineExceptionCenter({
    label,
    summary,
}: {
    label: string;
    summary: string;
}) {
    return (
        <li className="flex items-start gap-3">
            <span className="text-foreground w-14 shrink-0 pt-1.5 text-right text-[11px] font-bold tabular-nums">
                0.0s
            </span>
            <span className="mt-1 flex size-6 shrink-0 items-center justify-center rounded-full border border-red-500/60 bg-red-500/15 text-red-700 dark:text-red-300">
                <AlertTriangle className="size-3" />
            </span>
            <div className="min-w-0 flex-1 rounded-md border border-red-500/40 bg-red-500/5 px-3 py-2">
                <p className="text-red-700 dark:text-red-300 text-[10px] font-bold uppercase tracking-wider">
                    Exception
                </p>
                <p className="text-foreground mt-0.5 break-words font-mono text-xs font-semibold">
                    {label}
                </p>
                {summary ? (
                    <p className="text-muted-foreground mt-0.5 break-words text-xs">
                        {summary}
                    </p>
                ) : null}
            </div>
        </li>
    );
}

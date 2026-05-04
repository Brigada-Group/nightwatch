import { useState } from 'react';
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
import { cn } from '@/lib/utils';

export type TraceEventType =
    | 'request'
    | 'query'
    | 'log'
    | 'job'
    | 'outgoing_http'
    | 'cache'
    | 'mail'
    | 'notification'
    | 'exception';

export type TraceEventSeverity = 'success' | 'info' | 'warning' | 'error';

export type TraceEvent = {
    id: string;
    type: TraceEventType;
    occurred_at: string;
    start_ms: number;
    offset_ms: number;
    duration_ms: number | null;
    summary: string;
    severity: TraceEventSeverity;
    details: Record<string, unknown>;
};

type Props = {
    events: TraceEvent[];
    totalDurationMs: number;
};

const ICON_FOR_TYPE: Record<
    TraceEventType,
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

const TYPE_LABEL: Record<TraceEventType, string> = {
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

const BAR_TONE: Record<TraceEventSeverity, string> = {
    success: 'bg-emerald-500/70',
    info: 'bg-sky-500/70',
    warning: 'bg-amber-500/80',
    error: 'bg-red-500/80',
};

const ICON_TONE: Record<TraceEventSeverity, string> = {
    success:
        'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
    info: 'border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-300',
    warning:
        'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300',
    error: 'border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300',
};

function formatMs(ms: number): string {
    if (ms < 1) return '<1ms';
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
}

export function TraceWaterfall({ events, totalDurationMs }: Props) {
    const [selectedId, setSelectedId] = useState<string | null>(null);

    if (events.length === 0) {
        return (
            <p className="text-muted-foreground text-sm">
                No events recorded for this trace.
            </p>
        );
    }

    const span = Math.max(1, totalDurationMs);

    return (
        <div className="space-y-1">
            <div className="text-muted-foreground flex items-center justify-between pb-2 text-[10px] uppercase tracking-wider">
                <span>Span</span>
                <span>Total: {formatMs(totalDurationMs)}</span>
            </div>
            <ol className="space-y-1">
                {events.map((event) => {
                    const Icon = ICON_FOR_TYPE[event.type];
                    const duration = event.duration_ms ?? 0;
                    const leftPct = (event.offset_ms / span) * 100;
                    const widthPct = Math.max(
                        0.5,
                        (duration / span) * 100,
                    );
                    const isSelected = selectedId === event.id;

                    return (
                        <li key={event.id}>
                            <button
                                type="button"
                                onClick={() =>
                                    setSelectedId(
                                        isSelected ? null : event.id,
                                    )
                                }
                                className={cn(
                                    'group hover:bg-muted/40 flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-left transition-colors',
                                    isSelected && 'bg-muted/40',
                                )}
                            >
                                <span
                                    className={cn(
                                        'flex size-5 shrink-0 items-center justify-center rounded-full border',
                                        ICON_TONE[event.severity],
                                    )}
                                >
                                    <Icon className="size-2.5" />
                                </span>
                                <span className="text-muted-foreground w-12 shrink-0 text-[10px] font-semibold uppercase tracking-wider">
                                    {TYPE_LABEL[event.type]}
                                </span>
                                <span className="text-foreground min-w-0 max-w-[40%] flex-1 truncate text-xs">
                                    {event.summary}
                                </span>
                                <span className="bg-border/40 relative h-2 flex-1 overflow-visible rounded-full">
                                    <span
                                        className={cn(
                                            'absolute inset-y-0 rounded-full',
                                            BAR_TONE[event.severity],
                                        )}
                                        style={{
                                            left: `${Math.min(99, Math.max(0, leftPct))}%`,
                                            width: `${Math.min(100 - leftPct, widthPct)}%`,
                                        }}
                                    />
                                </span>
                                <span className="text-muted-foreground w-16 shrink-0 text-right text-[11px] tabular-nums">
                                    {duration > 0 ? formatMs(duration) : '—'}
                                </span>
                            </button>
                            {isSelected ? (
                                <div className="bg-muted/30 ml-7 mt-1 rounded-md border border-border p-3 text-xs">
                                    <p className="text-foreground break-words font-mono">
                                        {event.summary}
                                    </p>
                                    <dl className="mt-2 grid gap-1 sm:grid-cols-2">
                                        <Row
                                            label="Start"
                                            value={`+${formatMs(event.offset_ms)}`}
                                        />
                                        <Row
                                            label="Duration"
                                            value={
                                                duration > 0
                                                    ? formatMs(duration)
                                                    : 'instant'
                                            }
                                        />
                                        {Object.entries(event.details)
                                            .filter(
                                                ([, v]) =>
                                                    v !== null &&
                                                    v !== undefined &&
                                                    v !== '',
                                            )
                                            .map(([k, v]) => (
                                                <Row
                                                    key={k}
                                                    label={k.replace(
                                                        /_/g,
                                                        ' ',
                                                    )}
                                                    value={
                                                        typeof v === 'object'
                                                            ? JSON.stringify(
                                                                  v,
                                                              )
                                                            : String(v)
                                                    }
                                                />
                                            ))}
                                    </dl>
                                </div>
                            ) : null}
                        </li>
                    );
                })}
            </ol>
        </div>
    );
}

function Row({ label, value }: { label: string; value: string }) {
    return (
        <div className="min-w-0">
            <dt className="text-muted-foreground text-[10px] uppercase tracking-wider">
                {label}
            </dt>
            <dd className="text-foreground break-words font-mono text-xs">
                {value}
            </dd>
        </div>
    );
}

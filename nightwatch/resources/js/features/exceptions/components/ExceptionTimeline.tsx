import {
    TimelineEvent,
    TimelineExceptionCenter,
    type TimelineEventData,
} from './TimelineEvent';

export type TimelinePayload = {
    events: TimelineEventData[];
    window_seconds: number;
    center_at: string;
    truncated_sources: Record<string, number>;
};

type Props = {
    timeline: TimelinePayload;
    exceptionClass: string;
    exceptionMessage: string;
};

const SOURCE_LABEL: Record<string, string> = {
    request: 'requests',
    query: 'queries',
    log: 'logs',
    job: 'jobs',
    outgoing_http: 'outgoing HTTP',
    cache: 'cache',
    mail: 'mails',
    notification: 'notifications',
};

/**
 * Renders the chronological correlation panel: every relevant telemetry
 * event in the same project ±N seconds around the exception, with the
 * exception itself anchored at the center as a visual marker.
 */
export function ExceptionTimeline({
    timeline,
    exceptionClass,
    exceptionMessage,
}: Props) {
    const before = timeline.events.filter((e) => e.offset_ms < 0);
    const after = timeline.events.filter((e) => e.offset_ms >= 0);

    const truncatedNotice = Object.entries(timeline.truncated_sources)
        .map(([type, count]) => `+${count} more ${SOURCE_LABEL[type] ?? type}`)
        .join(' · ');

    if (timeline.events.length === 0) {
        return (
            <div className="rounded-md border border-dashed border-border p-6 text-center">
                <p className="text-muted-foreground text-sm">
                    No correlated telemetry within ±{timeline.window_seconds}{' '}
                    seconds.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <p className="text-muted-foreground text-xs">
                Showing telemetry within ±{timeline.window_seconds} seconds of
                this exception in the same project.
            </p>

            <ul className="flex flex-col gap-2">
                {before.map((event) => (
                    <TimelineEvent key={event.id} event={event} />
                ))}

                <TimelineExceptionCenter
                    label={exceptionClass}
                    summary={exceptionMessage}
                />

                {after.map((event) => (
                    <TimelineEvent key={event.id} event={event} />
                ))}
            </ul>

            {truncatedNotice ? (
                <p className="text-muted-foreground text-[11px] italic">
                    Some events were not shown to keep the page snappy:{' '}
                    {truncatedNotice}.
                </p>
            ) : null}
        </div>
    );
}

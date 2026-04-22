import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { usePrivateChannel } from '@/shared/hooks/useChannel';
import { useDebouncedInvalidate } from '@/shared/hooks/useDebouncedInvalidate';

type HeartbeatPayload = {
    project_id: number;
    project_name: string;
    status: string;
};

type StatusChangedPayload = {
    project_id: number;
    project_name: string;
    old_status: string;
    new_status: string;
};

type ExceptionPayload = {
    project_id: number;
    exception_class: string;
    message: string;
    severity: string;
};

type LogPayload = {
    project_id: number;
    level: string;
    message: string;
};

type JobPayload = {
    project_id: number;
    job_class: string;
    status: string;
};

type RequestPayload = {
    project_id: number;
    method: string;
    uri: string;
    status_code: number;
};

function useGlobalProjectsChannel() {
    const invalidate = useDebouncedInvalidate();
    const [projectIds, setProjectIds] = useState<number[]>([]);

    const onHeartbeat = useCallback(
        (data: unknown) => {
            const payload = data as HeartbeatPayload;
            invalidate(['projects']);
            invalidate(['dashboard']);

            if (!projectIds.includes(payload.project_id)) {
                setProjectIds((prev) => [...new Set([...prev, payload.project_id])]);
            }

            const name =
                payload.project_name ??
                (payload.project_id != null
                    ? `Project #${payload.project_id}`
                    : 'Unknown project');
            toast.info(`Heartbeat from ${name}`);
        },
        [invalidate, projectIds],
    );

    const onStatusChanged = useCallback(
        (data: unknown) => {
            const payload = data as StatusChangedPayload;
            invalidate(['projects']);
            invalidate(['dashboard']);

            if (payload.new_status === 'critical') {
                toast.error(`${payload.project_name} is now CRITICAL`);
            } else if (payload.new_status === 'warning') {
                toast.warning(`${payload.project_name} status: WARNING`);
            } else {
                toast.success(`${payload.project_name} status: ${payload.new_status}`);
            }
        },
        [invalidate],
    );

    usePrivateChannel('projects', {
        '.heartbeat.received': onHeartbeat,
        '.project-status.changed': onStatusChanged,
    });

    return projectIds;
}

function useProjectChannel(projectId: number | null) {
    const invalidate = useDebouncedInvalidate();

    const onException = useCallback(
        (data: unknown) => {
            const payload = data as ExceptionPayload;
            invalidate(['exceptions']);
            invalidate(['dashboard']);
            toast.error(`Exception: ${payload.exception_class}`, {
                description: payload.message.slice(0, 100),
            });
        },
        [invalidate],
    );

    const onLog = useCallback(
        (data: unknown) => {
            const payload = data as LogPayload;
            invalidate(['logs']);
            invalidate(['dashboard']);

            if (['emergency', 'alert', 'critical'].includes(payload.level)) {
                toast.error(`[${payload.level.toUpperCase()}] ${payload.message}`);
            }
        },
        [invalidate],
    );

    const onJob = useCallback(
        (data: unknown) => {
            const payload = data as JobPayload;
            invalidate(['jobs']);
            invalidate(['dashboard']);

            if (payload.status === 'failed') {
                toast.error(`Job failed: ${payload.job_class}`);
            }
        },
        [invalidate],
    );

    const onRequest = useCallback(
        (data: unknown) => {
            const payload = data as RequestPayload;
            invalidate(['requests']);
            invalidate(['dashboard']);

            if (payload.status_code >= 500) {
                toast.error(`${payload.method} ${payload.uri} → ${payload.status_code}`);
            }
        },
        [invalidate],
    );

    usePrivateChannel(projectId ? `project.${projectId}` : null, {
        '.exception.received': onException,
        '.log.received': onLog,
        '.job.received': onJob,
        '.request.received': onRequest,
        '.query.received': () => {
            invalidate(['queries']);
            invalidate(['dashboard']);
        },
        '.cache.received': () => {
            invalidate(['cache']);
        },
        '.command.received': () => {
            invalidate(['commands']);
        },
        '.mail.received': () => {
            invalidate(['mail']);
        },
        '.notification.received': () => {
            invalidate(['notifications']);
        },
        '.outgoing-http.received': () => {
            invalidate(['outgoing-http']);
        },
        '.scheduled-task.received': () => {
            invalidate(['scheduled-tasks']);
        },
        '.health-check.received': () => {
            invalidate(['health-checks']);
            invalidate(['dashboard']);
        },
    });
}

function ProjectChannelSubscriber({ projectId }: { projectId: number }) {
    useProjectChannel(projectId);

    return null;
}

export function EventsProvider({ children }: { children: React.ReactNode }) {
    const discoveredIds = useGlobalProjectsChannel();
    const [knownProjectIds, setKnownProjectIds] = useState<number[]>([]);

    useEffect(() => {
        fetch('/api/project-ids')
            .then((r) => (r.ok ? r.json() : []))
            .then((ids: number[]) => setKnownProjectIds(ids))
            .catch(() => {});
    }, []);

    const allIds = [...new Set([...knownProjectIds, ...discoveredIds])];

    return (
        <>
            {allIds.map((id) => (
                <ProjectChannelSubscriber key={id} projectId={id} />
            ))}
            {children}
        </>
    );
}

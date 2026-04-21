import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { toast } from 'sonner';
import { usePrivateChannel } from '@/shared/hooks/useChannel';

type HeartbeatPayload = {
    project_id: number;
    project_name: string;
    status: string;
    last_heartbeat_at: string;
    metadata: Record<string, unknown>;
};

type StatusChangedPayload = {
    project_id: number;
    project_name: string;
    old_status: string;
    new_status: string;
};

export function useProjectsEvents() {
    const queryClient = useQueryClient();

    const onHeartbeat = useCallback(
        (data: unknown) => {
            const payload = data as HeartbeatPayload;
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            queryClient.invalidateQueries({
                queryKey: ['projects', payload.project_id],
            });
        },
        [queryClient],
    );

    const onStatusChanged = useCallback(
        (data: unknown) => {
            const payload = data as StatusChangedPayload;
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            queryClient.invalidateQueries({
                queryKey: ['projects', payload.project_id],
            });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });

            if (payload.new_status === 'critical') {
                toast.error(
                    `${payload.project_name} is now CRITICAL`,
                );
            }
        },
        [queryClient],
    );

    usePrivateChannel('projects', {
        '.heartbeat.received': onHeartbeat,
        '.project-status.changed': onStatusChanged,
    });
}

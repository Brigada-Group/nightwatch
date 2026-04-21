import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { toast } from 'sonner';
import { usePrivateChannel } from '@/shared/hooks/useChannel';

type LogPayload = {
    id: number;
    level: string;
    message: string;
};

export function useLogEvents(projectId: number | null) {
    const queryClient = useQueryClient();

    const onLog = useCallback(
        (data: unknown) => {
            const payload = data as LogPayload;
            queryClient.invalidateQueries({ queryKey: ['logs'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });

            if (['emergency', 'alert', 'critical'].includes(payload.level)) {
                toast.error(`[${payload.level.toUpperCase()}] ${payload.message}`);
            }
        },
        [queryClient],
    );

    usePrivateChannel(
        projectId ? `project.${projectId}` : null,
        { '.log.received': onLog },
    );
}

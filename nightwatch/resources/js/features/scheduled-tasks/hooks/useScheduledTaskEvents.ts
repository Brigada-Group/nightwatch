import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { toast } from 'sonner';
import { usePrivateChannel } from '@/shared/hooks/useChannel';

type ScheduledTaskPayload = {
    id: number;
    task: string;
    status: string;
};

export function useScheduledTaskEvents(projectId: number | null) {
    const queryClient = useQueryClient();

    const onScheduledTask = useCallback(
        (data: unknown) => {
            const payload = data as ScheduledTaskPayload;
            queryClient.invalidateQueries({ queryKey: ['scheduled-tasks'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });

            if (payload.status === 'failed') {
                toast.error(`Scheduled task failed: ${payload.task}`);
            }
        },
        [queryClient],
    );

    usePrivateChannel(
        projectId ? `project.${projectId}` : null,
        { '.scheduled-task.received': onScheduledTask },
    );
}

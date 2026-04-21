import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { toast } from 'sonner';
import { usePrivateChannel } from '@/shared/hooks/useChannel';

type JobPayload = {
    id: number;
    job_class: string;
    status: string;
    error_message: string | null;
};

export function useJobEvents(projectId: number | null) {
    const queryClient = useQueryClient();

    const onJob = useCallback(
        (data: unknown) => {
            const payload = data as JobPayload;
            queryClient.invalidateQueries({ queryKey: ['jobs'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });

            if (payload.status === 'failed') {
                toast.error(`Job failed: ${payload.job_class}`);
            }
        },
        [queryClient],
    );

    usePrivateChannel(
        projectId ? `project.${projectId}` : null,
        { '.job.received': onJob },
    );
}

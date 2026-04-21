import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { usePrivateChannel } from '@/shared/hooks/useChannel';

export function useHealthCheckEvents(projectId: number | null) {
    const queryClient = useQueryClient();

    const onHealthCheck = useCallback(
        () => {
            queryClient.invalidateQueries({ queryKey: ['health-checks'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        },
        [queryClient],
    );

    usePrivateChannel(
        projectId ? `project.${projectId}` : null,
        { '.health-check.received': onHealthCheck },
    );
}

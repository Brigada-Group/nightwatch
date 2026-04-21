import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { usePrivateChannel } from '@/shared/hooks/useChannel';

export function useRequestEvents(projectId: number | null) {
    const queryClient = useQueryClient();

    const onRequest = useCallback(
        () => {
            queryClient.invalidateQueries({ queryKey: ['requests'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        },
        [queryClient],
    );

    usePrivateChannel(
        projectId ? `project.${projectId}` : null,
        { '.request.received': onRequest },
    );
}

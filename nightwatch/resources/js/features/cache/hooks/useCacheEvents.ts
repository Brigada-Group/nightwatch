import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { usePrivateChannel } from '@/shared/hooks/useChannel';

export function useCacheEvents(projectId: number | null) {
    const queryClient = useQueryClient();

    const onCache = useCallback(
        () => {
            queryClient.invalidateQueries({ queryKey: ['cache'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        },
        [queryClient],
    );

    usePrivateChannel(
        projectId ? `project.${projectId}` : null,
        { '.cache.received': onCache },
    );
}

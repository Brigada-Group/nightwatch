import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { usePrivateChannel } from '@/shared/hooks/useChannel';

export function useQueryEvents(projectId: number | null) {
    const queryClient = useQueryClient();

    const onQuery = useCallback(
        () => {
            queryClient.invalidateQueries({ queryKey: ['queries'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        },
        [queryClient],
    );

    usePrivateChannel(
        projectId ? `project.${projectId}` : null,
        { '.query.received': onQuery },
    );
}

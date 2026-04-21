import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { usePrivateChannel } from '@/shared/hooks/useChannel';

export function useExceptionEvents(projectId: number | null) {
    const queryClient = useQueryClient();

    const onException = useCallback(
        () => {
            queryClient.invalidateQueries({ queryKey: ['exceptions'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        },
        [queryClient],
    );

    usePrivateChannel(
        projectId ? `project.${projectId}` : null,
        { '.exception.received': onException },
    );
}

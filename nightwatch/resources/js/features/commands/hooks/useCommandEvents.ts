import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { usePrivateChannel } from '@/shared/hooks/useChannel';

export function useCommandEvents(projectId: number | null) {
    const queryClient = useQueryClient();

    const onCommand = useCallback(
        () => {
            queryClient.invalidateQueries({ queryKey: ['commands'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        },
        [queryClient],
    );

    usePrivateChannel(
        projectId ? `project.${projectId}` : null,
        { '.command.received': onCommand },
    );
}

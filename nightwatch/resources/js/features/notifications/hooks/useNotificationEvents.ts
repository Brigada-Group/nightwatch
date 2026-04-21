import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { usePrivateChannel } from '@/shared/hooks/useChannel';

export function useNotificationEvents(projectId: number | null) {
    const queryClient = useQueryClient();

    const onNotification = useCallback(
        () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        },
        [queryClient],
    );

    usePrivateChannel(
        projectId ? `project.${projectId}` : null,
        { '.notification.received': onNotification },
    );
}

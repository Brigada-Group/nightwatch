import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { usePrivateChannel } from '@/shared/hooks/useChannel';

export function useOutgoingHttpEvents(projectId: number | null) {
    const queryClient = useQueryClient();

    const onOutgoingHttp = useCallback(
        () => {
            queryClient.invalidateQueries({ queryKey: ['outgoing-http'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        },
        [queryClient],
    );

    usePrivateChannel(
        projectId ? `project.${projectId}` : null,
        { '.outgoing-http.received': onOutgoingHttp },
    );
}

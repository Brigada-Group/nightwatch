import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { usePrivateChannel } from '@/shared/hooks/useChannel';

export function useMailEvents(projectId: number | null) {
    const queryClient = useQueryClient();

    const onMail = useCallback(
        () => {
            queryClient.invalidateQueries({ queryKey: ['mail'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        },
        [queryClient],
    );

    usePrivateChannel(
        projectId ? `project.${projectId}` : null,
        { '.mail.received': onMail },
    );
}

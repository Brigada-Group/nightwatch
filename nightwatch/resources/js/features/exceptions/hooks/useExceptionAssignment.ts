import { router } from '@inertiajs/react';
import type { AxiosError } from 'axios';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import type { ExceptionAssignee } from '@/entities';
import {
    assignException,
    getAssignableUsers,
    unassignException,
    type AssignableUser,
} from '../api/exceptionAssignmentService';

type UseExceptionAssignmentOptions = {
    exceptionId: number;
    initialAssignee: ExceptionAssignee | null | undefined;
};

type ApiErrorPayload = {
    message?: string;
    errors?: Record<string, string[]>;
};

function readErrorMessage(error: unknown, fallback: string): string {
    const axiosError = error as AxiosError<ApiErrorPayload>;
    const validation = axiosError.response?.data?.errors
        ? Object.values(axiosError.response.data.errors)[0]?.[0]
        : undefined;

    return validation ?? axiosError.response?.data?.message ?? fallback;
}

export function useExceptionAssignment({
    exceptionId,
    initialAssignee,
}: UseExceptionAssignmentOptions) {
    const [assignee, setAssignee] = useState<ExceptionAssignee | null>(
        initialAssignee ?? null,
    );
    const [users, setUsers] = useState<AssignableUser[]>([]);
    const [usersLoaded, setUsersLoaded] = useState(false);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const loadUsers = useCallback(async () => {
        if (usersLoaded || loadingUsers) {
            return;
        }

        setLoadingUsers(true);
        try {
            const fetched = await getAssignableUsers(exceptionId);
            setUsers(fetched);
            setUsersLoaded(true);
        } catch (error) {
            toast.error(readErrorMessage(error, 'Failed to load users.'));
        } finally {
            setLoadingUsers(false);
        }
    }, [exceptionId, loadingUsers, usersLoaded]);

    const assign = useCallback(
        async (user: AssignableUser) => {
            setSubmitting(true);
            try {
                const result = await assignException(exceptionId, user.id);
                setAssignee(result.assignee);
                toast.success(`Assigned to ${user.name}.`);
                router.reload({ only: ['exceptions'] });
            } catch (error) {
                toast.error(readErrorMessage(error, 'Failed to assign user.'));
            } finally {
                setSubmitting(false);
            }
        },
        [exceptionId],
    );

    const unassign = useCallback(async () => {
        setSubmitting(true);
        try {
            await unassignException(exceptionId);
            setAssignee(null);
            toast.success('Assignee cleared.');
            router.reload({ only: ['exceptions'] });
        } catch (error) {
            toast.error(readErrorMessage(error, 'Failed to clear assignee.'));
        } finally {
            setSubmitting(false);
        }
    }, [exceptionId]);

    return {
        assignee,
        users,
        loadingUsers,
        submitting,
        loadUsers,
        assign,
        unassign,
    };
}

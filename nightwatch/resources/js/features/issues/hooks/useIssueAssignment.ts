import { router } from '@inertiajs/react';
import type { AxiosError } from 'axios';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import {
    assignIssue,
    getAssignableUsers,
    unassignIssue,
    type AssignableUser,
    type IssueAssignee,
} from '../api/issueAssignmentService';

type UseIssueAssignmentOptions = {
    issueId: number;
    initialAssignee: IssueAssignee | null | undefined;
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

export function useIssueAssignment({
    issueId,
    initialAssignee,
}: UseIssueAssignmentOptions) {
    const [assignee, setAssignee] = useState<IssueAssignee | null>(
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
            const fetched = await getAssignableUsers(issueId);
            setUsers(fetched);
            setUsersLoaded(true);
        } catch (error) {
            toast.error(readErrorMessage(error, 'Failed to load users.'));
        } finally {
            setLoadingUsers(false);
        }
    }, [issueId, loadingUsers, usersLoaded]);

    const assign = useCallback(
        async (user: AssignableUser) => {
            setSubmitting(true);
            try {
                const result = await assignIssue(issueId, user.id);
                setAssignee(result.assignee);
                toast.success(`Assigned to ${user.name}.`);
                router.reload({ only: ['issue'] });
            } catch (error) {
                toast.error(readErrorMessage(error, 'Failed to assign user.'));
            } finally {
                setSubmitting(false);
            }
        },
        [issueId],
    );

    const unassign = useCallback(async () => {
        setSubmitting(true);
        try {
            await unassignIssue(issueId);
            setAssignee(null);
            toast.success('Assignee cleared.');
            router.reload({ only: ['issue'] });
        } catch (error) {
            toast.error(readErrorMessage(error, 'Failed to clear assignee.'));
        } finally {
            setSubmitting(false);
        }
    }, [issueId]);

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

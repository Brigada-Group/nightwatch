import type { ExceptionAssignee } from '@/entities';
import { webApi } from '@/shared/api/client';

export type AssignableUser = {
    id: number;
    name: string;
    email: string;
};

type AssignableUsersResponse = {
    data: AssignableUser[];
};

type AssignResponse = {
    data: {
        id: number;
        assigned_at: string | null;
        assignee: ExceptionAssignee | null;
    };
};

export async function getAssignableUsers(
    exceptionId: number,
): Promise<AssignableUser[]> {
    const { data } = await webApi.get<AssignableUsersResponse>(
        `/exceptions/${exceptionId}/assignable-users`,
    );

    return data.data;
}

export async function assignException(
    exceptionId: number,
    userId: number,
): Promise<AssignResponse['data']> {
    const { data } = await webApi.post<AssignResponse>(
        `/exceptions/${exceptionId}/assign`,
        { user_id: userId },
    );

    return data.data;
}

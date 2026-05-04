import { webApi } from '@/shared/api/client';

export type AssignableUser = {
    id: number;
    name: string;
    email: string;
};

export type IssueAssignee = {
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
        assignee: IssueAssignee | null;
    };
};

export async function getAssignableUsers(
    issueId: number,
): Promise<AssignableUser[]> {
    const { data } = await webApi.get<AssignableUsersResponse>(
        `/issues/${issueId}/assignable-users`,
    );
    return data.data;
}

export async function assignIssue(
    issueId: number,
    userId: number,
): Promise<AssignResponse['data']> {
    const { data } = await webApi.post<AssignResponse>(
        `/issues/${issueId}/assign`,
        { user_id: userId },
    );
    return data.data;
}

export async function unassignIssue(
    issueId: number,
): Promise<AssignResponse['data']> {
    const { data } = await webApi.delete<AssignResponse>(
        `/issues/${issueId}/assign`,
    );
    return data.data;
}

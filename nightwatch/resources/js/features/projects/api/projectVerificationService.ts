import { webApi } from '@/shared/api/client';

export type StartVerificationResponse = {
    project_uuid: string;
    token: string;
    expires_at: string;
    ttl_seconds: number;
    command: string;
};

export async function startProjectVerification(
    projectUuid: string,
): Promise<StartVerificationResponse> {
    const { data } = await webApi.post<{ data: StartVerificationResponse }>(
        `/projects/${projectUuid}/start-verification`,
    );
    return data.data;
}

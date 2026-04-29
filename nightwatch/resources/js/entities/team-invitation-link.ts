export type TeamInvitationLink = {
    id: number;
    team_id: number;
    role_id: number;
    project_ids: number[] | null;
    join_url: string | null;
    token_prefix: string;
    max_uses: number | null;
    uses_count: number;
    revoked_at: string | null;
    last_used_at: string | null;
    expires_at: string;
    created_at?: string | null;
    updated_at?: string | null;
    role: {
        id: number;
        slug: string;
        name: string;
    };
};

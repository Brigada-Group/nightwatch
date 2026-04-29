export type TeamRosterMember = {
    id: number;
    status: string;
    joined_at: string | null;
    user: {
        id: number;
        name: string;
        email: string;
    };
    role: {
        id: number;
        slug: string;
        name: string;
    } | null;
    assigned_projects: { id: number; name: string }[];
};

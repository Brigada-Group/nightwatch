import type { TeamInvitationLink } from '@/entities';

export type TeamProjectOption = {
    id: number;
    name: string;
};

export type InvitationLinkCreatedFlash = {
    join_url: string;
    plain_token: string;
} | null;

export type TeamInvitationLinksPageProps = {
    invitationLinks: TeamInvitationLink[];
    teamProjects: TeamProjectOption[];
    flash?: {
        invitationLinkCreated?: InvitationLinkCreatedFlash;
    };
};

export type CreateInvitationLinkFormFields = {
    role_slug: string;
    expires_in_days: number;
    max_uses: string;
    notify_emails: string[];
};

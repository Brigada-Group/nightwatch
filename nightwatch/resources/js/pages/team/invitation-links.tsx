import { Head, usePage } from '@inertiajs/react';
import { ResourcePageHeader } from '@/components/monitoring/resource-page-header';
import { InvitationLinkCreatedDialog } from '@/features/teams/components/invitation-link-created-dialog';
import { CreateInvitationLinkDialog } from '@/features/teams/invitation-links/CreateInvitationLinkDialog';
import { InvitationLinksFootnote } from '@/features/teams/invitation-links/InvitationLinksFootnote';
import { InvitationLinksTable } from '@/features/teams/invitation-links/InvitationLinksTable';
import type { TeamInvitationLinksPageProps } from '@/features/teams/invitation-links/types';

export default function TeamInvitationLinksPage() {
    const { invitationLinks, teamProjects, flash } =
        usePage<TeamInvitationLinksPageProps>().props;
    const createdPayload = flash?.invitationLinkCreated ?? null;

    return (
        <>
            <Head title="Invitation links" />
            <InvitationLinkCreatedDialog payload={createdPayload} />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <ResourcePageHeader
                    title="Invitation links"
                    description="Create shareable links to join this team with a fixed role. You can optionally pre-assign accepted members to specific projects (shown below). Anyone with the link can sign in and accept — treat links like passwords."
                    toolbar={
                        <CreateInvitationLinkDialog teamProjects={teamProjects} />
                    }
                />

                <InvitationLinksTable
                    invitationLinks={invitationLinks}
                    teamProjects={teamProjects}
                />

                <InvitationLinksFootnote />
            </div>
        </>
    );
}

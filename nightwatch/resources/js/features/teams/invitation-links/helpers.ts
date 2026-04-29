import { parseISO } from 'date-fns';
import type { TeamInvitationLink } from '@/entities';
import type { TeamProjectOption } from './types';

export function statusForLink(link: TeamInvitationLink): {
    label: string;
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
} {
    if (link.revoked_at) {
        return { label: 'Revoked', variant: 'destructive' };
    }

    const expires = parseISO(link.expires_at);

    if (Number.isNaN(expires.getTime()) || expires.getTime() < Date.now()) {
        return { label: 'Expired', variant: 'secondary' };
    }

    const maxUses = link.max_uses;

    if (maxUses !== null && link.uses_count >= maxUses) {
        return { label: 'Uses exhausted', variant: 'secondary' };
    }

    return { label: 'Active', variant: 'default' };
}

export function invitationLinkProjectLabels(
    link: TeamInvitationLink,
    projects: TeamProjectOption[],
): { id: number; label: string }[] {
    const ids = link.project_ids ?? [];

    return ids.map((id) => ({
        id,
        label: projects.find((p) => p.id === id)?.name ?? `#${id}`,
    }));
}

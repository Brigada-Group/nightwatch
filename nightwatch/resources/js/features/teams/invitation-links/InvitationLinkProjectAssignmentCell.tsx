import { Layers } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { TeamInvitationLink } from '@/entities';
import { invitationLinkProjectLabels } from './helpers';
import type { TeamProjectOption } from './types';

type Props = {
    link: TeamInvitationLink;
    teamProjects: TeamProjectOption[];
};

export function InvitationLinkProjectAssignmentCell(props: Props) {
    const { link, teamProjects } = props;
    const items = invitationLinkProjectLabels(link, teamProjects);

    if (items.length === 0) {
        return (
            <div className="max-w-[16rem]">
                <Badge
                    variant="secondary"
                    className="pointer-events-none mb-1 h-auto border py-0.5 align-middle text-[11px] font-normal leading-tight text-muted-foreground"
                >
                    Team only
                </Badge>
                <p className="text-muted-foreground whitespace-normal text-[11px] leading-relaxed">
                    No projects — joins the team without automatic assignment.
                </p>
            </div>
        );
    }

    return (
        <div className="max-w-[16rem] min-w-[8rem]">
            <div className="text-foreground mb-1 flex items-start gap-1.5 text-[11px] font-medium leading-snug tracking-tight">
                <Layers className="text-primary mt-px size-3 shrink-0" aria-hidden />
                <span className="break-words">
                    Pre-assigns to{' '}
                    {items.length === 1
                        ? 'this project:'
                        : `${items.length} projects:`}
                </span>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-0.5">
                {items.map(({ id, label }) => (
                    <Badge
                        key={id}
                        variant="outline"
                        className="h-auto whitespace-normal px-2 py-0.5 text-[11px] font-normal leading-tight text-foreground"
                    >
                        {label}
                    </Badge>
                ))}
            </div>
        </div>
    );
}

import { Link as LinkIcon } from 'lucide-react';

export function InvitationLinksFootnote() {
    return (
        <p className="text-muted-foreground flex items-start gap-2 text-xs leading-relaxed">
            <LinkIcon className="mt-0.5 size-4 shrink-0" />
            <span>
                Join links consume a use when someone who is not yet a member
                accepts. Already-active members visiting the link are not
                counted as extra uses.{' '}
                <span className="text-foreground/90 font-medium">
                    Revoked links can be removed from the table (Remove from
                    list): this only hides the row — team access is unchanged
                    for people already joined.
                </span>
            </span>
        </p>
    );
}

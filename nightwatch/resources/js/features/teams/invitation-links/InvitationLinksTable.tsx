import { router } from '@inertiajs/react';
import { formatDistanceToNowStrict, parseISO } from 'date-fns';
import {
    ClipboardCopy,
    Infinity as InfinityIcon,
    Trash2,
    X,
} from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';
import { monitoringCardClass } from '@/components/monitoring/monitoring-surface';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import type { TeamInvitationLink } from '@/entities';
import { copyTextToClipboard } from '@/lib/copy-to-clipboard';
import { cn } from '@/lib/utils';
import { statusForLink } from './helpers';
import { InvitationLinkProjectAssignmentCell } from './InvitationLinkProjectAssignmentCell';
import type { TeamProjectOption } from './types';

type Props = {
    invitationLinks: TeamInvitationLink[];
    teamProjects: TeamProjectOption[];
};

function resolveJoinUrl(link: TeamInvitationLink): string | null {
    const raw = link as TeamInvitationLink & { joinUrl?: string | null };
    const candidate =
        typeof link.join_url === 'string'
            ? link.join_url
            : typeof raw.joinUrl === 'string'
              ? raw.joinUrl
              : null;

    if (candidate !== null && candidate.trim() !== '') {
        return candidate;
    }

    return null;
}

export function InvitationLinksTable(props: Props) {
    const { invitationLinks, teamProjects } = props;

    const [revokingId, setRevokingId] = React.useState<number | null>(null);
    const [purgingId, setPurgingId] = React.useState<number | null>(null);

    const revoke = (link: TeamInvitationLink) => {
        setRevokingId(link.id);
        router.delete(`/team/invitation-links/${link.id}`, {
            preserveScroll: true,
            onFinish: () => setRevokingId(null),
        });
    };

    const purgeRevokedFromList = (link: TeamInvitationLink) => {
        setPurgingId(link.id);
        router.delete(`/team/invitation-links/${link.id}/purge`, {
            preserveScroll: true,
            onFinish: () => setPurgingId(null),
        });
    };

    const copyJoinUrl = async (link: TeamInvitationLink) => {
        const url = resolveJoinUrl(link);

        if (!url) {
            toast.error(
                'This link cannot be copied (created before copy was available). Create a new link instead.',
            );

            return;
        }

        const copied = await copyTextToClipboard(url);

        if (copied) {
            toast.success('Join link copied to clipboard.');
        } else {
            toast.error(
                'Could not copy to clipboard. Try HTTPS or paste from the address bar.',
            );
        }
    };

    return (
        <Card className={cn(monitoringCardClass, 'gap-0 py-0')}>
            <CardContent className="p-0 pt-4">
                <Table className="text-xs">
                    <colgroup>
                        <col className="w-[10%]" />
                        <col className="w-[12%]" />
                        <col className="w-[14%]" />
                        <col className="w-[10%]" />
                        <col className="min-w-[12rem]" />
                        <col className="w-[12%]" />
                        <col className="w-[7%]" />
                        <col className="w-[10%]" />
                    </colgroup>
                    <TableHeader>
                        <TableRow className="border-b border-border/80 hover:bg-transparent">
                            <TableHead className="h-auto py-3 pl-5 pr-3 text-[11px] font-semibold leading-tight tracking-tight text-muted-foreground sm:pl-6">
                                Role
                            </TableHead>
                            <TableHead className="h-auto px-3 py-3 text-[11px] font-semibold leading-tight tracking-tight text-muted-foreground">
                                Prefix
                            </TableHead>
                            <TableHead className="h-auto px-3 py-3 text-[11px] font-semibold leading-tight tracking-tight text-muted-foreground">
                                Expires
                            </TableHead>
                            <TableHead className="h-auto px-3 py-3 text-[11px] font-semibold leading-tight tracking-tight text-muted-foreground">
                                Uses
                            </TableHead>
                            <TableHead className="min-w-[12rem] max-w-xl px-3 py-3 text-[11px] font-semibold leading-tight tracking-tight text-muted-foreground whitespace-normal md:min-w-[14rem]">
                                <span className="block">Project assignment</span>
                                <span className="mt-1 block font-normal text-[10px] leading-snug opacity-95">
                                    On accept: linked projects vs team-only
                                </span>
                            </TableHead>
                            <TableHead className="h-auto px-3 py-3 text-[11px] font-semibold leading-tight tracking-tight text-muted-foreground">
                                Status
                            </TableHead>
                            <TableHead className="h-auto px-2 py-3 text-center text-[11px] font-semibold leading-tight tracking-tight text-muted-foreground">
                                Copy
                            </TableHead>
                            <TableHead className="h-auto py-3 pl-3 pr-5 text-right text-[11px] font-semibold leading-tight tracking-tight text-muted-foreground sm:pr-6">
                                Actions
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {invitationLinks.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={8}
                                    className="text-muted-foreground py-12 text-center text-xs leading-relaxed"
                                >
                                    No invitation links yet. Create one to
                                    share a join URL with your team.
                                </TableCell>
                            </TableRow>
                        ) : (
                            invitationLinks.map((link) => {
                                const joinUrl = resolveJoinUrl(link);
                                const status = statusForLink(link);
                                const expires = parseISO(link.expires_at);
                                const expiredLabel = Number.isNaN(
                                    expires.getTime(),
                                )
                                    ? '—'
                                    : formatDistanceToNowStrict(expires, {
                                          addSuffix: true,
                                      });

                                return (
                                    <TableRow
                                        key={link.id}
                                        className="border-border/70 align-top hover:bg-muted/40"
                                    >
                                        <TableCell className="py-4 pl-5 pr-3 align-top text-[13px] font-medium leading-snug text-foreground whitespace-normal">
                                            <span className="break-words">
                                                {link.role.name}
                                            </span>
                                        </TableCell>
                                        <TableCell className="whitespace-normal px-3 py-4 align-top">
                                            <code className="inline-block max-w-[8.5rem] truncate rounded-md bg-muted/80 px-2 py-1 align-middle font-mono text-[11px] tracking-tight text-foreground md:max-w-[9.5rem]">
                                                {link.token_prefix}
                                                …
                                            </code>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground whitespace-normal px-3 py-4 align-top text-[13px] leading-snug md:leading-relaxed">
                                            {expiredLabel}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground px-3 py-4 align-top tabular-nums text-[13px]">
                                            <span className="text-foreground tabular-nums">
                                                {link.uses_count}
                                            </span>
                                            {link.max_uses === null ? (
                                                <span className="text-muted-foreground ml-2 inline-flex items-center gap-1">
                                                    <InfinityIcon className="size-3.5 shrink-0 opacity-70" />
                                                </span>
                                            ) : (
                                                <>
                                                    <span className="text-muted-foreground mx-2">
                                                        /
                                                    </span>
                                                    <span className="tabular-nums">
                                                        {link.max_uses}
                                                    </span>
                                                </>
                                            )}
                                        </TableCell>
                                        <TableCell className="border-border/40 border-l px-5 py-4 whitespace-normal align-top lg:px-6">
                                            <InvitationLinkProjectAssignmentCell
                                                link={link}
                                                teamProjects={teamProjects}
                                            />
                                        </TableCell>
                                        <TableCell className="whitespace-nowrap px-3 py-4 align-top">
                                            <Badge
                                                variant={status.variant}
                                                className="px-2.5 py-0.5 text-[11px] font-medium leading-normal"
                                            >
                                                {status.label}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="relative px-2 py-4 text-center align-top">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                aria-disabled={joinUrl === null}
                                                aria-label="Copy join link"
                                                tabIndex={joinUrl === null ? -1 : 0}
                                                title={
                                                    joinUrl !== null
                                                        ? 'Copy full join link'
                                                        : 'Link not available to copy (legacy row)'
                                                }
                                                className={cn(
                                                    'relative z-[2] shrink-0 [&_svg]:pointer-events-none',
                                                    joinUrl === null
                                                        ? 'cursor-not-allowed opacity-40 hover:bg-transparent hover:text-muted-foreground'
                                                        : 'cursor-pointer text-muted-foreground hover:bg-accent hover:text-foreground',
                                                )}
                                                onClick={() =>
                                                    void copyJoinUrl(link)
                                                }
                                            >
                                                <ClipboardCopy className="size-4 shrink-0 cursor-pointer" />
                                            </Button>
                                        </TableCell>
                                        <TableCell className="py-4 pl-3 pr-5 text-right align-top xl:pr-6">
                                            {!link.revoked_at ? (
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-destructive hover:text-destructive"
                                                            disabled={
                                                                revokingId ===
                                                                link.id
                                                            }
                                                            aria-label="Revoke link"
                                                        >
                                                            <Trash2 className="size-4" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>
                                                                Revoke this link?
                                                            </AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                The link will stop
                                                                working immediately.
                                                                People who already
                                                                joined keep their
                                                                access.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>
                                                                Cancel
                                                            </AlertDialogCancel>
                                                            <AlertDialogAction
                                                                onClick={() =>
                                                                    revoke(link)
                                                                }
                                                            >
                                                                Revoke
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            ) : (
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-muted-foreground hover:text-destructive"
                                                            disabled={
                                                                purgingId ===
                                                                link.id
                                                            }
                                                            aria-label="Remove revoked link from list"
                                                        >
                                                            <X className="size-4" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>
                                                                Remove from list?
                                                            </AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                This deletes the
                                                                revoked link from your
                                                                table so the list stays
                                                                tidy. Existing team
                                                                members keep their access.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>
                                                                Cancel
                                                            </AlertDialogCancel>
                                                            <AlertDialogAction
                                                                onClick={() =>
                                                                    purgeRevokedFromList(
                                                                        link,
                                                                    )
                                                                }
                                                            >
                                                                Remove from list
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

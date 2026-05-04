import { ChevronDown, UserCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useIssueAssignment } from '../hooks/useIssueAssignment';
import type { IssueAssignee } from '../api/issueAssignmentService';

type Props = {
    issueId: number;
    assignee: IssueAssignee | null | undefined;
};

export function IssueAssigneeCell({ issueId, assignee }: Props) {
    const {
        assignee: current,
        users,
        loadingUsers,
        submitting,
        loadUsers,
        assign,
        unassign,
    } = useIssueAssignment({ issueId, initialAssignee: assignee });

    return (
        <DropdownMenu
            onOpenChange={(open) => {
                if (open) {
                    void loadUsers();
                }
            }}
        >
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    disabled={submitting}
                    className="h-8 max-w-[260px] justify-between gap-2 truncate text-xs font-normal"
                >
                    <span className="flex min-w-0 items-center gap-1.5">
                        <UserCircle className="size-3.5 shrink-0" />
                        <span className="truncate">
                            {current ? current.name : 'Unassigned'}
                        </span>
                    </span>
                    <ChevronDown className="size-3.5 shrink-0 opacity-60" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[240px]">
                <DropdownMenuLabel className="text-muted-foreground text-xs">
                    Assign to
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {loadingUsers ? (
                    <div className="text-muted-foreground px-2 py-3 text-center text-xs">
                        Loading…
                    </div>
                ) : users.length === 0 ? (
                    <div className="text-muted-foreground px-2 py-3 text-center text-xs">
                        No eligible team members.
                    </div>
                ) : (
                    users.map((user) => (
                        <DropdownMenuItem
                            key={user.id}
                            disabled={submitting || user.id === current?.id}
                            onSelect={(event) => {
                                event.preventDefault();
                                void assign(user);
                            }}
                            className="flex flex-col items-start gap-0.5"
                        >
                            <span className="text-sm">{user.name}</span>
                            <span className="text-muted-foreground text-xs">
                                {user.email}
                            </span>
                        </DropdownMenuItem>
                    ))
                )}
                {current ? (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            disabled={submitting}
                            onSelect={(event) => {
                                event.preventDefault();
                                void unassign();
                            }}
                            className="text-destructive focus:text-destructive flex items-center gap-2"
                        >
                            <X className="size-3.5" />
                            <span className="text-sm">Unassign</span>
                        </DropdownMenuItem>
                    </>
                ) : null}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

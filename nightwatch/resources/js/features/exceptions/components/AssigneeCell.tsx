import { ChevronDown, UserCircle } from 'lucide-react';
import type { ExceptionAssignee } from '@/entities';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useExceptionAssignment } from '../hooks/useExceptionAssignment';

type AssigneeCellProps = {
    exceptionId: number;
    assignee: ExceptionAssignee | null | undefined;
};

export function AssigneeCell({ exceptionId, assignee }: AssigneeCellProps) {
    const {
        assignee: current,
        users,
        loadingUsers,
        submitting,
        loadUsers,
        assign,
    } = useExceptionAssignment({ exceptionId, initialAssignee: assignee });

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
                    className="h-8 max-w-[200px] justify-between gap-2 truncate text-xs font-normal"
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
            <DropdownMenuContent align="end" className="min-w-[220px]">
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
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

import { router, usePage } from '@inertiajs/react';
import { Check, ChevronsUpDown, Users } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

type TeamSummary = {
    id: number;
    name: string;
    slug: string;
    role: string | null;
};

type TeamContext = {
    current: (TeamSummary & { can_manage_team_projects: boolean }) | null;
    teams: TeamSummary[];
};

type PageProps = {
    teamContext?: TeamContext;
};

/**
 * Compact dropdown that shows the user's currently active team and lets them
 * switch to any other team they belong to. Renders nothing if the user has
 * fewer than two teams (no point showing a single-item dropdown).
 *
 * The switch itself is a POST to /teams/{id}/switch — backend already wired
 * via TeamsController::switch + CurrentTeam service. We use router.visit so
 * Inertia refreshes shared props (auth, teamContext) afterward, which makes
 * the rest of the UI re-render with the new team's scope automatically.
 */
export function TeamSwitcher() {
    const { teamContext } = usePage<PageProps>().props;
    const sidebar = useSidebar();
    const [submittingId, setSubmittingId] = useState<number | null>(null);

    const current = teamContext?.current ?? null;
    const teams = teamContext?.teams ?? [];

    if (current === null || teams.length < 2) {
        return null;
    }

    const switchTo = (team: TeamSummary) => {
        if (team.id === current.id || submittingId !== null) {
            return;
        }

        setSubmittingId(team.id);
        router.post(
            `/teams/${team.id}/switch`,
            {},
            {
                preserveScroll: true,
                onError: () => toast.error('Failed to switch team.'),
                onSuccess: () => {
                    // Force a hard reload so every prop on the current page
                    // (kanban, dashboard widgets, sidebar counts) refetches
                    // under the new team scope. Inertia's partial reload
                    // would leave any prop the team switch doesn't touch.
                    window.location.reload();
                },
                onFinish: () => setSubmittingId(null),
            },
        );
    };

    const isCollapsed = sidebar.state === 'collapsed';

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                            size="lg"
                            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                        >
                            <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 shrink-0 items-center justify-center rounded-md">
                                <Users className="size-4" />
                            </div>
                            <div
                                className={cn(
                                    'grid flex-1 text-left text-sm leading-tight',
                                    isCollapsed && 'sr-only',
                                )}
                            >
                                <span className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider">
                                    Team
                                </span>
                                <span className="truncate font-semibold">
                                    {current.name}
                                </span>
                            </div>
                            <ChevronsUpDown
                                className={cn(
                                    'ml-auto size-4 opacity-60',
                                    isCollapsed && 'sr-only',
                                )}
                            />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        align="start"
                        side="right"
                        sideOffset={8}
                        className="min-w-[240px]"
                    >
                        <DropdownMenuLabel className="text-muted-foreground text-xs">
                            Your teams
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {teams.map((team) => {
                            const isCurrent = team.id === current.id;
                            const isSubmitting = submittingId === team.id;

                            return (
                                <DropdownMenuItem
                                    key={team.id}
                                    disabled={isSubmitting || submittingId !== null}
                                    onSelect={(event) => {
                                        event.preventDefault();
                                        switchTo(team);
                                    }}
                                    className="flex items-start gap-2"
                                >
                                    <div className="flex size-4 shrink-0 items-center justify-center pt-0.5">
                                        {isCurrent ? (
                                            <Check className="text-primary size-4" />
                                        ) : null}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium">
                                            {team.name}
                                        </p>
                                        {team.role ? (
                                            <p className="text-muted-foreground text-xs capitalize">
                                                {team.role.replace('_', ' ')}
                                            </p>
                                        ) : null}
                                    </div>
                                </DropdownMenuItem>
                            );
                        })}
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}

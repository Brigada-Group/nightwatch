import { Link, usePage } from '@inertiajs/react';
import {
    Activity,
    BarChart3,
    Bot,
    Bug,
    Building2,
    Github,
    CheckCircle2,
    Clock,
    Database,
    Bell,
    Globe,
    HeartPulse,
    LayoutGrid,
    ListChecks,
    Link2,
    Mail,
    MailPlus,
    MonitorSmartphone,
    MessageSquare,
    Plug,
    PackageCheck,
    ScrollText,
    Server,
    ShieldCheck,
    Terminal,
    Users,
    Webhook,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { TeamSwitcher } from '@/components/team-switcher';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import type { NavItem } from '@/types';

const overviewItemsBase: NavItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutGrid,
    },
    {
        title: 'Projects',
        href: '/projects',
        icon: Server,
    },
    {
        title: 'Tasks',
        href: '/tasks',
        icon: CheckCircle2,
    },
];

const teamManagementItem: NavItem = {
    title: 'Team',
    href: '/team',
    icon: Users,
};

const invitationLinksItem: NavItem = {
    title: 'Invitation links',
    href: '/team/invitation-links',
    icon: Link2,
};

const monitoringItems: NavItem[] = [
    {
        title: 'Insights',
        href: '/insights',
        icon: BarChart3,
    },
    {
        title: 'Exceptions',
        href: '/exceptions',
        icon: Bug,
    },
    {
        title: 'Issues',
        href: '/issues',
        icon: ListChecks,
    },
    {
        title: 'Requests',
        href: '/hub-requests',
        icon: Globe,
    },
    {
        title: 'Queries',
        href: '/queries',
        icon: Database,
    },
    {
        title: 'Jobs',
        href: '/jobs',
        icon: PackageCheck,
    },
    {
        title: 'Logs',
        href: '/logs',
        icon: ScrollText,
    },
    {
        title: 'Outgoing HTTP',
        href: '/outgoing-http',
        icon: Activity,
    },
];

const clientSideItems: NavItem[] = [
    {
        title: 'Client Errors',
        href: '/client-errors',
        icon: MonitorSmartphone,
    },
];

const aiConfigItems: NavItem[] = [
    {
        title: 'AI Config',
        href: '/ai-config',
        icon: Bot,
    },
];

const integrationItems: NavItem[] = [
    {
        title: 'GitHub',
        href: '/integrations/github',
        icon: Github,
    },
];

const systemItemsBase: NavItem[] = [
    {
        title: 'Mail',
        href: '/mail',
        icon: Mail,
    },
    {
        title: 'Notifications',
        href: '/notifications',
        icon: MessageSquare,
    },
    {
        title: 'Cache',
        href: '/cache',
        icon: Database,
    },
    {
        title: 'Commands',
        href: '/commands',
        icon: Terminal,
    },
    {
        title: 'Scheduled Tasks',
        href: '/scheduled-tasks',
        icon: Clock,
    },
    {
        title: 'Health Checks',
        href: '/health-checks',
        icon: HeartPulse,
    },
    {
        title: 'Audits',
        href: '/audits',
        icon: ShieldCheck,
    },
];

const managerSystemItems: NavItem[] = [
    {
        title: 'Email Reports',
        href: '/email-reports',
        icon: MailPlus,
    },
    {
        title: 'Webhooks',
        href: '/webhooks',
        icon: Webhook,
    },
    {
        title: 'Alert rules',
        href: '/alert-rules',
        icon: Bell,
    },
];

export function AppSidebar() {
    const page = usePage<{
        auth?: { user?: { is_super_admin?: boolean } };
        teamContext?: {
            current?: {
                role?: string | null;
                can_manage_team_projects?: boolean;
            } | null;
        };
    }>();
    const { auth } = page.props;
    const currentPath = page.url.split('?')[0];
    const isSuperAdmin = Boolean(auth?.user?.is_super_admin);
    const isSuperAdminRoute = currentPath.startsWith('/super-admin');

    const canManageTeamInvitations =
        page.props.teamContext?.current?.can_manage_team_projects === true ||
        page.props.teamContext?.current?.role === 'admin' ||
        page.props.teamContext?.current?.role === 'project_manager';

    const overviewItems: NavItem[] = [...overviewItemsBase];

    if (canManageTeamInvitations) {
        overviewItems.push(teamManagementItem, invitationLinksItem);
    }

    const systemItems: NavItem[] = canManageTeamInvitations
        ? [...systemItemsBase, ...managerSystemItems]
        : systemItemsBase;

    const superAdminItems: NavItem[] = [
        {
            title: 'Platform',
            href: '/super-admin/dashboard',
            icon: LayoutGrid,
        },
        {
            title: 'Teams',
            href: '/super-admin/teams',
            icon: Building2,
        },
        {
            title: 'Dependencies',
            href: '/super-admin/external-dependencies',
            icon: Plug,
        },
        {
            title: 'Retention Config',
            href: '/super-admin/retention-config',
            icon: Database,
        },
    ];

    return (
        <Sidebar collapsible="icon" variant="sidebar">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={isSuperAdminRoute ? '/super-admin/dashboard' : '/dashboard'} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
                {isSuperAdminRoute && isSuperAdmin ? null : <TeamSwitcher />}
            </SidebarHeader>

            <SidebarContent>
                {isSuperAdminRoute && isSuperAdmin ? (
                    <NavMain items={superAdminItems} label="Super Admin" />
                ) : (
                    <>
                        <NavMain items={overviewItems} label="Overview" />
                        <NavMain items={monitoringItems} label="Monitoring" />
                        <NavMain items={clientSideItems} label="Client-side" />
                        <NavMain items={systemItems} label="System" />
                        {canManageTeamInvitations ? (
                            <NavMain items={aiConfigItems} label="AI Config" />
                        ) : null}
                        {canManageTeamInvitations ? (
                            <NavMain
                                items={integrationItems}
                                label="Integrations"
                            />
                        ) : null}
                    </>
                )}
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}

import { Link } from '@inertiajs/react';
import {
    Activity,
    AlertTriangle,
    BarChart3,
    BookOpen,
    Clock,
    Database,
    FolderGit2,
    Globe,
    HeartPulse,
    LayoutGrid,
    Mail,
    MailPlus,
    MessageSquare,
    PackageCheck,
    ScrollText,
    Server,
    Settings,
    ShieldCheck,
    Terminal,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import type { NavItem } from '@/types';

const overviewItems: NavItem[] = [
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
];

const monitoringItems: NavItem[] = [
    {
        title: 'Insights',
        href: '/insights',
        icon: BarChart3,
    },
    {
        title: 'Exceptions',
        href: '/exceptions',
        icon: AlertTriangle,
    },
    {
        title: 'Client Errors',
        href: '/client-errors',
        icon: AlertTriangle,
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

const systemItems: NavItem[] = [
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
    {
        title: 'Email Reports',
        href: '/email-reports',
        icon: MailPlus,
    },
];

const footerNavItems: NavItem[] = [
    {
        title: 'Settings',
        href: '/settings/profile',
        icon: Settings,
    },
    {
        title: 'Documentation',
        href: 'https://github.com/Brigada-Group/nightwatch',
        icon: BookOpen,
    },
];

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" variant="sidebar">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/dashboard" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={overviewItems} label="Overview" />
                <NavMain items={monitoringItems} label="Monitoring" />
                <NavMain items={systemItems} label="System" />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}

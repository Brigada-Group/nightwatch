import { Head, Link, router, usePage } from '@inertiajs/react';
import { ExternalLink, Link2 } from 'lucide-react';
import { InertiaPagination } from '@/components/monitoring/inertia-pagination';
import { monitoringCardClass } from '@/components/monitoring/monitoring-surface';
import { ResourcePageHeader } from '@/components/monitoring/resource-page-header';
import { ToneChip } from '@/components/monitoring/tone-chip';
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
import type {
    PaginatedResponse,
    Project,
    ProjectCredentials,
    ProjectStatus,
} from '@/entities';
import {
    ConnectionStatusBadge,
    type ConnectionStatus,
} from '@/features/projects/components/ConnectionStatusBadge';
import { CreateProjectDialog } from '@/features/projects/components/create-project-dialog';
import { CredentialsRevealDialog } from '@/features/projects/components/credentials-reveal-dialog';
import { cn } from '@/lib/utils';

type TeamContext = {
    current: {
        role: string | null;
        can_manage_team_projects?: boolean;
    } | null;
};

type PageProps = {
    projects: PaginatedResponse<Project>;
    flash?: {
        projectCredentials?: ProjectCredentials | null;
    };
    hubUrl?: string;
    teamContext?: TeamContext;
};

export default function ProjectsIndex() {
    const { projects, flash, hubUrl, teamContext } = usePage<PageProps>().props;
    const credentials = flash?.projectCredentials ?? null;
    const canInviteMembers =
        teamContext?.current?.can_manage_team_projects === true ||
        teamContext?.current?.role === 'admin' ||
        teamContext?.current?.role === 'project_manager';
    const resolvedHubUrl =
        hubUrl ??
        (typeof window !== 'undefined' ? window.location.origin : 'https://your-hub.example');

    return (
        <>
            <Head title="Projects" />
            <CredentialsRevealDialog
                credentials={credentials}
                hubUrl={resolvedHubUrl}
            />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <ResourcePageHeader
                    title="Projects"
                    description="Connected applications reporting telemetry to Nightwatch. Open a row for a full telemetry dossier."
                    toolbar={
                        <div className="flex items-center gap-2">
                            {canInviteMembers ? (
                                <Button variant="outline" asChild>
                                    <Link
                                        href="/team/invitation-links"
                                        className="gap-2"
                                    >
                                        <Link2 className="size-4" />
                                        Invitation links
                                    </Link>
                                </Button>
                            ) : null}
                            <CreateProjectDialog />
                        </div>
                    }
                />
                <Card className={cn(monitoringCardClass, 'gap-0 py-0')}>
                    <CardContent className="p-0 pt-4">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Environment</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">
                                        Last heartbeat
                                    </TableHead>
                                    <TableHead className="w-[100px] text-right">
                                        Details
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {projects.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={5}
                                            className="text-muted-foreground py-10 text-center text-sm"
                                        >
                                            No projects yet. Click{' '}
                                            <span className="text-foreground font-medium">
                                                New project
                                            </span>{' '}
                                            to register one and copy its
                                            credentials.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    projects.data.map((p) => (
                                        <TableRow
                                            key={p.id}
                                            role="link"
                                            tabIndex={0}
                                            className="cursor-pointer"
                                            onClick={() =>
                                                router.visit(`/projects/${p.project_uuid}`)
                                            }
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' || e.key === ' ') {
                                                    e.preventDefault();
                                                    router.visit(`/projects/${p.project_uuid}`);
                                                }
                                            }}
                                        >
                                            <TableCell className="font-medium text-foreground">
                                                {p.name}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {p.environment}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <ToneChip
                                                        kind="projectStatus"
                                                        value={p.status as ProjectStatus}
                                                    />
                                                    <ConnectionStatusBadge
                                                        status={
                                                            ((p as unknown as { connection_status?: ConnectionStatus })
                                                                .connection_status ?? 'disconnected')
                                                        }
                                                    />
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-right text-xs">
                                                {p.last_heartbeat_at
                                                    ? new Date(
                                                          p.last_heartbeat_at,
                                                      ).toLocaleString()
                                                    : '—'}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    type="button"
                                                    variant="secondary"
                                                    size="sm"
                                                    className="gap-1"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        router.visit(`/projects/${p.project_uuid}`);
                                                    }}
                                                >
                                                    Open
                                                    <ExternalLink className="size-3.5 opacity-70" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                        <div className="border-border border-t p-4">
                            <InertiaPagination
                                path="/projects"
                                meta={projects}
                                filters={{
                                    per_page: projects.per_page,
                                }}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

ProjectsIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Projects', href: '/projects' },
    ],
};
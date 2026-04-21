import { Head, Link, router, usePage } from '@inertiajs/react';
import * as React from 'react';
import {
    Activity,
    ArrowLeft,
    Binary,
    Boxes,
    CalendarClock,
    Database,
    Globe,
    HeartPulse,
    Layers,
    Mail,
    RadioTower,
    ScrollText,
    Server,
    Terminal,
    Trash2,
    Webhook,
    Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import { ToneChip } from '@/components/monitoring/tone-chip';
import { monitoringCardClass } from '@/components/monitoring/monitoring-surface';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
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
import { pathWithQuery } from '@/lib/inertia-query';
import { cn } from '@/lib/utils';
import { ConnectGuideCard } from '@/features/projects/components/connect-guide-card';
import { CredentialsRevealDialog } from '@/features/projects/components/credentials-reveal-dialog';
import type {
    HubCache,
    HubCommand,
    HubException,
    HubHealthCheck,
    HubJob,
    HubLog,
    HubMail,
    HubNotification,
    HubOutgoingHttp,
    HubQuery,
    HubRequest,
    HubScheduledTask,
    Project,
    ProjectCredentials,
    ProjectStatus,
} from '@/entities';

type Counts = {
    exceptions: number;
    requests: number;
    queries: number;
    jobs: number;
    logs: number;
    outgoing_http: number;
    mails: number;
    notifications: number;
    caches: number;
    commands: number;
    scheduled_tasks: number;
    health_checks: number;
};

type Recent = {
    exceptions: HubException[];
    requests: HubRequest[];
    queries: HubQuery[];
    jobs: HubJob[];
    logs: HubLog[];
    outgoing_http: HubOutgoingHttp[];
    mails: HubMail[];
    notifications: HubNotification[];
    caches: HubCache[];
    commands: HubCommand[];
    scheduled_tasks: HubScheduledTask[];
    health_checks: HubHealthCheck[];
};

type PageProps = {
    project: Project;
    counts: Counts;
    recent: Recent;
    hubUrl?: string;
    flash?: {
        projectCredentials?: ProjectCredentials | null;
    };
};

const statTiles: {
    key: keyof Counts;
    label: string;
    path: string;
    icon: typeof Activity;
}[] = [
    { key: 'exceptions', label: 'Exceptions', path: '/exceptions', icon: Zap },
    { key: 'requests', label: 'HTTP requests', path: '/hub-requests', icon: Globe },
    { key: 'queries', label: 'Queries', path: '/queries', icon: Database },
    { key: 'jobs', label: 'Jobs', path: '/jobs', icon: Layers },
    { key: 'logs', label: 'Logs', path: '/logs', icon: ScrollText },
    { key: 'outgoing_http', label: 'Outgoing HTTP', path: '/outgoing-http', icon: RadioTower },
    { key: 'mails', label: 'Mail', path: '/mail', icon: Mail },
    { key: 'notifications', label: 'Notifications', path: '/notifications', icon: Webhook },
    { key: 'caches', label: 'Cache', path: '/cache', icon: Boxes },
    { key: 'commands', label: 'Commands', path: '/commands', icon: Terminal },
    { key: 'scheduled_tasks', label: 'Scheduled tasks', path: '/scheduled-tasks', icon: CalendarClock },
    { key: 'health_checks', label: 'Health checks', path: '/health-checks', icon: HeartPulse },
];

function fmt(dt: string | null): string {
    if (!dt) {
        return '—';
    }
    return new Date(dt).toLocaleString();
}

export default function ProjectShow() {
    const { project, counts, recent, flash, hubUrl } = usePage<PageProps>().props;
    const pid = project.id;
    const credentials = flash?.projectCredentials ?? null;
    const resolvedHubUrl =
        hubUrl ??
        (typeof window !== 'undefined' ? window.location.origin : 'https://your-hub.example');

    const [rotating, setRotating] = React.useState(false);
    const [deleting, setDeleting] = React.useState(false);

    const rotateToken = () => {
        router.post(
            `/projects/${project.id}/rotate-token`,
            {},
            {
                preserveScroll: true,
                onStart: () => setRotating(true),
                onFinish: () => setRotating(false),
            },
        );
    };

    const deleteProject = () => {
        router.delete(`/projects/${project.id}`, {
            onStart: () => setDeleting(true),
            onError: () => {
                setDeleting(false);
                toast.error('Failed to delete project');
            },
        });
    };

    return (
        <>
            <Head title={`${project.name} · Project`} />
            <CredentialsRevealDialog
                credentials={credentials}
                hubUrl={resolvedHubUrl}
            />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <Button variant="ghost" size="sm" className="w-fit gap-2 px-2" asChild>
                        <Link href="/projects">
                            <ArrowLeft className="size-4" />
                            Projects
                        </Link>
                    </Button>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="gap-2 text-rose-300 hover:bg-rose-500/10 hover:text-rose-200"
                                disabled={deleting}
                            >
                                <Trash2 className="size-4" />
                                Delete project
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="border-white/[0.08] bg-zinc-950/95 text-zinc-100 backdrop-blur-md">
                            <AlertDialogHeader>
                                <AlertDialogTitle className="text-white">
                                    Delete “{project.name}”?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                    This removes the project, its API token, and
                                    all associated telemetry. Guardian installs
                                    using this token will stop reporting until
                                    you re-register.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={deleteProject}
                                    className="bg-rose-500 text-white hover:bg-rose-400"
                                >
                                    Delete project
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>

                <div
                    className={cn(
                        'relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-violet-600/20 via-zinc-950/90 to-cyan-600/15 p-6 shadow-[0_32px_80px_-32px_rgba(0,0,0,0.9)] md:p-8',
                    )}
                >
                    <div className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-violet-500/20 blur-3xl" />
                    <div className="pointer-events-none absolute -bottom-20 -left-16 size-64 rounded-full bg-cyan-500/15 blur-3xl" />
                    <div className="relative flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                        <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                                <Server className="size-5 text-zinc-300" />
                                <span className="text-muted-foreground font-mono text-xs">
                                    #{project.id}
                                </span>
                                <ToneChip
                                    kind="projectStatus"
                                    value={project.status as ProjectStatus}
                                />
                            </div>
                            <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
                                {project.name}
                            </h1>
                            {project.description ? (
                                <p className="max-w-2xl text-sm text-zinc-300">
                                    {project.description}
                                </p>
                            ) : null}
                            <p className="text-muted-foreground max-w-2xl text-sm">
                                Environment{' '}
                                <span className="text-foreground font-medium">
                                    {project.environment}
                                </span>
                                {' · '}
                                UUID{' '}
                                <span className="font-mono text-xs text-zinc-400">
                                    {project.project_uuid}
                                </span>
                            </p>
                        </div>
                        <div className="text-muted-foreground flex flex-col gap-1 text-right text-xs md:text-sm">
                            <span>Last heartbeat</span>
                            <span className="text-foreground font-medium">
                                {fmt(project.last_heartbeat_at)}
                            </span>
                        </div>
                    </div>
                    {project.metadata &&
                    (project.metadata.php_version || project.metadata.laravel_version) ? (
                        <div className="relative mt-6 flex flex-wrap gap-3">
                            {project.metadata.php_version ? (
                                <span className="rounded-lg border border-white/10 bg-black/30 px-3 py-1.5 font-mono text-xs text-zinc-200 backdrop-blur-sm">
                                    PHP {project.metadata.php_version}
                                </span>
                            ) : null}
                            {project.metadata.laravel_version ? (
                                <span className="rounded-lg border border-white/10 bg-black/30 px-3 py-1.5 font-mono text-xs text-zinc-200 backdrop-blur-sm">
                                    Laravel {project.metadata.laravel_version}
                                </span>
                            ) : null}
                        </div>
                    ) : null}
                </div>

                <ConnectGuideCard
                    projectUuid={project.project_uuid}
                    apiTokenLastFour={project.api_token_last_four}
                    hubUrl={resolvedHubUrl}
                    onRotateToken={rotateToken}
                    rotating={rotating}
                />

                <div>
                    <h2 className="text-foreground mb-3 text-lg font-semibold tracking-tight">
                        Telemetry overview
                    </h2>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {statTiles.map(({ key, label, path, icon: Icon }) => (
                            <Link
                                key={key}
                                href={pathWithQuery(path, { project_id: pid })}
                                className="group block"
                            >
                                <Card
                                    className={cn(
                                        monitoringCardClass,
                                        'h-full gap-0 py-0 transition-transform duration-200 hover:-translate-y-0.5',
                                    )}
                                >
                                    <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2 pt-5">
                                        <div>
                                            <CardDescription className="text-zinc-400">
                                                {label}
                                            </CardDescription>
                                            <CardTitle className="mt-1 text-2xl tabular-nums text-white">
                                                {counts[key].toLocaleString()}
                                            </CardTitle>
                                        </div>
                                        <div className="rounded-xl border border-white/10 bg-white/[0.06] p-2.5 text-violet-200 transition-colors group-hover:bg-violet-500/15 group-hover:text-violet-100">
                                            <Icon className="size-5" />
                                        </div>
                                    </CardHeader>
                                    <CardContent className="text-muted-foreground pb-4 text-xs">
                                        Open filtered list →
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                </div>

                <div>
                    <h2 className="text-foreground mb-3 flex items-center gap-2 text-lg font-semibold tracking-tight">
                        <Binary className="size-5 text-cyan-300/80" />
                        Recent activity
                    </h2>
                    <div className="grid gap-4 lg:grid-cols-2">
                        <RecentCard title="Latest exceptions" empty="No exceptions yet.">
                            {recent.exceptions.map((row) => (
                                <div
                                    key={row.id}
                                    className="border-border/40 flex flex-col gap-1 border-b py-3 last:border-0"
                                >
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <span className="truncate font-mono text-xs text-zinc-200">
                                            {row.exception_class}
                                        </span>
                                        <ToneChip kind="severity" value={row.severity} />
                                    </div>
                                    <p className="text-muted-foreground line-clamp-2 text-xs">
                                        {row.message}
                                    </p>
                                    <span className="text-muted-foreground text-[10px]">
                                        {fmt(row.sent_at)}
                                    </span>
                                </div>
                            ))}
                        </RecentCard>

                        <RecentCard title="Latest requests" empty="No requests yet.">
                            {recent.requests.map((row) => (
                                <div
                                    key={row.id}
                                    className="border-border/40 flex flex-wrap items-center justify-between gap-2 border-b py-3 last:border-0"
                                >
                                    <div className="flex min-w-0 flex-1 items-center gap-2">
                                        <ToneChip kind="httpMethod" value={row.method} />
                                        <span className="truncate font-mono text-xs text-zinc-300">
                                            {row.uri}
                                        </span>
                                    </div>
                                    <ToneChip kind="httpStatus" value={row.status_code} />
                                </div>
                            ))}
                        </RecentCard>

                        <RecentCard title="Latest queries" empty="No queries yet.">
                            {recent.queries.map((row) => (
                                <div
                                    key={row.id}
                                    className="border-border/40 space-y-1 border-b py-3 last:border-0"
                                >
                                    <p className="truncate font-mono text-xs text-zinc-300">
                                        {row.sql}
                                    </p>
                                    <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-[10px]">
                                        <span>{row.duration_ms.toFixed(1)} ms</span>
                                        {row.is_slow ? (
                                            <ToneChip kind="severity" value="warning" label="Slow" />
                                        ) : null}
                                        {row.is_n_plus_one ? (
                                            <ToneChip kind="severity" value="info" label="N+1" />
                                        ) : null}
                                    </div>
                                </div>
                            ))}
                        </RecentCard>

                        <RecentCard title="Latest jobs" empty="No jobs yet.">
                            {recent.jobs.map((row) => (
                                <div
                                    key={row.id}
                                    className="border-border/40 flex flex-wrap items-center justify-between gap-2 border-b py-3 last:border-0"
                                >
                                    <span className="truncate font-mono text-xs text-zinc-300">
                                        {row.job_class}
                                    </span>
                                    <ToneChip kind="jobStatus" value={row.status} />
                                </div>
                            ))}
                        </RecentCard>

                        <RecentCard title="Latest logs" empty="No logs yet.">
                            {recent.logs.map((row) => (
                                <div
                                    key={row.id}
                                    className="border-border/40 space-y-1 border-b py-3 last:border-0"
                                >
                                    <ToneChip kind="logLevel" value={row.level} />
                                    <p className="text-muted-foreground line-clamp-2 text-xs">
                                        {row.message}
                                    </p>
                                </div>
                            ))}
                        </RecentCard>

                        <RecentCard title="Outgoing HTTP" empty="No outgoing calls yet.">
                            {recent.outgoing_http.map((row) => (
                                <div
                                    key={row.id}
                                    className="border-border/40 flex flex-wrap items-center justify-between gap-2 border-b py-3 last:border-0"
                                >
                                    <span className="truncate text-xs text-zinc-300">
                                        {row.host}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        {row.status_code != null ? (
                                            <ToneChip
                                                kind="httpStatus"
                                                value={row.status_code}
                                            />
                                        ) : null}
                                        {row.failed ? (
                                            <ToneChip
                                                kind="severity"
                                                value="critical"
                                                label="Failed"
                                            />
                                        ) : null}
                                    </div>
                                </div>
                            ))}
                        </RecentCard>

                        <RecentCard title="Mail" empty="No mail events yet.">
                            {recent.mails.map((row) => (
                                <div
                                    key={row.id}
                                    className="border-border/40 flex flex-wrap items-center justify-between gap-2 border-b py-3 last:border-0"
                                >
                                    <span className="truncate text-xs text-zinc-300">
                                        {row.subject ?? row.mailable ?? '—'}
                                    </span>
                                    <ToneChip kind="delivery" value={row.status} />
                                </div>
                            ))}
                        </RecentCard>

                        <RecentCard title="Notifications" empty="No notifications yet.">
                            {recent.notifications.map((row) => (
                                <div
                                    key={row.id}
                                    className="border-border/40 flex flex-wrap items-center justify-between gap-2 border-b py-3 last:border-0"
                                >
                                    <span className="truncate font-mono text-xs text-zinc-300">
                                        {row.notification_class}
                                    </span>
                                    <ToneChip kind="delivery" value={row.status} />
                                </div>
                            ))}
                        </RecentCard>

                        <RecentCard title="Cache samples" empty="No cache stats yet.">
                            {recent.caches.map((row) => (
                                <div
                                    key={row.id}
                                    className="border-border/40 flex flex-wrap items-center justify-between gap-2 border-b py-3 last:border-0"
                                >
                                    <span className="font-mono text-xs text-zinc-300">
                                        {row.store}
                                    </span>
                                    <span className="text-muted-foreground text-[10px]">
                                        hit rate{' '}
                                        {row.hit_rate != null
                                            ? `${(row.hit_rate * 100).toFixed(1)}%`
                                            : '—'}
                                    </span>
                                </div>
                            ))}
                        </RecentCard>

                        <RecentCard title="Commands" empty="No commands yet.">
                            {recent.commands.map((row) => (
                                <div
                                    key={row.id}
                                    className="border-border/40 flex flex-wrap items-center justify-between gap-2 border-b py-3 last:border-0"
                                >
                                    <span className="truncate font-mono text-xs text-zinc-300">
                                        {row.command}
                                    </span>
                                    <ToneChip kind="exitCode" value={row.exit_code} />
                                </div>
                            ))}
                        </RecentCard>

                        <RecentCard title="Scheduled tasks" empty="No scheduler events yet.">
                            {recent.scheduled_tasks.map((row) => (
                                <div
                                    key={row.id}
                                    className="border-border/40 flex flex-wrap items-center justify-between gap-2 border-b py-3 last:border-0"
                                >
                                    <span className="truncate font-mono text-xs text-zinc-300">
                                        {row.task}
                                    </span>
                                    <ToneChip kind="taskStatus" value={row.status} />
                                </div>
                            ))}
                        </RecentCard>

                        <RecentCard title="Health checks" empty="No health checks yet.">
                            {recent.health_checks.map((row) => (
                                <div
                                    key={row.id}
                                    className="border-border/40 flex flex-wrap items-center justify-between gap-2 border-b py-3 last:border-0"
                                >
                                    <span className="font-mono text-xs text-zinc-300">
                                        {row.check_name}
                                    </span>
                                    <ToneChip kind="health" value={row.status} />
                                </div>
                            ))}
                        </RecentCard>
                    </div>
                </div>
            </div>
        </>
    );
}

function RecentCard({
    title,
    empty,
    children,
}: {
    title: string;
    empty: string;
    children: React.ReactNode;
}) {
    const arr = React.Children.toArray(children).filter(Boolean);
    const isEmpty = arr.length === 0;

    return (
        <Card className={cn(monitoringCardClass, 'gap-0 py-0')}>
            <CardHeader className="border-b border-white/[0.06] pb-3 pt-5">
                <CardTitle className="text-base text-white">{title}</CardTitle>
            </CardHeader>

            <CardContent className="px-6 pb-4 pt-0">
                {isEmpty ? (
                    <p className="text-muted-foreground py-6 text-center text-sm">{empty}</p>
                ) : (
                    <div className="scrollbar-slim-dark max-h-[280px] overflow-y-auto pr-1">
                        {children}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

ProjectShow.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Projects', href: '/projects' },
        { title: 'Details', href: '#' },
    ],
};

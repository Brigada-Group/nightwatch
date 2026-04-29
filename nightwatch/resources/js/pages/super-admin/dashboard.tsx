import { Head, Link } from '@inertiajs/react';
import { Activity, ArrowRight, Building2, Server, ShieldCheck, Users } from 'lucide-react';
import { DatabaseFootprintSection } from '@/features/super-admin/components/DatabaseFootprintSection';
import { FeatureAdoptionSection } from '@/features/super-admin/components/FeatureAdoptionSection';
import { GrowingFactorCard } from '@/features/super-admin/components/GrowingFactorCard';
import { GrowthPlatformChart } from '@/features/super-admin/components/GrowthPlatformChart';
import { TeamActivitySection } from '@/features/super-admin/components/TeamActivitySection';
import type { SuperAdminAnalytics } from '@/features/super-admin/types';

type Platform = {
    total_users: number;
    total_teams: number;
    total_projects: number;
    telemetry_events_24h: number;
    webhook_deliveries_24h: number;
    webhook_failures_24h: number;
};

type Props = {
    platform: Platform;
    analytics: SuperAdminAnalytics;
};

const fmt = new Intl.NumberFormat();

export default function SuperAdminDashboard({ platform, analytics }: Props) {
    const snapshot = [
        { title: 'Teams', value: platform.total_teams, icon: Building2 },
        { title: 'Users', value: platform.total_users, icon: Users },
        { title: 'Projects (all teams)', value: platform.total_projects, icon: Server },
        {
            title: 'Telemetry events (24h)',
            value: platform.telemetry_events_24h,
            icon: Activity,
        },
        {
            title: 'Webhook deliveries (24h)',
            value: platform.webhook_deliveries_24h,
            icon: ShieldCheck,
        },
        {
            title: 'Webhook failures (24h)',
            value: platform.webhook_failures_24h,
            icon: ShieldCheck,
        },
    ];

    const a = analytics;

    return (
        <>
            <Head title="Super Admin — Platform" />

            <div className="flex h-full flex-1 flex-col gap-6 bg-background p-4 text-foreground md:p-6">
                <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                    <p className="text-muted-foreground text-xs font-semibold uppercase tracking-[0.18em]">
                        Platform
                    </p>
                    <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">Control plane</h1>
                    <p className="text-muted-foreground mt-1 max-w-2xl text-sm">
                        Roll-up metrics, growth, adoption, and team liveness. Open the teams directory to drill into
                        individual organizations, or see external services on the dependencies page.
                    </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {snapshot.map(({ title, value, icon: Icon }) => (
                        <article key={title} className="rounded-xl border border-border bg-card p-4 shadow-sm">
                            <div className="flex items-center justify-between">
                                <p className="text-muted-foreground text-xs uppercase tracking-wide">{title}</p>
                                <Icon className="text-muted-foreground size-4" />
                            </div>
                            <p className="text-foreground mt-3 text-2xl font-semibold">{fmt.format(value)}</p>
                        </article>
                    ))}
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                    <div className="lg:col-span-2">
                        <GrowthPlatformChart
                            series={a.growth.series}
                            hasSparseHistory={a.growth.has_sparse_history}
                        />
                    </div>
                    <GrowingFactorCard
                        value={a.growing_factor.value}
                        label={a.growing_factor.label}
                        teamsWow={a.growing_factor.teams_wow}
                        usersWow={a.growing_factor.users_wow}
                    />
                </div>

                <DatabaseFootprintSection
                    databaseLabel={a.database_footprint.database_bytes_label}
                    telemetryRows={a.database_footprint.telemetry_rows}
                    trend={a.database_footprint.telemetry_rows_trend}
                />

                <div className="grid gap-4 lg:grid-cols-2">
                    <FeatureAdoptionSection
                        teamTotal={a.feature_adoption.team_total}
                        teamsWithWebhooks={a.feature_adoption.teams_with_webhooks}
                        teamsWithEmailReports={a.feature_adoption.teams_with_email_reports}
                        webhooksPercent={a.feature_adoption.webhooks_percent}
                        emailReportsPercent={a.feature_adoption.email_reports_percent}
                    />
                </div>

                <TeamActivitySection
                    active7d={a.team_activity.active_7d}
                    inactive7d={a.team_activity.inactive_7d}
                    newTeams7d={a.team_activity.new_teams_7d}
                    neverActive7d={a.team_activity.never_active_7d}
                    top={a.team_activity.top}
                    dormant={a.team_activity.dormant}
                />

                <div className="grid gap-3 sm:grid-cols-2">
                    <Link
                        href="/super-admin/teams"
                        className="group bg-muted/30 flex items-center justify-between gap-3 rounded-xl border border-border p-5 shadow-sm transition-colors hover:border-foreground/20"
                    >
                        <div>
                            <h2 className="text-foreground text-base font-semibold">Teams directory</h2>
                            <p className="text-muted-foreground mt-1 text-sm">Search, filter, and open any team.</p>
                        </div>
                        <span className="text-foreground flex items-center gap-1 text-sm font-medium">
                            Open
                            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                        </span>
                    </Link>
                    <Link
                        href="/super-admin/external-dependencies"
                        className="group bg-muted/30 flex items-center justify-between gap-3 rounded-xl border border-border p-5 shadow-sm transition-colors hover:border-foreground/20"
                    >
                        <div>
                            <h2 className="text-foreground text-base font-semibold">External dependencies</h2>
                            <p className="text-muted-foreground mt-1 text-sm">Webhooks, HTTP egress, Paddle, subscriptions.</p>
                        </div>
                        <span className="text-foreground flex items-center gap-1 text-sm font-medium">
                            Open
                            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                        </span>
                    </Link>
                </div>
            </div>
        </>
    );
}

SuperAdminDashboard.layout = {
    breadcrumbs: [
        {
            title: 'Super Admin',
            href: '/super-admin/dashboard',
        },
    ],
};

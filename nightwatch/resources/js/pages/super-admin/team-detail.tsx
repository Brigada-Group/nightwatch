import { Head, Link } from '@inertiajs/react';

type Activity = {
    requests: number;
    logs: number;
    queries: number;
    exceptions: number;
    client_errors: number;
    webhook_deliveries: number;
    webhook_failures: number;
};

type Props = {
    team: {
        id: number;
        name: string;
        team_uuid: string;
        slug: string;
        description: string | null;
        created_at: string | null;
        updated_at: string | null;
    };
    counts: {
        members: number;
        projects: number;
        webhook_destinations: number;
    };
    billing_admin: { id: number; name: string; email: string } | null;
    subscription: {
        type: string;
        status: string;
        price_ids: string[];
        ends_at: string | null;
    } | null;
    spend: Array<{ currency: string; formatted: string }>;
    activity: { last_24h: Activity; last_7d: Activity };
};

const fmt = new Intl.NumberFormat();

function ActivityBlock({ label, value }: { label: string; value: Activity }) {
    return (
        <div className="bg-muted/30 space-y-3 rounded-lg border border-border p-4">
            <h3 className="text-foreground text-sm font-semibold">{label}</h3>
            <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                    <dt className="text-muted-foreground text-xs">Requests</dt>
                    <dd className="text-foreground font-mono text-sm font-medium">{fmt.format(value.requests)}</dd>
                </div>
                <div>
                    <dt className="text-muted-foreground text-xs">Logs</dt>
                    <dd className="text-foreground font-mono text-sm font-medium">{fmt.format(value.logs)}</dd>
                </div>
                <div>
                    <dt className="text-muted-foreground text-xs">Queries</dt>
                    <dd className="text-foreground font-mono text-sm font-medium">{fmt.format(value.queries)}</dd>
                </div>
                <div>
                    <dt className="text-muted-foreground text-xs">Exceptions (server)</dt>
                    <dd className="text-foreground font-mono text-sm font-medium">
                        {fmt.format(value.exceptions)}
                    </dd>
                </div>
                <div>
                    <dt className="text-muted-foreground text-xs">Client errors</dt>
                    <dd className="text-foreground font-mono text-sm font-medium">
                        {fmt.format(value.client_errors)}
                    </dd>
                </div>
                <div>
                    <dt className="text-muted-foreground text-xs">Webhook deliveries</dt>
                    <dd className="text-foreground font-mono text-sm font-medium">
                        {fmt.format(value.webhook_deliveries)}
                    </dd>
                </div>
                <div>
                    <dt className="text-muted-foreground text-xs">Webhook failures</dt>
                    <dd className="text-foreground font-mono text-sm font-medium">
                        {fmt.format(value.webhook_failures)}
                    </dd>
                </div>
            </dl>
        </div>
    );
}

export default function SuperAdminTeamDetail({
    team,
    counts,
    billing_admin,
    subscription,
    spend,
    activity,
}: Props) {
    return (
        <>
            <Head title={`${team.name} — Super Admin`} />

            <div className="flex h-full flex-1 flex-col gap-6 bg-background p-4 text-foreground md:p-6">
                <div className="space-y-2">
                    <Link
                        href="/super-admin/teams"
                        className="text-muted-foreground text-sm underline-offset-2 hover:underline"
                    >
                        ← All teams
                    </Link>
                    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{team.name}</h1>
                        <p className="text-muted-foreground text-sm">/{team.slug}</p>
                        {team.description ? (
                            <p className="text-muted-foreground mt-3 text-sm leading-relaxed">{team.description}</p>
                        ) : null}
                    </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="rounded-xl border border-border bg-card p-4">
                        <p className="text-muted-foreground text-xs uppercase">Members (accepted)</p>
                        <p className="text-foreground mt-2 text-2xl font-semibold">{fmt.format(counts.members)}</p>
                    </div>
                    <div className="rounded-xl border border-border bg-card p-4">
                        <p className="text-muted-foreground text-xs uppercase">Project count</p>
                        <p className="text-foreground mt-2 text-2xl font-semibold">
                            {fmt.format(counts.projects)}
                        </p>
                        <p className="text-muted-foreground mt-1 text-xs">Names and tokens stay on the team side.</p>
                    </div>
                    <div className="rounded-xl border border-border bg-card p-4 sm:col-span-2 lg:col-span-1">
                        <p className="text-muted-foreground text-xs uppercase">Team UUID</p>
                        <p className="text-foreground mt-2 font-mono text-sm break-all">{team.team_uuid}</p>
                    </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-border bg-card p-4">
                        <p className="text-muted-foreground text-xs uppercase">Created</p>
                        <p className="text-foreground mt-2 text-sm">
                            {team.created_at ? new Date(team.created_at).toLocaleString() : '—'}
                        </p>
                    </div>
                    <div className="rounded-xl border border-border bg-card p-4">
                        <p className="text-muted-foreground text-xs uppercase">Last updated</p>
                        <p className="text-foreground mt-2 text-sm">
                            {team.updated_at ? new Date(team.updated_at).toLocaleString() : '—'}
                        </p>
                    </div>
                    <div className="rounded-xl border border-border bg-card p-4 sm:col-span-2">
                        <p className="text-muted-foreground text-xs uppercase">Webhook destinations (team-scoped)</p>
                        <p className="text-foreground mt-2 text-2xl font-semibold">
                            {fmt.format(counts.webhook_destinations)}
                        </p>
                    </div>
                </div>

                <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
                    <h2 className="text-foreground text-base font-semibold">Billing (team owner)</h2>
                    <p className="text-muted-foreground mt-1 text-xs">Subscriptions and invoices follow the user who owns the team.</p>

                    {billing_admin ? (
                        <div className="mt-4 text-sm">
                            <p className="text-foreground">
                                <span className="text-muted-foreground">Name:</span> {billing_admin.name}
                            </p>
                            <p className="text-foreground">
                                <span className="text-muted-foreground">Email:</span> {billing_admin.email}
                            </p>
                        </div>
                    ) : (
                        <p className="text-muted-foreground mt-4 text-sm">No admin user is linked to this team.</p>
                    )}

                    {subscription ? (
                        <ul className="text-muted-foreground mt-3 list-inside list-disc text-sm">
                            <li>Status: {subscription.status}</li>
                            <li>Type: {subscription.type}</li>
                            {subscription.price_ids.length > 0 ? (
                                <li>Price IDs: {subscription.price_ids.join(', ')}</li>
                            ) : null}
                            <li>
                                {subscription.ends_at
                                    ? `Current period reference ends ${subscription.ends_at}`
                                    : 'No end date on file'}
                            </li>
                        </ul>
                    ) : (
                        <p className="text-muted-foreground mt-3 text-sm">No active subscription summary for the billing user.</p>
                    )}

                    <div className="mt-4">
                        <h3 className="text-foreground text-sm font-medium">Lifetime paid charges</h3>
                        {spend.length === 0 ? (
                            <p className="text-muted-foreground mt-1 text-sm">No completed transactions in Paddle yet.</p>
                        ) : (
                            <ul className="text-foreground mt-2 space-y-1 font-mono text-sm">
                                {spend.map((row) => (
                                    <li key={row.currency}>
                                        {row.currency} — {row.formatted}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </section>

                <div className="space-y-4">
                    <h2 className="text-foreground text-base font-semibold">Team activity (no project names)</h2>
                    <ActivityBlock label="Last 24 hours" value={activity.last_24h} />
                    <ActivityBlock label="Last 7 days" value={activity.last_7d} />
                </div>
            </div>
        </>
    );
}

SuperAdminTeamDetail.layout = {
    breadcrumbs: [
        { title: 'Super Admin', href: '/super-admin/dashboard' },
        { title: 'Teams', href: '/super-admin/teams' },
    ],
};

import { Head, Link } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ExternalDependenciesProps } from '@/features/super-admin/types';

const fmt = new Intl.NumberFormat();

export default function SuperAdminExternalDependencies(props: ExternalDependenciesProps) {
    const { webhook, outgoing_http, subscriptions, paddle } = props;

    return (
        <>
            <Head title="External dependencies" />

            <div className="flex h-full flex-1 flex-col gap-6 bg-background p-4 text-foreground md:p-6">
                <div className="space-y-2">
                    <Link
                        href="/super-admin/dashboard"
                        className="text-muted-foreground text-sm underline-offset-2 hover:underline"
                    >
                        ← Platform overview
                    </Link>
                    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                        <h1 className="text-2xl font-semibold tracking-tight text-foreground">External dependencies</h1>
                        <p className="text-muted-foreground mt-1 max-w-2xl text-sm">
                            Outbound webhooks, telemetry outgoing HTTP, Paddle billing, and subscription health. Paddle API
                            call tracing is a future instrumentation point.
                        </p>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Webhook deliveries (outbound from Guardian)</CardTitle>
                        </CardHeader>
                        <CardContent className="text-muted-foreground space-y-1 text-sm">
                            <p>
                                <span className="text-foreground font-medium">{fmt.format(webhook.destinations_count)}</span>{' '}
                                configured destinations
                            </p>
                            <p>24h: {fmt.format(webhook.deliveries_24h)} deliveries, {fmt.format(webhook.failures_24h)} failures</p>
                            <p>7d: {fmt.format(webhook.deliveries_7d)} deliveries (total)</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Outgoing HTTP (hub telemetry, last mile)</CardTitle>
                        </CardHeader>
                        <CardContent className="text-muted-foreground space-y-1 text-sm">
                            <p>
                                24h: {fmt.format(outgoing_http.count_24h)} events, {fmt.format(outgoing_http.failed_24h)} failed
                            </p>
                            <p>7d: {fmt.format(outgoing_http.count_7d)} events</p>
                            <p>Avg duration 24h: {outgoing_http.avg_ms_24h.toFixed(2)} ms</p>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Paddle (billing data in DB)</CardTitle>
                    </CardHeader>
                    <CardContent className="text-muted-foreground space-y-1 text-sm">
                        <p>
                            Paid / completed tx (30d):{' '}
                            <span className="text-foreground font-medium">{fmt.format(paddle.transactions_30d)}</span>
                        </p>
                        <p>Last billed at: {paddle.last_billed_at ?? '—'}</p>
                        <p className="text-amber-600 dark:text-amber-500 mt-2 text-xs">
                            {paddle.api_note} (instrumented: {String(paddle.api_instrumented)})
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Subscriptions (Paddle, default type)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {Object.keys(subscriptions.by_status).length === 0 ? (
                            <p className="text-muted-foreground text-sm">No subscription rows found.</p>
                        ) : (
                            <ul className="text-sm">
                                {Object.entries(subscriptions.by_status).map(([status, count]) => (
                                    <li key={status} className="flex justify-between gap-4">
                                        <span className="text-muted-foreground capitalize">{status}</span>
                                        <span className="text-foreground font-medium">{fmt.format(count)}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

SuperAdminExternalDependencies.layout = {
    breadcrumbs: [
        { title: 'Super Admin', href: '/super-admin/dashboard' },
        { title: 'External dependencies', href: '/super-admin/external-dependencies' },
    ],
};

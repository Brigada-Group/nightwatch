import { Link } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type TeamRow = { id: number; name: string; total: number };
type DormantRow = { id: number; name: string; created_at: string | null };

type Props = {
    active7d: number;
    inactive7d: number;
    newTeams7d: number;
    neverActive7d: number;
    top: TeamRow[];
    dormant: DormantRow[];
};

const fmt = new Intl.NumberFormat();

export function TeamActivitySection({ active7d, inactive7d, newTeams7d, neverActive7d, top, dormant }: Props) {
    return (
        <div className="grid gap-4 lg:grid-cols-2">
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-foreground text-base font-semibold">Team liveness (7d ingest)</CardTitle>
                    <p className="text-muted-foreground text-xs">Counts teams with any telemetry in the last 7 days (requests, logs, queries, exceptions, client errors).</p>
                </CardHeader>
                <CardContent className="text-sm">
                    <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <div>
                            <dt className="text-muted-foreground text-xs">Active</dt>
                            <dd className="text-foreground text-lg font-semibold">{fmt.format(active7d)}</dd>
                        </div>
                        <div>
                            <dt className="text-muted-foreground text-xs">Inactive (older 7d, no ingest)</dt>
                            <dd className="text-foreground text-lg font-semibold">{fmt.format(inactive7d)}</dd>
                        </div>
                        <div>
                            <dt className="text-muted-foreground text-xs">New teams (7d window)</dt>
                            <dd className="text-foreground text-lg font-semibold">{fmt.format(newTeams7d)}</dd>
                        </div>
                        <div>
                            <dt className="text-muted-foreground text-xs">New, no ingest yet</dt>
                            <dd className="text-foreground text-lg font-semibold">{fmt.format(neverActive7d)}</dd>
                        </div>
                    </dl>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-foreground text-base font-semibold">Top activity (7d, ingest volume)</CardTitle>
                </CardHeader>
                <CardContent>
                    {top.length === 0 ? (
                        <p className="text-muted-foreground text-sm">No team with ingest in this window.</p>
                    ) : (
                        <ul className="space-y-1 text-sm">
                            {top.map((t) => (
                                <li key={t.id} className="flex justify-between gap-2">
                                    <Link href={`/super-admin/teams/${t.id}`} className="text-foreground truncate font-medium hover:underline">
                                        {t.name}
                                    </Link>
                                    <span className="text-muted-foreground shrink-0 tabular-nums">{fmt.format(t.total)}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </CardContent>
            </Card>
            {dormant.length > 0 ? (
                <Card className="lg:col-span-2">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-foreground text-base font-semibold">Dormant teams (no 7d ingest, created before window)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="flex flex-wrap gap-2">
                            {dormant.map((d) => (
                                <li key={d.id}>
                                    <Link
                                        href={`/super-admin/teams/${d.id}`}
                                        className="bg-muted/50 inline-block rounded-md border border-border px-2 py-1 text-sm hover:underline"
                                    >
                                        {d.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            ) : null}
        </div>
    );
}

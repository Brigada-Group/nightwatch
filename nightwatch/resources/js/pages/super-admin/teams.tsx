import { Head, Link, router } from '@inertiajs/react';
import { Search } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

type TeamActivity = {
    requests: number;
    logs: number;
    queries: number;
    exceptions: number;
    client_errors: number;
    webhook_deliveries: number;
    webhook_failures: number;
};

type TeamRow = {
    id: number;
    name: string;
    team_uuid: string;
    slug: string;
    created_at: string | null;
    project_count: number;
    member_count: number;
    activity: TeamActivity;
    activity_total: number;
    subscription_status: string | undefined;
    lifetime_spend_label: string;
};

type SubscriptionFilter = 'all' | 'none' | 'healthy' | 'at_risk' | 'canceled' | 'other';
type SortKey = 'newest' | 'name' | 'activity';

type Props = {
    teams: TeamRow[];
};

const fmt = new Intl.NumberFormat();

function subscriptionBadge(status: string | undefined): { label: string; className: string } {
    if (!status) {
        return { label: 'No subscription', className: 'bg-muted text-muted-foreground' };
    }

    if (['active', 'trialing'].includes(status)) {
        return { label: status, className: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' };
    }

    if (['past_due', 'paused'].includes(status)) {
        return { label: status, className: 'bg-amber-500/15 text-amber-800 dark:text-amber-400' };
    }

    return { label: status, className: 'bg-muted text-muted-foreground' };
}

function matchesSubscriptionFilter(status: string | undefined, f: SubscriptionFilter): boolean {
    if (f === 'all') {
        return true;
    }

    if (f === 'none') {
        return !status;
    }

    if (f === 'healthy') {
        return status === 'active' || status === 'trialing';
    }

    if (f === 'at_risk') {
        return status === 'past_due' || status === 'paused';
    }

    if (f === 'canceled') {
        return status === 'canceled';
    }

    if (f === 'other') {
        if (!status) {
            return false;
        }

        if (['active', 'trialing', 'past_due', 'paused', 'canceled'].includes(status)) {
            return false;
        }

        return true;
    }

    return true;
}

function matchesSearch(row: TeamRow, q: string): boolean {
    if (q.trim() === '') {
        return true;
    }

    const s = q.trim().toLowerCase();

    return (
        row.name.toLowerCase().includes(s) ||
        row.slug.toLowerCase().includes(s) ||
        row.team_uuid.toLowerCase().includes(s)
    );
}

function sortRows(rows: TeamRow[], sort: SortKey): TeamRow[] {
    const out = [...rows];

    if (sort === 'name') {
        out.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
    } else if (sort === 'activity') {
        out.sort((a, b) => b.activity_total - a.activity_total);
    } else {
        out.sort((a, b) => {
            const ta = a.created_at ? new Date(a.created_at).getTime() : 0;
            const tb = b.created_at ? new Date(b.created_at).getTime() : 0;

            return tb - ta;
        });
    }

    return out;
}

export default function SuperAdminTeamsIndex({ teams }: Props) {
    const [search, setSearch] = useState('');
    const [subscription, setSubscription] = useState<SubscriptionFilter>('all');
    const [sort, setSort] = useState<SortKey>('newest');

    const visible = useMemo(() => {
        const q = search;
        const filtered = teams.filter(
            (row) => matchesSearch(row, q) && matchesSubscriptionFilter(row.subscription_status, subscription),
        );

        return sortRows(filtered, sort);
    }, [teams, search, subscription, sort]);

    const goTeam = useCallback((id: number) => {
        router.visit(`/super-admin/teams/${id}`);
    }, []);

    return (
        <>
            <Head title="Super Admin — All teams" />

            <div className="flex h-full flex-1 flex-col gap-6 bg-background p-4 text-foreground md:p-6">
                <div className="space-y-2">
                    <Link href="/super-admin/dashboard" className="text-muted-foreground text-sm underline-offset-2 hover:underline">
                        ← Platform overview
                    </Link>
                    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                        <h1 className="text-2xl font-semibold tracking-tight text-foreground">All teams</h1>
                        <p className="text-muted-foreground mt-1 max-w-2xl text-sm">
                            Search by name, slug, or team UUID. Filter by subscription state, then open a team for full
                            billing and usage detail.
                        </p>
                    </div>
                </div>

                <div className="bg-muted/20 flex flex-col gap-4 rounded-xl border border-border p-4 md:flex-row md:items-end">
                    <div className="min-w-0 flex-1 space-y-2">
                        <Label htmlFor="team-search" className="text-muted-foreground text-xs uppercase tracking-wide">
                            Search
                        </Label>
                        <div className="relative">
                            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                            <Input
                                id="team-search"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Name, slug, or UUID"
                                className="pl-9"
                                autoComplete="off"
                            />
                        </div>
                    </div>
                    <div className="w-full min-w-0 space-y-2 md:max-w-[200px]">
                        <span className="text-muted-foreground text-xs uppercase tracking-wide">Subscription</span>
                        <Select value={subscription} onValueChange={(v) => setSubscription(v as SubscriptionFilter)}>
                            <SelectTrigger className="w-full" size="default">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All</SelectItem>
                                <SelectItem value="healthy">Active / trialing</SelectItem>
                                <SelectItem value="at_risk">Past due / paused</SelectItem>
                                <SelectItem value="canceled">Canceled</SelectItem>
                                <SelectItem value="none">No subscription</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="w-full min-w-0 space-y-2 md:max-w-[200px]">
                        <span className="text-muted-foreground text-xs uppercase tracking-wide">Sort</span>
                        <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
                            <SelectTrigger className="w-full" size="default">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="newest">Newest first</SelectItem>
                                <SelectItem value="name">Name A–Z</SelectItem>
                                <SelectItem value="activity">Most activity (24h)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <p className="text-muted-foreground text-sm">
                    Showing {fmt.format(visible.length)} of {fmt.format(teams.length)} teams
                </p>

                <div className="rounded-xl border border-border bg-card shadow-sm">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Team</TableHead>
                                <TableHead>Members</TableHead>
                                <TableHead>Projects</TableHead>
                                <TableHead>Activity (24h)</TableHead>
                                <TableHead>Subscription</TableHead>
                                <TableHead>Lifetime spend</TableHead>
                                <TableHead className="w-[1%] text-right" />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {visible.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-muted-foreground py-8 text-center text-sm">
                                        {teams.length === 0
                                            ? 'No teams yet.'
                                            : 'No teams match your search or filters.'}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                visible.map((t) => {
                                    const br = subscriptionBadge(t.subscription_status);

                                    return (
                                        <TableRow
                                            key={t.id}
                                            className="hover:bg-muted/30 cursor-pointer"
                                            role="link"
                                            tabIndex={0}
                                            onClick={() => goTeam(t.id)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' || e.key === ' ') {
                                                    e.preventDefault();
                                                    goTeam(t.id);
                                                }
                                            }}
                                        >
                                            <TableCell>
                                                <div>
                                                    <p className="text-foreground font-medium">{t.name}</p>
                                                    <p className="text-muted-foreground text-xs">/{t.slug}</p>
                                                </div>
                                            </TableCell>
                                        <TableCell>{fmt.format(t.member_count)}</TableCell>
                                        <TableCell>{fmt.format(t.project_count)}</TableCell>
                                        <TableCell>
                                            <div className="text-foreground text-sm">
                                                {fmt.format(t.activity_total)} total
                                            </div>
                                            <p className="text-muted-foreground text-xs">
                                                req {fmt.format(t.activity.requests)} · log {fmt.format(t.activity.logs)}{' '}
                                                · ex {fmt.format(t.activity.exceptions)} · c_err{' '}
                                                {fmt.format(t.activity.client_errors)}
                                            </p>
                                        </TableCell>
                                        <TableCell>
                                            <span
                                                className={cn(
                                                    'inline-flex rounded-md px-2 py-0.5 text-xs font-medium capitalize',
                                                    br.className,
                                                )}
                                            >
                                                {br.label}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm max-w-[12rem] truncate">
                                            {t.lifetime_spend_label}
                                        </TableCell>
                                        <TableCell
                                            className="text-right"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <Link
                                                href={`/super-admin/teams/${t.id}`}
                                                className="text-foreground text-sm font-medium underline-offset-2 hover:underline"
                                            >
                                                Details
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </>
    );
}

SuperAdminTeamsIndex.layout = {
    breadcrumbs: [
        { title: 'Super Admin', href: '/super-admin/dashboard' },
        { title: 'Teams', href: '/super-admin/teams' },
    ],
};

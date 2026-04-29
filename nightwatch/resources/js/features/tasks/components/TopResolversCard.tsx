import { Trophy } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { TopResolver } from '../types';

type Props = {
    resolvers: TopResolver[];
};

const RANK_TONE = [
    'bg-amber-500/15 text-amber-700 dark:text-amber-300',
    'bg-zinc-500/15 text-zinc-700 dark:text-zinc-300',
    'bg-orange-700/15 text-orange-700 dark:text-orange-300',
    'bg-muted/60 text-muted-foreground',
    'bg-muted/60 text-muted-foreground',
] as const;

function initials(name: string): string {
    const parts = name.trim().split(/\s+/);

    if (parts.length === 0) {
        return '?';
    }

    return parts
        .slice(0, 2)
        .map((p) => p[0]?.toUpperCase() ?? '')
        .join('');
}

export function TopResolversCard({ resolvers }: Props) {
    const total = resolvers.reduce((sum, r) => sum + r.resolved_count, 0);

    return (
        <Card className="flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                    <p className="text-muted-foreground text-[11px] font-semibold uppercase tracking-widest">
                        Leaderboard
                    </p>
                    <CardTitle className="text-base font-semibold">
                        Top resolvers
                    </CardTitle>
                </div>
                <Trophy className="text-muted-foreground/40 size-5" />
            </CardHeader>
            <CardContent className="flex-1 pt-0">
                {resolvers.length === 0 ? (
                    <div className="text-muted-foreground flex h-full min-h-[140px] items-center justify-center text-center text-sm">
                        No exceptions resolved yet.
                    </div>
                ) : (
                    <ul className="space-y-3">
                        {resolvers.map((row, idx) => {
                            const share =
                                total > 0
                                    ? Math.round((row.resolved_count / total) * 100)
                                    : 0;

                            return (
                                <li
                                    key={row.user.id}
                                    className="flex items-center gap-3"
                                >
                                    <div
                                        className={
                                            'flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ' +
                                            (RANK_TONE[idx] ?? RANK_TONE[4])
                                        }
                                        title={`Rank #${idx + 1}`}
                                    >
                                        {initials(row.user.name)}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p
                                            className="text-foreground truncate text-sm font-medium"
                                            title={row.user.name}
                                        >
                                            {row.user.name}
                                        </p>
                                        <p
                                            className="text-muted-foreground truncate text-xs"
                                            title={row.user.email}
                                        >
                                            {row.user.email}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-foreground text-sm font-semibold tabular-nums">
                                            {row.resolved_count}
                                        </p>
                                        <p className="text-muted-foreground text-[10px]">
                                            {share}%
                                        </p>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </CardContent>
        </Card>
    );
}

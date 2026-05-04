import { CheckCircle2, Clock3, Eye, ListTodo, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { StatusCounts } from '../types';

type Props = {
    counts: StatusCounts;
};

type KpiTone = {
    label: string;
    value: string | number;
    hint?: string;
    icon: React.ComponentType<{ className?: string }>;
    accentBg: string;
    accentText: string;
};

function formatPercent(rate: number): string {
    if (!Number.isFinite(rate) || rate < 0) {
        return '0%';
    }

    return `${Math.round(rate * 100)}%`;
}

export function StatsKpiRow({ counts }: Props) {
    const cards: KpiTone[] = [
        {
            label: 'Total assigned',
            value: counts.total,
            hint: `${formatPercent(counts.resolution_rate)} resolved`,
            icon: ListTodo,
            accentBg: 'bg-foreground/10',
            accentText: 'text-foreground',
        },
        {
            label: 'To be Started',
            value: counts.started,
            icon: Sparkles,
            accentBg: 'bg-sky-500/10',
            accentText: 'text-sky-600 dark:text-sky-400',
        },
        {
            label: 'Ongoing',
            value: counts.ongoing,
            icon: Clock3,
            accentBg: 'bg-amber-500/10',
            accentText: 'text-amber-600 dark:text-amber-400',
        },
        {
            label: 'Review',
            value: counts.review,
            icon: Eye,
            accentBg: 'bg-violet-500/10',
            accentText: 'text-violet-600 dark:text-violet-400',
        },
        {
            label: 'Finished',
            value: counts.finished,
            icon: CheckCircle2,
            accentBg: 'bg-emerald-500/10',
            accentText: 'text-emerald-600 dark:text-emerald-400',
        },
    ];

    return (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            {cards.map((card) => {
                const Icon = card.icon;

                return (
                    <Card key={card.label} className="overflow-hidden">
                        <CardContent className="flex items-start justify-between gap-3 p-4">
                            <div className="min-w-0">
                                <p className="text-muted-foreground text-[11px] font-semibold uppercase tracking-wider">
                                    {card.label}
                                </p>
                                <p className="text-foreground mt-1 text-2xl font-bold tabular-nums">
                                    {card.value}
                                </p>
                                {card.hint ? (
                                    <p className="text-muted-foreground mt-0.5 text-xs">
                                        {card.hint}
                                    </p>
                                ) : null}
                            </div>
                            <div
                                className={cn(
                                    'flex size-9 shrink-0 items-center justify-center rounded-md',
                                    card.accentBg,
                                )}
                            >
                                <Icon className={cn('size-5', card.accentText)} />
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}

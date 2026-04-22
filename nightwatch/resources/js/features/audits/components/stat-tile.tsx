import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export type StatTileTone = 'critical' | 'warning' | 'info' | 'neutral';

const TONE_CLASS: Record<StatTileTone, string> = {
    critical:
        'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-400/25 dark:bg-gradient-to-br dark:from-rose-500/25 dark:to-rose-950/30 dark:text-rose-100',
    warning:
        'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-400/22 dark:bg-gradient-to-br dark:from-amber-500/20 dark:to-amber-950/25 dark:text-amber-100',
    info: 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-400/18 dark:bg-gradient-to-br dark:from-sky-500/16 dark:to-sky-950/25 dark:text-sky-100',
    neutral:
        'border-border bg-muted/40 text-foreground dark:bg-gradient-to-br dark:from-zinc-500/14 dark:to-zinc-900/30',
};

type Props = {
    label: string;
    value: number;
    tone: StatTileTone;
    icon: LucideIcon;
};

export function StatTile({ label, value, tone, icon: Icon }: Props) {
    return (
        <div
            className={cn(
                'relative overflow-hidden rounded-xl border p-4 dark:backdrop-blur-md',
                TONE_CLASS[tone],
            )}
        >
            <div className="flex items-start justify-between gap-2">
                <div>
                    <p className="text-muted-foreground text-[11px] font-medium uppercase tracking-wider">
                        {label}
                    </p>
                    <p className="mt-1 text-2xl font-semibold tabular-nums">
                        {value.toLocaleString()}
                    </p>
                </div>
                <div className="rounded-lg border border-border bg-background/60 p-2 dark:bg-black/30">
                    <Icon className="size-4" />
                </div>
            </div>
        </div>
    );
}

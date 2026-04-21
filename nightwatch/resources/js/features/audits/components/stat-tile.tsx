import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export type StatTileTone = 'critical' | 'warning' | 'info' | 'neutral';

const TONE_CLASS: Record<StatTileTone, string> = {
    critical:
        'from-rose-500/25 to-rose-950/30 border-rose-400/25 text-rose-100',
    warning:
        'from-amber-500/20 to-amber-950/25 border-amber-400/22 text-amber-100',
    info: 'from-sky-500/16 to-sky-950/25 border-sky-400/18 text-sky-100',
    neutral: 'from-zinc-500/14 to-zinc-900/30 border-white/10 text-zinc-100',
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
                'relative overflow-hidden rounded-xl border bg-gradient-to-br p-4 backdrop-blur-md',
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
                <div className="rounded-lg border border-white/10 bg-black/30 p-2">
                    <Icon className="size-4" />
                </div>
            </div>
        </div>
    );
}

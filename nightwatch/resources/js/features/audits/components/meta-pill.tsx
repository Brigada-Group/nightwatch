import type { LucideIcon } from 'lucide-react';

type Props = {
    icon: LucideIcon;
    label: string;
    value: string;
};

export function MetaPill({ icon: Icon, label, value }: Props) {
    return (
        <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/30 px-3 py-1.5 backdrop-blur-sm">
            <Icon className="size-3.5 text-zinc-400" />
            <span className="text-muted-foreground text-[11px] uppercase tracking-wider">
                {label}
            </span>
            <span className="text-foreground font-mono text-xs">{value}</span>
        </div>
    );
}

import type { LucideIcon } from 'lucide-react';

type Props = {
    icon: LucideIcon;
    label: string;
    value: string;
};

export function MetaPill({ icon: Icon, label, value }: Props) {
    return (
        <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-1.5 dark:backdrop-blur-sm">
            <Icon className="size-3.5 text-muted-foreground" />
            <span className="text-muted-foreground text-[11px] uppercase tracking-wider">
                {label}
            </span>
            <span className="text-foreground font-mono text-xs">{value}</span>
        </div>
    );
}

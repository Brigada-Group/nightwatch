import type { LucideIcon } from 'lucide-react';

type Props = {
    icon: LucideIcon;
    title: string;
    description: string;
};

export function EmptyState({ icon: Icon, title, description }: Props) {
    return (
        <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
                <Icon className="size-6 text-emerald-300" />
            </div>
            <p className="text-foreground text-sm font-medium">{title}</p>
            <p className="text-muted-foreground text-xs">{description}</p>
        </div>
    );
}

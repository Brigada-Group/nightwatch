import type { LucideIcon } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

type Props = {
    icon: LucideIcon;
    label: string;
    description: string;
    checked: boolean;
    onCheckedChange: (next: boolean) => void;
    disabled?: boolean;
};

export function AiConfigToggleRow({
    icon: Icon,
    label,
    description,
    checked,
    onCheckedChange,
    disabled = false,
}: Props) {
    return (
        <div
            className={cn(
                'flex items-start justify-between gap-4 rounded-lg border border-border bg-muted/30 p-4',
                disabled && 'opacity-60',
            )}
        >
            <div className="flex min-w-0 items-start gap-3">
                <div className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-md">
                    <Icon className="size-5" />
                </div>
                <div className="min-w-0">
                    <p className="text-foreground text-sm font-semibold">
                        {label}
                    </p>
                    <p className="text-muted-foreground mt-0.5 text-xs">
                        {description}
                    </p>
                </div>
            </div>

            <Switch
                checked={checked}
                onCheckedChange={onCheckedChange}
                disabled={disabled}
            />
        </div>
    );
}

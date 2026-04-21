import type { ProjectStatus } from '@/entities';
import { cn } from '@/lib/utils';

const statusConfig: Record<
    ProjectStatus,
    { label: string; dotClass: string; textClass: string }
> = {
    normal: {
        label: 'Healthy',
        dotClass: 'bg-emerald-400',
        textClass: 'text-emerald-400',
    },
    warning: {
        label: 'Warning',
        dotClass: 'bg-amber-400',
        textClass: 'text-amber-400',
    },
    critical: {
        label: 'Critical',
        dotClass: 'bg-red-400',
        textClass: 'text-red-400',
    },
    unknown: {
        label: 'Unknown',
        dotClass: 'bg-slate-500',
        textClass: 'text-slate-500',
    },
};

type Props = {
    status: ProjectStatus;
    showLabel?: boolean;
    className?: string;
};

export function StatusIndicator({
    status,
    showLabel = true,
    className,
}: Props) {
    const config = statusConfig[status];

    return (
        <div className={cn('flex items-center gap-2', className)}>
            <span
                className={cn('inline-block size-2 rounded-full', config.dotClass)}
            />
            {showLabel && (
                <span className={cn('text-xs font-medium', config.textClass)}>
                    {config.label}
                </span>
            )}
        </div>
    );
}

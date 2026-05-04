import { Repeat } from 'lucide-react';
import { cn } from '@/lib/utils';

type Props = {
    className?: string;
    /**
     * When true, shows just the icon — useful for tight table cells.
     */
    compact?: boolean;
};

/**
 * Visual marker for an exception that has come back after being resolved.
 * Red tone is intentional — these need attention.
 */
export function RecurrenceBadge({ className, compact = false }: Props) {
    return (
        <span
            className={cn(
                'inline-flex items-center gap-1 rounded-md border border-red-500/40 bg-red-500/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-red-700 dark:text-red-300',
                className,
            )}
            title="This exception was resolved before and has occurred again"
        >
            <Repeat className="size-3" />
            {compact ? null : 'Recurrence'}
        </span>
    );
}

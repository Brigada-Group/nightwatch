import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type ConnectionStatus = 'connected' | 'stale' | 'lost' | 'disconnected';

type Props = {
    status: ConnectionStatus;
    className?: string;
};

const TONE: Record<ConnectionStatus, string> = {
    connected:
        'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
    stale:
        'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300',
    lost: 'border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300',
    disconnected:
        'border-muted-foreground/30 bg-muted text-muted-foreground',
};

const LABEL: Record<ConnectionStatus, string> = {
    connected: 'Connected',
    stale: 'Stale',
    lost: 'Lost',
    disconnected: 'Not connected',
};

const DOT_TONE: Record<ConnectionStatus, string> = {
    connected: 'bg-emerald-500 animate-pulse',
    stale: 'bg-amber-500',
    lost: 'bg-red-500',
    disconnected: 'bg-muted-foreground/40',
};

export function ConnectionStatusBadge({ status, className }: Props) {
    return (
        <Badge
            variant="outline"
            className={cn('gap-1.5 font-normal', TONE[status], className)}
        >
            <span
                className={cn(
                    'inline-block size-1.5 shrink-0 rounded-full',
                    DOT_TONE[status],
                )}
            />
            {LABEL[status]}
        </Badge>
    );
}

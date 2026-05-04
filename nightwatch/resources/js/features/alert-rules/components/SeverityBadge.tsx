import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { SEVERITY_TONE } from '../constants';
import type { Severity } from '../types';

type Props = {
    severity: Severity | null;
    className?: string;
};

export function SeverityBadge({ severity, className }: Props) {
    if (!severity) return null;
    return (
        <Badge
            variant="outline"
            className={cn(SEVERITY_TONE[severity], className)}
        >
            {severity}
        </Badge>
    );
}

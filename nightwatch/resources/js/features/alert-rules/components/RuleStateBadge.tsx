import { Badge } from '@/components/ui/badge';

type Props = {
    isEnabled: boolean;
    isCurrentlyFiring: boolean;
};

/**
 * Three-state badge: disabled wins (the rule is off entirely), then firing
 * (a condition currently matches), then idle. Order matters — a disabled
 * rule that "would be firing" should still read as disabled.
 */
export function RuleStateBadge({ isEnabled, isCurrentlyFiring }: Props) {
    if (!isEnabled) {
        return <Badge variant="outline">disabled</Badge>;
    }

    if (isCurrentlyFiring) {
        return (
            <Badge
                variant="outline"
                className="border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300"
            >
                firing
            </Badge>
        );
    }

    return (
        <Badge
            variant="outline"
            className="border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
        >
            idle
        </Badge>
    );
}

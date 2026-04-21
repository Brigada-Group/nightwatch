import { ToneChip } from '@/components/monitoring/tone-chip';
import { capitalize, severityToTone } from '../lib/severity';

type Props = {
    severity: string;
};

export function SeverityBadge({ severity }: Props) {
    return (
        <ToneChip
            kind="severity"
            value={severityToTone(severity)}
            label={capitalize(severity)}
        />
    );
}

import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EXCEPTION_SEVERITY_CHOICES } from '../../constants';
import type { AlertRuleFormState } from '../../types';

type Props = {
    form: AlertRuleFormState;
    onChange: (patch: Partial<AlertRuleFormState>) => void;
};

/**
 * Parameters specific to the error_rate rule type. Two fields:
 *   - threshold: the count must EXCEED this in the window for the rule to fire
 *   - severity_filter: which exception severities to count (this is INPUT
 *     filtering — distinct from the rule's own notification severity)
 */
export function ErrorRateParamsFields({ form, onChange }: Props) {
    const toggleSeverity = (severity: string) => {
        const current = form.severity_filter;
        const next = current.includes(severity)
            ? current.filter((s) => s !== severity)
            : [...current, severity];
        onChange({ severity_filter: next });
    };

    return (
        <div className="border-border space-y-3 rounded-md border p-3">
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                Error rate parameters
            </p>

            <div className="space-y-2">
                <Label htmlFor="rule-threshold">Threshold</Label>
                <Input
                    id="rule-threshold"
                    type="number"
                    min={1}
                    value={form.threshold}
                    onChange={(e) =>
                        onChange({ threshold: Number(e.target.value) })
                    }
                    required
                />
                <p className="text-muted-foreground text-xs">
                    Fire when the count of matching exceptions in the window
                    exceeds this number.
                </p>
            </div>

            <div className="space-y-2">
                <Label>Match exception severities</Label>
                <div className="flex flex-wrap gap-2">
                    {EXCEPTION_SEVERITY_CHOICES.map((sev) => (
                        <label
                            key={sev}
                            className="flex items-center gap-2 text-sm"
                        >
                            <Checkbox
                                checked={form.severity_filter.includes(sev)}
                                onCheckedChange={() => toggleSeverity(sev)}
                            />
                            {sev}
                        </label>
                    ))}
                </div>
                <p className="text-muted-foreground text-xs">
                    Only exceptions with these severities count toward the
                    threshold above.
                </p>
            </div>
        </div>
    );
}

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { AlertRuleFormState } from '../../types';

type Props = {
    form: AlertRuleFormState;
    onChange: (patch: Partial<AlertRuleFormState>) => void;
};

export function NewExceptionClassParamsFields({ form, onChange }: Props) {
    return (
        <div className="border-border space-y-3 rounded-md border p-3">
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                New exception class parameters
            </p>

            <div className="space-y-2">
                <Label htmlFor="rule-pattern">Class pattern (optional)</Label>
                <Input
                    id="rule-pattern"
                    value={form.class_pattern}
                    onChange={(e) =>
                        onChange({ class_pattern: e.target.value })
                    }
                    placeholder="App\Exceptions\%"
                />
                <p className="text-muted-foreground text-xs">
                    SQL LIKE pattern. Use % as wildcard. Leave empty to match
                    any new class.
                </p>
            </div>
        </div>
    );
}

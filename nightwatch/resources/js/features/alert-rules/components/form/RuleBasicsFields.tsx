import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type {
    AlertRuleFormState,
    AlertRuleProject,
    RuleType,
    RuleTypeOption,
    Severity,
} from '../../types';

type Props = {
    form: AlertRuleFormState;
    onChange: (patch: Partial<AlertRuleFormState>) => void;
    projects: AlertRuleProject[];
    ruleTypes: RuleTypeOption[];
    severities: Severity[];
};

/**
 * Top half of the form — the bits every rule type shares: name, type
 * selector, project scope, evaluation window/cooldown, and how the
 * delivered notification should be classified.
 */
export function RuleBasicsFields({
    form,
    onChange,
    projects,
    ruleTypes,
    severities,
}: Props) {
    return (
        <>
            <div className="space-y-2">
                <Label htmlFor="rule-name">Name</Label>
                <Input
                    id="rule-name"
                    value={form.name}
                    onChange={(e) => onChange({ name: e.target.value })}
                    placeholder="Production error spike"
                    required
                />
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                    <Label>Type</Label>
                    <Select
                        value={form.type}
                        onValueChange={(v) =>
                            onChange({ type: v as RuleType })
                        }
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {ruleTypes.map((t) => (
                                <SelectItem key={t.value} value={t.value}>
                                    {t.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label>Project scope</Label>
                    <Select
                        value={form.project_id?.toString() ?? 'all'}
                        onValueChange={(v) =>
                            onChange({
                                project_id: v === 'all' ? null : Number(v),
                            })
                        }
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">
                                All projects in team
                            </SelectItem>
                            {projects.map((p) => (
                                <SelectItem
                                    key={p.id}
                                    value={p.id.toString()}
                                >
                                    {p.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                    <Label htmlFor="rule-window">Window (seconds)</Label>
                    <Input
                        id="rule-window"
                        type="number"
                        min={60}
                        max={86400}
                        value={form.window_seconds}
                        onChange={(e) =>
                            onChange({
                                window_seconds: Number(e.target.value),
                            })
                        }
                        required
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="rule-cooldown">Cooldown (seconds)</Label>
                    <Input
                        id="rule-cooldown"
                        type="number"
                        min={60}
                        max={86400}
                        value={form.cooldown_seconds}
                        onChange={(e) =>
                            onChange({
                                cooldown_seconds: Number(e.target.value),
                            })
                        }
                        required
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label>Notification severity</Label>
                <Select
                    value={form.severity}
                    onValueChange={(v) =>
                        onChange({ severity: v as Severity })
                    }
                >
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {severities.map((s) => (
                            <SelectItem key={s} value={s}>
                                {s}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <p className="text-muted-foreground text-xs">
                    How this alert is classified when delivered (drives
                    Slack/Discord color, ordering).
                </p>
            </div>
        </>
    );
}

import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import type { AlertRuleWebhook } from '../../types';

type Props = {
    selectedIds: number[];
    options: AlertRuleWebhook[];
    onToggle: (id: number) => void;
};

export function DestinationPicker({ selectedIds, options, onToggle }: Props) {
    return (
        <div className="space-y-2">
            <Label>Destinations</Label>
            {options.length === 0 ? (
                <p className="text-muted-foreground text-xs">
                    No webhook destinations available. Create one in Webhooks
                    first.
                </p>
            ) : (
                <div className="border-border max-h-40 space-y-1 overflow-y-auto rounded-md border p-2">
                    {options.map((webhook) => (
                        <label
                            key={webhook.id}
                            className="hover:bg-muted/40 flex items-center gap-2 rounded-md px-2 py-1.5 text-sm"
                        >
                            <Checkbox
                                checked={selectedIds.includes(webhook.id)}
                                onCheckedChange={() => onToggle(webhook.id)}
                            />
                            <span className="flex-1">{webhook.name}</span>
                            <Badge
                                variant="outline"
                                className="text-[10px] uppercase"
                            >
                                {webhook.provider}
                            </Badge>
                        </label>
                    ))}
                </div>
            )}
        </div>
    );
}

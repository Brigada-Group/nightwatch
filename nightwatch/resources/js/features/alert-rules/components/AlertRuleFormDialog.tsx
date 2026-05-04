import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import type {
    AlertRule,
    AlertRuleFormState,
    AlertRuleProject,
    AlertRuleWebhook,
    RuleTypeOption,
    Severity,
} from '../types';
import { DestinationPicker } from './form/DestinationPicker';
import { EmailDestinationField } from './form/EmailDestinationField';
import { RuleBasicsFields } from './form/RuleBasicsFields';
import { RuleTypeParamsFields } from './form/RuleTypeParamsFields';

type Props = {
    isOpen: boolean;
    editing: AlertRule | null;
    submitting: boolean;
    form: AlertRuleFormState;
    onPatch: (patch: Partial<AlertRuleFormState>) => void;
    onToggleDestination: (id: number) => void;
    onAddEmail: (email: string) => boolean;
    onRemoveEmail: (email: string) => void;
    onSubmit: () => void;
    onOpenChange: (open: boolean) => void;
    projects: AlertRuleProject[];
    webhookDestinations: AlertRuleWebhook[];
    ruleTypes: RuleTypeOption[];
    severities: Severity[];
};

export function AlertRuleFormDialog({
    isOpen,
    editing,
    submitting,
    form,
    onPatch,
    onToggleDestination,
    onAddEmail,
    onRemoveEmail,
    onSubmit,
    onOpenChange,
    projects,
    webhookDestinations,
    ruleTypes,
    severities,
}: Props) {
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="gap-6 sm:max-w-2xl">
                <DialogHeader className="space-y-2 text-left">
                    <DialogTitle>
                        {editing ? 'Edit alert rule' : 'New alert rule'}
                    </DialogTitle>
                    <DialogDescription>
                        Rules are evaluated every minute. When the condition
                        matches, every destination is fired once. Re-firing
                        is suppressed until the rule resolves.
                    </DialogDescription>
                </DialogHeader>

                <form
                    onSubmit={handleSubmit}
                    className="max-h-[70vh] space-y-5 overflow-y-auto pr-1"
                >
                    <RuleBasicsFields
                        form={form}
                        onChange={onPatch}
                        projects={projects}
                        ruleTypes={ruleTypes}
                        severities={severities}
                    />

                    <RuleTypeParamsFields form={form} onChange={onPatch} />

                    <DestinationPicker
                        selectedIds={form.destination_webhook_ids}
                        options={webhookDestinations}
                        onToggle={onToggleDestination}
                    />

                    <EmailDestinationField
                        emails={form.destination_emails}
                        onAdd={onAddEmail}
                        onRemove={onRemoveEmail}
                    />

                    <label className="flex items-center gap-2 text-sm">
                        <Checkbox
                            checked={form.is_enabled}
                            onCheckedChange={(checked) =>
                                onPatch({ is_enabled: checked === true })
                            }
                        />
                        Enabled
                    </label>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={submitting}>
                            {editing ? 'Save changes' : 'Create rule'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

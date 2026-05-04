import { useCallback, useState } from 'react';
import { EMPTY_RULE_FORM } from '../constants';
import type { AlertRule, AlertRuleFormState } from '../types';

type FormApi = {
    form: AlertRuleFormState;
    patch: (patch: Partial<AlertRuleFormState>) => void;
    reset: () => void;
    seedFromRule: (rule: AlertRule) => void;
    toggleDestination: (id: number) => void;
    addEmail: (email: string) => boolean;
    removeEmail: (email: string) => void;
};

/**
 * Custom hook owning the rule form state and the small mutators the form
 * fields need. Splitting this out keeps the dialog component declarative
 * and lets us reuse the form state shape elsewhere if we ever add a "Test
 * rule" panel or similar.
 */
export function useAlertRuleForm(): FormApi {
    const [form, setForm] = useState<AlertRuleFormState>(EMPTY_RULE_FORM);

    const patch = useCallback((next: Partial<AlertRuleFormState>) => {
        setForm((prev) => ({ ...prev, ...next }));
    }, []);

    const reset = useCallback(() => {
        setForm(EMPTY_RULE_FORM);
    }, []);

    const seedFromRule = useCallback((rule: AlertRule) => {
        const params = rule.params ?? {};
        setForm({
            name: rule.name,
            type: rule.type,
            project_id: rule.project?.id ?? null,
            window_seconds: rule.window_seconds,
            cooldown_seconds: rule.cooldown_seconds,
            severity: rule.severity,
            is_enabled: rule.is_enabled,
            threshold: Number(params.threshold ?? 5),
            severity_filter: Array.isArray(params.severity_filter)
                ? (params.severity_filter as string[])
                : ['error', 'critical'],
            class_pattern:
                typeof params.class_pattern === 'string'
                    ? (params.class_pattern as string)
                    : '',
            destination_webhook_ids: rule.destinations
                .map((d) => d.webhook?.id)
                .filter((id): id is number => typeof id === 'number'),
            destination_emails: rule.destinations
                .filter((d) => d.destination_type === 'email')
                .map((d) => d.email)
                .filter((e): e is string => typeof e === 'string' && e !== ''),
        });
    }, []);

    const toggleDestination = useCallback((id: number) => {
        setForm((prev) => ({
            ...prev,
            destination_webhook_ids: prev.destination_webhook_ids.includes(id)
                ? prev.destination_webhook_ids.filter((d) => d !== id)
                : [...prev.destination_webhook_ids, id],
        }));
    }, []);

    /**
     * Returns true when the email was accepted (valid + not duplicate),
     * false otherwise. The caller can use that to clear the input field
     * and show a toast on rejection.
     */
    const addEmail = useCallback((rawEmail: string): boolean => {
        const email = rawEmail.trim().toLowerCase();
        if (email === '' || ! /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return false;
        }

        let accepted = true;
        setForm((prev) => {
            if (prev.destination_emails.includes(email)) {
                accepted = false;
                return prev;
            }
            return {
                ...prev,
                destination_emails: [...prev.destination_emails, email],
            };
        });
        return accepted;
    }, []);

    const removeEmail = useCallback((email: string) => {
        setForm((prev) => ({
            ...prev,
            destination_emails: prev.destination_emails.filter(
                (e) => e !== email,
            ),
        }));
    }, []);

    return {
        form,
        patch,
        reset,
        seedFromRule,
        toggleDestination,
        addEmail,
        removeEmail,
    };
}

import { router } from '@inertiajs/react';
import { useCallback, useState } from 'react';
import type { AlertRule, AlertRuleFormState } from '../types';
import { useAlertRuleForm } from './useAlertRuleForm';

/**
 * Top-level coordinator for the rules dialog. Composes useAlertRuleForm
 * with dialog open/close state, distinguishes create vs edit, and handles
 * the submit pipeline (build the params object → router.post / router.patch).
 *
 * The page only sees a thin imperative API — no form state spilling out.
 */
export function useAlertRuleEditor() {
    const formApi = useAlertRuleForm();
    const [isOpen, setIsOpen] = useState(false);
    const [editing, setEditing] = useState<AlertRule | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const openCreate = useCallback(() => {
        formApi.reset();
        setEditing(null);
        setIsOpen(true);
    }, [formApi]);

    const openEdit = useCallback(
        (rule: AlertRule) => {
            formApi.seedFromRule(rule);
            setEditing(rule);
            setIsOpen(true);
        },
        [formApi],
    );

    const close = useCallback(() => {
        setIsOpen(false);
    }, []);

    const submit = useCallback(() => {
        if (submitting) return;
        const payload = buildPayload(formApi.form);

        setSubmitting(true);
        const onFinish = () => setSubmitting(false);
        const onSuccess = () => setIsOpen(false);

        if (editing) {
            router.patch(`/alert-rules/${editing.id}`, payload as never, {
                preserveScroll: true,
                onSuccess,
                onFinish,
            });
        } else {
            router.post('/alert-rules', payload as never, {
                preserveScroll: true,
                onSuccess,
                onFinish,
            });
        }
    }, [editing, formApi.form, submitting]);

    return {
        isOpen,
        editing,
        submitting,
        form: formApi.form,
        patch: formApi.patch,
        toggleDestination: formApi.toggleDestination,
        addEmail: formApi.addEmail,
        removeEmail: formApi.removeEmail,
        openCreate,
        openEdit,
        close,
        submit,
        setIsOpen,
    };
}

/**
 * Translate form state into the API payload. Type-specific params are
 * built only for the active rule type so we don't send stale values from
 * a different type the user previously had selected.
 */
function buildPayload(form: AlertRuleFormState): Record<string, unknown> {
    const params: Record<string, string | number | string[]> = {};

    if (form.type === 'error_rate') {
        params.threshold = form.threshold;
        params.severity_filter = form.severity_filter;
    }
    if (form.type === 'new_exception_class' && form.class_pattern.trim() !== '') {
        params.class_pattern = form.class_pattern.trim();
    }

    return {
        name: form.name,
        type: form.type,
        project_id: form.project_id,
        window_seconds: form.window_seconds,
        cooldown_seconds: form.cooldown_seconds,
        severity: form.severity,
        is_enabled: form.is_enabled,
        params,
        destination_webhook_ids: form.destination_webhook_ids,
        destination_emails: form.destination_emails,
    };
}

import type { AlertRuleFormState, Severity } from './types';

export const SEVERITY_TONE: Record<Severity, string> = {
    info: 'border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-300',
    warning:
        'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300',
    critical: 'border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300',
};

/**
 * The five severities the ingest layer accepts. The form lets users pick a
 * subset that will be COUNTED when the error_rate evaluator runs — not the
 * severity of the alert notification itself (that's the rule's own
 * `severity` field).
 */
export const EXCEPTION_SEVERITY_CHOICES = [
    'critical',
    'error',
    'warning',
    'info',
    'debug',
];

export const EMPTY_RULE_FORM: AlertRuleFormState = {
    name: '',
    type: 'error_rate',
    project_id: null,
    window_seconds: 300,
    cooldown_seconds: 300,
    severity: 'warning',
    is_enabled: true,
    threshold: 5,
    severity_filter: ['error', 'critical'],
    class_pattern: '',
    destination_webhook_ids: [],
    destination_emails: [],
};

export type RuleType = 'error_rate' | 'new_exception_class';

export type Severity = 'info' | 'warning' | 'critical';

export type AlertRuleProject = { id: number; name: string };

export type AlertRuleWebhook = {
    id: number;
    name: string;
    provider: string;
};

export type AlertRuleDestination = {
    id: number;
    destination_type: string;
    webhook: AlertRuleWebhook | null;
    email: string | null;
};

export type AlertRule = {
    id: number;
    name: string;
    type: RuleType;
    type_label: string;
    params: Record<string, unknown>;
    window_seconds: number;
    cooldown_seconds: number;
    severity: Severity;
    is_enabled: boolean;
    is_currently_firing: boolean;
    last_fired_at: string | null;
    last_resolved_at: string | null;
    project: AlertRuleProject | null;
    destinations: AlertRuleDestination[];
};

export type Firing = {
    id: number;
    alert_rule_id: number;
    rule_name: string | null;
    severity: Severity | null;
    fired_at: string | null;
    resolved_at: string | null;
    matched_count: number;
};

export type RuleTypeOption = { value: RuleType; label: string };

export type AlertRulesPageProps = {
    rules: AlertRule[];
    recentFirings: Firing[];
    projects: AlertRuleProject[];
    webhookDestinations: AlertRuleWebhook[];
    ruleTypes: RuleTypeOption[];
    severities: Severity[];
};

export type AlertRuleFormState = {
    name: string;
    type: RuleType;
    project_id: number | null;
    window_seconds: number;
    cooldown_seconds: number;
    severity: Severity;
    is_enabled: boolean;
    threshold: number;
    severity_filter: string[];
    class_pattern: string;
    destination_webhook_ids: number[];
    destination_emails: string[];
};

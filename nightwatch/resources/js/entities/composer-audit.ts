export type ComposerAdvisorySeverity =
    | 'critical'
    | 'high'
    | 'moderate'
    | 'low'
    | 'info';

export type ComposerAdvisory = {
    id?: string;
    package: string;
    severity: ComposerAdvisorySeverity | string;
    title: string;
    cve: string | null;
    affected_versions?: string | null;
    recommendation?: string | null;
    source?: string | null;
    reported_at?: string | null;
};

export type ComposerAbandonedPackage = {
    package: string;
    replacement: string | null;
    detected_at?: string | null;
    note?: string | null;
};

export type HubComposerAudit = {
    id: number;
    project_id: number;
    environment: string;
    server: string;
    advisories_count: number;
    abandoned_count: number;
    advisories: ComposerAdvisory[] | null;
    abandoned: ComposerAbandonedPackage[] | null;
    sent_at: string;
    created_at: string;
    updated_at: string;
};

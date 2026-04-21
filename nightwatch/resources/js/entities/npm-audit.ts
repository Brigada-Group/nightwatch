export type NpmVulnerabilitySeverity =
    | 'critical'
    | 'high'
    | 'moderate'
    | 'low'
    | 'info';

export type NpmVulnerability = {
    id?: string;
    package: string;
    severity: NpmVulnerabilitySeverity | string;
    title: string;
    cve: string | null;
    range?: string | null;
    fix?: string | null;
    source?: string | null;
    reported_at?: string | null;
};

export type NpmAuditMetadata = {
    package_manager?: string;
    dependency_count?: number;
    dev_dependency_count?: number;
    simulated?: boolean;
    [key: string]: unknown;
};

export type HubNpmAudit = {
    id: number;
    project_id: number;
    environment: string;
    server: string;
    total_vulnerabilities: number;
    info_count: number;
    low_count: number;
    moderate_count: number;
    high_count: number;
    critical_count: number;
    vulnerabilities: NpmVulnerability[] | null;
    audit_metadata: NpmAuditMetadata | null;
    sent_at: string;
    created_at: string;
    updated_at: string;
};

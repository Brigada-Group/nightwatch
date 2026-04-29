export type GrowthSeriesPoint = {
    date: string;
    users: number;
    teams: number;
    projects: number;
};

export type SuperAdminAnalytics = {
    growth: {
        series: GrowthSeriesPoint[];
        has_sparse_history: boolean;
    };
    growing_factor: {
        value: number;
        label: string;
        teams_wow: number | null;
        users_wow: number | null;
    };
    database_footprint: {
        database_bytes: number;
        database_bytes_label: string;
        telemetry_rows: number;
        telemetry_rows_trend: Array<{ date: string; value: number }>;
    };
    feature_adoption: {
        team_total: number;
        teams_with_webhooks: number;
        teams_with_email_reports: number;
        webhooks_percent: number;
        email_reports_percent: number;
    };
    team_activity: {
        active_7d: number;
        inactive_7d: number;
        never_active_7d: number;
        new_teams_7d: number;
        top: Array<{ id: number; name: string; total: number }>;
        dormant: Array<{ id: number; name: string; created_at: string | null }>;
    };
};

export type ExternalDependenciesProps = {
    webhook: {
        destinations_count: number;
        deliveries_24h: number;
        failures_24h: number;
        deliveries_7d: number;
    };
    outgoing_http: {
        count_24h: number;
        count_7d: number;
        failed_24h: number;
        avg_ms_24h: number;
    };
    subscriptions: { by_status: Record<string, number> };
    paddle: {
        transactions_30d: number;
        last_billed_at: string | null;
        api_instrumented: boolean;
        api_note: string;
    };
};

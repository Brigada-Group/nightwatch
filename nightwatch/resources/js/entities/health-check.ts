export type HealthCheckStatus = 'ok' | 'warning' | 'critical' | 'error';

export type HubHealthCheck = {
    id: number;
    project_id: number;
    environment: string;
    server: string;
    check_name: string;
    status: HealthCheckStatus;
    message: string | null;
    metadata: Record<string, unknown> | null;
    sent_at: string;
    created_at: string;
    updated_at: string;
};

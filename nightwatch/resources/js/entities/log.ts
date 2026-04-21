export type LogLevel = 'emergency' | 'alert' | 'critical' | 'error' | 'warning';

export type HubLog = {
    id: number;
    project_id: number;
    environment: string;
    server: string;
    level: LogLevel;
    message: string;
    channel: string | null;
    context: Record<string, unknown> | null;
    sent_at: string;
    created_at: string;
    updated_at: string;
};

export type HubOutgoingHttp = {
    id: number;
    project_id: number;
    environment: string;
    server: string;
    method: string;
    url: string;
    host: string;
    status_code: number | null;
    duration_ms: number | null;
    failed: boolean;
    error_message: string | null;
    sent_at: string;
    created_at: string;
    updated_at: string;
};

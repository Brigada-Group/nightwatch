export type HubRequest = {
    id: number;
    project_id: number;
    environment: string;
    server: string;
    method: string;
    uri: string;
    route_name: string | null;
    status_code: number;
    duration_ms: number;
    ip: string | null;
    user_id: number | null;
    sent_at: string;
    created_at: string;
    updated_at: string;
};

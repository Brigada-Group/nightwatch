export type HubCommand = {
    id: number;
    project_id: number;
    environment: string;
    server: string;
    command: string;
    exit_code: number | null;
    duration_ms: number | null;
    sent_at: string;
    created_at: string;
    updated_at: string;
};

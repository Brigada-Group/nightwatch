export type HubQuery = {
    id: number;
    project_id: number;
    environment: string;
    server: string;
    sql: string;
    duration_ms: number;
    connection: string | null;
    file: string | null;
    line: number | null;
    is_slow: boolean;
    is_n_plus_one: boolean;
    metadata: Record<string, unknown> | null;
    sent_at: string;
    created_at: string;
    updated_at: string;
};

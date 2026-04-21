export type HubCache = {
    id: number;
    project_id: number;
    environment: string;
    server: string;
    store: string;
    hits: number;
    misses: number;
    writes: number;
    forgets: number;
    hit_rate: number | null;
    period_start: string | null;
    sent_at: string;
    created_at: string;
    updated_at: string;
};

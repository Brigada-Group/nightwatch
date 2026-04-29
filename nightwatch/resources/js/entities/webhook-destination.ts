export type WebhookDestination = {
    id: number;
    team_id: number;
    created_by: number | null;
    name: string;
    provider: 'generic' | 'slack' | 'discord';
    url: string;
    secret: string | null;
    enabled: boolean;
    subscribed_events: string[];
    filters: {
        environments?: string[];
        project_ids?: number[];
    } | null;
    last_tested_at: string | null;
    last_test_status: number | null;
    last_test_error: string | null;
    created_at: string;
    updated_at: string;
};

export type ScheduledTaskStatus = 'completed' | 'failed' | 'skipped';

export type HubScheduledTask = {
    id: number;
    project_id: number;
    environment: string;
    server: string;
    task: string;
    description: string | null;
    expression: string | null;
    status: ScheduledTaskStatus;
    duration_ms: number | null;
    output: string | null;
    sent_at: string;
    created_at: string;
    updated_at: string;
};

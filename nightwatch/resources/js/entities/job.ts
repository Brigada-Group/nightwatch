export type JobStatus = 'completed' | 'failed';

export type HubJob = {
    id: number;
    project_id: number;
    environment: string;
    server: string;
    job_class: string;
    queue: string | null;
    connection: string | null;
    status: JobStatus;
    duration_ms: number | null;
    attempt: number | null;
    error_message: string | null;
    metadata: Record<string, unknown> | null;
    sent_at: string;
    created_at: string;
    updated_at: string;
};

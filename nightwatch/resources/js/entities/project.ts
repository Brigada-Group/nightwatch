export type ProjectStatus = 'normal' | 'warning' | 'critical' | 'unknown';

export type Project = {
    id: number;
    project_uuid: string;
    name: string;
    description: string | null;
    environment: string;
    status: ProjectStatus;
    last_heartbeat_at: string | null;
    api_token_last_four: string | null;
    metadata: {
        php_version?: string;
        laravel_version?: string;
    } | null;
    created_at: string;
    updated_at: string;
};

export type ProjectCredentials = {
    project_id: number;
    project_uuid: string;
    api_token: string;
    kind: 'created' | 'rotated';
};

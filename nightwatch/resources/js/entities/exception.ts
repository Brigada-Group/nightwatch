export type ExceptionAssignee = {
    id: number;
    name: string;
    email: string;
};

export type HubException = {
    id: number;
    project_id: number;
    environment: string;
    server: string;
    exception_class: string;
    message: string;
    file: string | null;
    line: number | null;
    url: string | null;
    status_code: number | null;
    user: string | null;
    ip: string | null;
    headers: string | null;
    stack_trace: string | null;
    severity: 'error' | 'warning' | 'info' | 'debug' | 'critical';
    sent_at: string;
    created_at: string;
    updated_at: string;
    assigned_to: number | null;
    assigned_by: number | null;
    assigned_at: string | null;
    assignee?: ExceptionAssignee | null;
    is_recurrence: boolean;
    original_exception_id: number | null;
    recurrence_count: number;
};

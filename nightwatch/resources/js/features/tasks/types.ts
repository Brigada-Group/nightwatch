export type TaskStatus = 'started' | 'ongoing' | 'review' | 'finished';

export const TASK_STATUSES: TaskStatus[] = [
    'started',
    'ongoing',
    'review',
    'finished',
];

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
    started: 'To be Started',
    ongoing: 'Ongoing',
    review: 'Review',
    finished: 'Finished',
};

export type TaskProject = {
    id: number;
    name: string;
};

export type TaskActor = {
    id: number;
    name: string;
    email?: string;
};

export type TaskSourceType = 'exception' | 'slow_query' | 'slow_request';

export type AiFixAttemptStatus =
    | 'queued'
    | 'running'
    | 'succeeded'
    | 'failed';

export type AiFixChange = {
    file_name: string;
    content: string;
    original_content?: string;
    original_truncated?: boolean;
    is_new_file?: boolean;
};

export type AiFixResult = {
    repo?: {
        full_name: string;
        branch: string;
        commit_sha?: string;
    };
    suspect_files?: string[];
    summary?: string;
    changes?: AiFixChange[];
    placeholder?: boolean;
    note?: string;
};

export type AiFixAttemptSummary = {
    id: number;
    status: AiFixAttemptStatus;
    created_at: string | null;
    error?: string | null;
    result?: AiFixResult | null;
    applied_at?: string | null;
    apply_pr_url?: string | null;
    apply_pr_number?: number | null;
    apply_branch_name?: string | null;
    apply_error?: string | null;
};

export type ProjectAiConfig = {
    use_ai: boolean;
};

export type ProjectAiConfigMap = Record<number, ProjectAiConfig>;

export type DeveloperTask = {
    id: number;
    source_type: TaskSourceType;
    exception_class: string;
    message: string;
    severity: string;
    environment: string | null;
    task_status: TaskStatus;
    sent_at: string | null;
    assigned_at: string | null;
    is_recurrence: boolean;
    project: TaskProject | null;
    assigned_by: TaskActor | null;
    latest_ai_fix_attempt: AiFixAttemptSummary | null;
};

export type ManagerTask = {
    id: number;
    source_type: TaskSourceType;
    exception_class: string;
    message: string;
    severity: string;
    environment: string | null;
    task_status: TaskStatus;
    sent_at: string | null;
    assigned_at: string | null;
    is_recurrence: boolean;
    project: TaskProject | null;
    assignee: TaskActor | null;
};

export type KanbanColumns = Record<TaskStatus, DeveloperTask[]>;

export type StatusCounts = {
    started: number;
    ongoing: number;
    review: number;
    finished: number;
    total: number;
    resolution_rate: number;
};

export type TopResolver = {
    user: { id: number; name: string; email: string };
    resolved_count: number;
};

export type WeeklyResolution = {
    week_start: string;
    label: string;
    count: number;
};

export type ManagerStats = {
    status_counts: StatusCounts;
    top_resolvers: TopResolver[];
    weekly_resolutions: WeeklyResolution[];
};

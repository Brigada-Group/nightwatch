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

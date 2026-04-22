export type EmailReportFrequency = 'daily' | 'weekly' | 'monthly';

export type EmailReportSection =
    | 'exceptions'
    | 'requests'
    | 'queries'
    | 'jobs'
    | 'audits'
    | 'health_checks'
    | 'outgoing_http';

export type EmailReportScope = 'all' | 'selected';

export type EmailReport = {
    id: number;
    user_id: number;
    email: string;
    frequency: EmailReportFrequency;
    timezone: string;
    send_hour: number;
    send_day_of_week: number | null;
    send_day_of_month: number | null;
    project_scope: EmailReportScope;
    project_ids: number[] | null;
    sections: EmailReportSection[] | null;
    enabled: boolean;
    last_sent_at: string | null;
    next_run_at: string | null;
    created_at: string;
    updated_at: string;
};

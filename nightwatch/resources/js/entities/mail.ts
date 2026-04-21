export type MailStatus = 'sent' | 'failed';

export type HubMail = {
    id: number;
    project_id: number;
    environment: string;
    server: string;
    mailable: string | null;
    subject: string | null;
    to: string | null;
    status: MailStatus;
    error_message: string | null;
    sent_at: string;
    created_at: string;
    updated_at: string;
};

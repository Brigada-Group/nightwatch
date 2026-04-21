export type NotificationStatus = 'sent' | 'failed';

export type HubNotification = {
    id: number;
    project_id: number;
    environment: string;
    server: string;
    notification_class: string;
    channel: string;
    notifiable_type: string;
    notifiable_id: number | null;
    status: NotificationStatus;
    error_message: string | null;
    sent_at: string;
    created_at: string;
    updated_at: string;
};

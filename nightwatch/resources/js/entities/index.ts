export type { Project, ProjectStatus, ProjectCredentials } from './project';
export type { HubException } from './exception';
export type { ClientErrorEvent } from './client-error-event';
export type { WebhookDestination } from './webhook-destination';
export type { HubRequest } from './request';
export type { HubQuery } from './query';
export type { HubJob, JobStatus } from './job';
export type { HubLog, LogLevel } from './log';
export type { HubOutgoingHttp } from './outgoing-http';
export type { HubMail, MailStatus } from './mail';
export type { HubNotification, NotificationStatus } from './notification';
export type { HubCache } from './cache';
export type { HubCommand } from './command';
export type { HubScheduledTask, ScheduledTaskStatus } from './scheduled-task';
export type { HubHealthCheck, HealthCheckStatus } from './health-check';
export type {
    HubComposerAudit,
    ComposerAdvisory,
    ComposerAdvisorySeverity,
    ComposerAbandonedPackage,
} from './composer-audit';
export type {
    HubNpmAudit,
    NpmVulnerability,
    NpmVulnerabilitySeverity,
    NpmAuditMetadata,
} from './npm-audit';
export type {
    EmailReport,
    EmailReportFrequency,
    EmailReportSection,
    EmailReportScope,
} from './email-report';

export type PaginatedResponse<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
};

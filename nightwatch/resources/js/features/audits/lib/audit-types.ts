import type { HubComposerAudit, HubNpmAudit } from '@/entities';
import type { WithProjectRelation } from '@/types/monitoring';

export type AuditKind = 'composer' | 'npm';

export type ComposerAuditDetails = WithProjectRelation<HubComposerAudit>;
export type NpmAuditDetails = WithProjectRelation<HubNpmAudit>;

export type ComposerAuditPageProps = {
    type: 'composer';
    audit: ComposerAuditDetails;
};

export type NpmAuditPageProps = {
    type: 'npm';
    audit: NpmAuditDetails;
};

export type AuditPageProps = ComposerAuditPageProps | NpmAuditPageProps;

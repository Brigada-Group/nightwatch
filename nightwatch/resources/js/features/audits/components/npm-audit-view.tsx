import { AlertTriangle, ShieldAlert } from 'lucide-react';
import { ToneChip } from '@/components/monitoring/tone-chip';
import type { NpmAuditDetails } from '../lib/audit-types';
import { AuditHero } from './audit-hero';
import { NpmMetadataSection } from './npm-metadata-section';
import { NpmVulnerabilitiesSection } from './npm-vulnerabilities-section';
import type { StatTileTone } from './stat-tile';
import { StatTile } from './stat-tile';

type Props = {
    audit: NpmAuditDetails;
    projectName: string;
    projectId: number;
};

type SeverityTile = {
    label: string;
    value: number;
    activeTone: StatTileTone;
};

function buildHeroBadge(audit: NpmAuditDetails) {
    if (audit.total_vulnerabilities === 0) {
        return <ToneChip kind="health" value="ok" label="Clean" />;
    }

    if (audit.critical_count > 0) {
        return (
            <ToneChip
                kind="severity"
                value="critical"
                label={`${audit.critical_count} critical`}
            />
        );
    }

    return (
        <ToneChip
            kind="severity"
            value="warning"
            label={`${audit.total_vulnerabilities} vulnerabilities`}
        />
    );
}

export function NpmAuditView({ audit, projectName, projectId }: Props) {
    const vulnerabilities = audit.vulnerabilities ?? [];
    const metadata = audit.audit_metadata ?? {};

    const severityTiles: SeverityTile[] = [
        {
            label: 'Total',
            value: audit.total_vulnerabilities,
            activeTone: 'warning',
        },
        {
            label: 'Critical',
            value: audit.critical_count,
            activeTone: 'critical',
        },
        { label: 'High', value: audit.high_count, activeTone: 'warning' },
        {
            label: 'Moderate',
            value: audit.moderate_count,
            activeTone: 'warning',
        },
        { label: 'Low', value: audit.low_count, activeTone: 'info' },
        { label: 'Info', value: audit.info_count, activeTone: 'neutral' },
    ];

    return (
        <div className="flex flex-col gap-6">
            <AuditHero
                kind="npm"
                projectName={projectName}
                projectId={projectId}
                environment={audit.environment}
                server={audit.server}
                sentAt={audit.sent_at}
                title={`npm audit · ${projectName}`}
                subtitle="Snapshot of JavaScript dependency vulnerabilities at the time of this report."
                badge={buildHeroBadge(audit)}
            />

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                {severityTiles.map((tile) => {
                    const Icon =
                        tile.label === 'Critical' ? ShieldAlert : AlertTriangle;
                    const tone: StatTileTone =
                        tile.value > 0 ? tile.activeTone : 'neutral';

                    return (
                        <StatTile
                            key={tile.label}
                            label={tile.label}
                            value={tile.value}
                            tone={tone}
                            icon={Icon}
                        />
                    );
                })}
            </div>

            <NpmVulnerabilitiesSection vulnerabilities={vulnerabilities} />
            <NpmMetadataSection metadata={metadata} />
        </div>
    );
}

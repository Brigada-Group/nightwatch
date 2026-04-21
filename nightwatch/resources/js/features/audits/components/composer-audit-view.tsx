import { FileWarning, PackageX } from 'lucide-react';
import { ToneChip } from '@/components/monitoring/tone-chip';
import type { ComposerAuditDetails } from '../lib/audit-types';
import { AuditHero } from './audit-hero';
import { ComposerAbandonedSection } from './composer-abandoned-section';
import { ComposerAdvisoriesSection } from './composer-advisories-section';
import { StatTile } from './stat-tile';

type Props = {
    audit: ComposerAuditDetails;
    projectName: string;
    projectId: number;
};

function buildHeroBadge(totalIssues: number) {
    if (totalIssues === 0) {
        return <ToneChip kind="health" value="ok" label="Clean" />;
    }

    return (
        <ToneChip
            kind="severity"
            value="warning"
            label={`${totalIssues} issue${totalIssues === 1 ? '' : 's'}`}
        />
    );
}

export function ComposerAuditView({ audit, projectName, projectId }: Props) {
    const advisories = audit.advisories ?? [];
    const abandoned = audit.abandoned ?? [];
    const totalIssues = audit.advisories_count + audit.abandoned_count;

    return (
        <div className="flex flex-col gap-6">
            <AuditHero
                kind="composer"
                projectName={projectName}
                projectId={projectId}
                environment={audit.environment}
                server={audit.server}
                sentAt={audit.sent_at}
                title={`Composer audit · ${projectName}`}
                subtitle="Snapshot of PHP dependency advisories and abandoned packages at the time of this report."
                badge={buildHeroBadge(totalIssues)}
            />

            <div className="grid gap-3 sm:grid-cols-2">
                <StatTile
                    label="Advisories"
                    value={audit.advisories_count}
                    tone={audit.advisories_count > 0 ? 'warning' : 'neutral'}
                    icon={FileWarning}
                />
                <StatTile
                    label="Abandoned"
                    value={audit.abandoned_count}
                    tone={audit.abandoned_count > 0 ? 'info' : 'neutral'}
                    icon={PackageX}
                />
            </div>

            <ComposerAdvisoriesSection advisories={advisories} />
            <ComposerAbandonedSection abandoned={abandoned} />
        </div>
    );
}

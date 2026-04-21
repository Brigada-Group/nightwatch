import { FileWarning, ShieldCheck } from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import type { ComposerAdvisory } from '@/entities';
import { sortBySeverity } from '../lib/severity';
import { AuditSectionCard } from './audit-section-card';
import { EmptyState } from './empty-state';
import { SeverityBadge } from './severity-badge';

type Props = {
    advisories: ComposerAdvisory[];
};

export function ComposerAdvisoriesSection({ advisories }: Props) {
    const sorted = sortBySeverity(advisories);

    return (
        <AuditSectionCard
            icon={FileWarning}
            iconClassName="text-amber-300"
            title="Advisories"
            description="Security advisories affecting Composer dependencies"
            count={advisories.length}
            isEmpty={sorted.length === 0}
            emptyState={
                <EmptyState
                    icon={ShieldCheck}
                    title="No advisories"
                    description="This audit didn't flag any security advisories."
                />
            }
        >
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Package</TableHead>
                        <TableHead>Severity</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>CVE</TableHead>
                        <TableHead>Affected</TableHead>
                        <TableHead>Recommendation</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sorted.map((advisory, idx) => (
                        <TableRow key={advisory.id ?? idx}>
                            <TableCell className="font-mono text-xs text-zinc-200">
                                {advisory.package}
                            </TableCell>
                            <TableCell>
                                <SeverityBadge severity={advisory.severity} />
                            </TableCell>
                            <TableCell className="max-w-md text-sm">
                                {advisory.title}
                            </TableCell>
                            <TableCell className="font-mono text-xs text-zinc-400">
                                {advisory.cve ?? '—'}
                            </TableCell>
                            <TableCell className="font-mono text-xs text-zinc-400">
                                {advisory.affected_versions ?? '—'}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-xs">
                                {advisory.recommendation ?? '—'}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </AuditSectionCard>
    );
}

import { AlertTriangle, ShieldCheck } from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import type { NpmVulnerability } from '@/entities';
import { sortBySeverity } from '../lib/severity';
import { AuditSectionCard } from './audit-section-card';
import { EmptyState } from './empty-state';
import { SeverityBadge } from './severity-badge';

type Props = {
    vulnerabilities: NpmVulnerability[];
};

export function NpmVulnerabilitiesSection({ vulnerabilities }: Props) {
    const sorted = sortBySeverity(vulnerabilities);

    return (
        <AuditSectionCard
            icon={AlertTriangle}
            iconClassName="text-rose-300"
            title="Vulnerabilities"
            description="JavaScript package vulnerabilities reported by npm audit"
            count={vulnerabilities.length}
            isEmpty={sorted.length === 0}
            emptyState={
                <EmptyState
                    icon={ShieldCheck}
                    title="No vulnerabilities"
                    description="All JavaScript dependencies in this snapshot are clean."
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
                        <TableHead>Affected range</TableHead>
                        <TableHead>Fix</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sorted.map((vuln, idx) => (
                        <TableRow key={vuln.id ?? idx}>
                            <TableCell className="font-mono text-xs text-zinc-200">
                                {vuln.package}
                            </TableCell>
                            <TableCell>
                                <SeverityBadge severity={vuln.severity} />
                            </TableCell>
                            <TableCell className="max-w-md text-sm">
                                {vuln.title}
                            </TableCell>
                            <TableCell className="font-mono text-xs text-zinc-400">
                                {vuln.cve ?? '—'}
                            </TableCell>
                            <TableCell className="font-mono text-xs text-zinc-400">
                                {vuln.range ?? '—'}
                            </TableCell>
                            <TableCell className="font-mono text-xs text-emerald-300/80">
                                {vuln.fix ?? '—'}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </AuditSectionCard>
    );
}

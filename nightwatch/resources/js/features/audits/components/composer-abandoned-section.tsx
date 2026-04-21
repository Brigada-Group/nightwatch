import { PackageX, ShieldCheck } from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import type { ComposerAbandonedPackage } from '@/entities';
import { formatDateTime } from '../lib/format';
import { AuditSectionCard } from './audit-section-card';
import { EmptyState } from './empty-state';

type Props = {
    abandoned: ComposerAbandonedPackage[];
};

export function ComposerAbandonedSection({ abandoned }: Props) {
    return (
        <AuditSectionCard
            icon={PackageX}
            iconClassName="text-orange-300"
            title="Abandoned packages"
            description="Packages flagged as abandoned by their maintainers"
            count={abandoned.length}
            isEmpty={abandoned.length === 0}
            emptyState={
                <EmptyState
                    icon={ShieldCheck}
                    title="Nothing abandoned"
                    description="All Composer packages in this snapshot are actively maintained."
                />
            }
        >
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Package</TableHead>
                        <TableHead>Replacement</TableHead>
                        <TableHead>Detected</TableHead>
                        <TableHead>Note</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {abandoned.map((item, idx) => (
                        <TableRow key={`${item.package}-${idx}`}>
                            <TableCell className="font-mono text-xs text-zinc-200">
                                {item.package}
                            </TableCell>
                            <TableCell className="font-mono text-xs text-zinc-400">
                                {item.replacement ?? (
                                    <span className="text-zinc-500">
                                        No replacement
                                    </span>
                                )}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-xs">
                                {formatDateTime(item.detected_at)}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-xs">
                                {item.note ?? '—'}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </AuditSectionCard>
    );
}

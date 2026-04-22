import { monitoringCardClass } from '@/components/monitoring/monitoring-surface';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import type { NpmAuditMetadata } from '@/entities';
import { cn } from '@/lib/utils';

type Props = {
    metadata: NpmAuditMetadata;
};

function renderValue(value: unknown): string {
    if (typeof value === 'object') {
        return JSON.stringify(value);
    }

    return String(value);
}

export function NpmMetadataSection({ metadata }: Props) {
    const entries = Object.entries(metadata).filter(
        ([, v]) => v !== null && v !== undefined,
    );

    if (entries.length === 0) {
        return null;
    }

    return (
        <Card className={cn(monitoringCardClass, 'gap-0 py-0')}>
            <CardHeader className="border-b border-border pb-3 pt-5">
                <CardTitle className="text-base text-foreground">
                    Audit metadata
                </CardTitle>
                <CardDescription>
                    Diagnostic context from the npm audit run
                </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
                <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {entries.map(([key, value]) => (
                        <div
                            key={key}
                            className="rounded-lg border border-border bg-muted/50 p-3"
                        >
                            <dt className="text-muted-foreground text-[11px] uppercase tracking-wider">
                                {key.replace(/_/g, ' ')}
                            </dt>
                            <dd className="mt-1 break-all font-mono text-xs text-foreground">
                                {renderValue(value)}
                            </dd>
                        </div>
                    ))}
                </dl>
            </CardContent>
        </Card>
    );
}

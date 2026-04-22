import {
    CalendarClock,
    Hash,
    Layers,
    Package,
    Server,
    ShieldAlert,
    ShieldCheck,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { AuditKind } from '../lib/audit-types';
import { formatDateTime } from '../lib/format';
import { MetaPill } from './meta-pill';

const ACCENT: Record<AuditKind, string> = {
    composer:
        'from-violet-500/10 via-background/95 to-indigo-500/10 dark:from-violet-600/20 dark:via-background/90 dark:to-indigo-600/15',
    npm: 'from-emerald-500/10 via-background/95 to-cyan-500/10 dark:from-emerald-600/18 dark:via-background/90 dark:to-cyan-600/18',
};

type Props = {
    kind: AuditKind;
    projectName: string;
    projectId: number;
    environment: string;
    server: string;
    sentAt: string;
    title: string;
    subtitle: string;
    badge: ReactNode;
};

export function AuditHero({
    kind,
    projectName,
    projectId,
    environment,
    server,
    sentAt,
    title,
    subtitle,
    badge,
}: Props) {
    const KindIcon = kind === 'composer' ? ShieldCheck : ShieldAlert;
    const kindIconColor =
        kind === 'composer'
            ? 'text-violet-600 dark:text-violet-300'
            : 'text-emerald-600 dark:text-emerald-300';
    const kindLabel = kind === 'composer' ? 'Composer audit' : 'npm audit';

    return (
        <div
            className={cn(
                'relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br p-6 shadow-sm dark:shadow-[0_32px_80px_-32px_rgba(0,0,0,0.9)] md:p-8',
                ACCENT[kind],
            )}
        >
            <div className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-violet-500/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -left-16 size-64 rounded-full bg-cyan-500/15 blur-3xl" />

            <div className="relative flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                        <KindIcon className={cn('size-5', kindIconColor)} />
                        <Badge
                            variant="outline"
                            className="border-border bg-muted/50 uppercase tracking-wider"
                        >
                            {kindLabel}
                        </Badge>
                        {badge}
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                        {title}
                    </h1>
                    <p className="text-muted-foreground max-w-2xl text-sm">
                        {subtitle}
                    </p>

                    <div className="flex flex-wrap gap-2 pt-1">
                        <MetaPill
                            icon={Package}
                            label="Project"
                            value={projectName}
                        />
                        <MetaPill
                            icon={Hash}
                            label="ID"
                            value={`#${projectId}`}
                        />
                        <MetaPill
                            icon={Layers}
                            label="Env"
                            value={environment}
                        />
                        <MetaPill icon={Server} label="Server" value={server} />
                    </div>
                </div>

                <div className="text-muted-foreground flex flex-col gap-1 text-right text-xs md:text-sm">
                    <span className="inline-flex items-center justify-end gap-1.5">
                        <CalendarClock className="size-3.5" />
                        Reported
                    </span>
                    <span className="text-foreground font-medium">
                        {formatDateTime(sentAt)}
                    </span>
                </div>
            </div>
        </div>
    );
}

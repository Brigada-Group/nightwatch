import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { monitoringCardClass } from '@/components/monitoring/monitoring-surface';
import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';

type Props = {
    icon: LucideIcon;
    iconClassName?: string;
    title: string;
    description: string;
    count: number;
    isEmpty: boolean;
    emptyState: ReactNode;
    children: ReactNode;
};

export function AuditSectionCard({
    icon: Icon,
    iconClassName,
    title,
    description,
    count,
    isEmpty,
    emptyState,
    children,
}: Props) {
    return (
        <Card className={cn(monitoringCardClass, 'gap-0 py-0')}>
            <CardHeader className="border-b border-white/[0.06] pb-3 pt-5">
                <CardTitle className="flex items-center gap-2 text-base text-white">
                    <Icon className={cn('size-4', iconClassName)} />
                    {title}
                    <Badge
                        variant="outline"
                        className="ml-1 border-white/15 bg-white/[0.04]"
                    >
                        {count}
                    </Badge>
                </CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
                {isEmpty ? emptyState : children}
            </CardContent>
        </Card>
    );
}

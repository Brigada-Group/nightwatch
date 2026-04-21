import { usePage } from '@inertiajs/react';
import { useMemo } from 'react';
import type { AuditPageProps } from '../lib/audit-types';

type DerivedAuditPage = AuditPageProps & {
    projectName: string;
    projectId: number;
    pageTitle: string;
    kindLabel: string;
};

export function useAuditPage(): DerivedAuditPage {
    const props = usePage<AuditPageProps>().props;

    return useMemo(() => {
        const { audit, type } = props;
        const projectId = audit.project?.id ?? audit.project_id;
        const projectName = audit.project?.name ?? `Project #${projectId}`;
        const kindLabel = type === 'composer' ? 'Composer audit' : 'npm audit';
        const pageTitle = `${kindLabel} · ${projectName}`;

        return {
            ...props,
            projectName,
            projectId,
            pageTitle,
            kindLabel,
        };
    }, [props]);
}

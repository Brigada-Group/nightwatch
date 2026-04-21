import { Head, Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ComposerAuditView } from '@/features/audits/components/composer-audit-view';
import { NpmAuditView } from '@/features/audits/components/npm-audit-view';
import { useAuditPage } from '@/features/audits/hooks/use-audit-page';

export default function AuditShow() {
    const page = useAuditPage();

    return (
        <>
            <Head title={page.pageTitle} />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <Button
                    variant="ghost"
                    size="sm"
                    className="w-fit gap-2 px-2"
                    asChild
                >
                    <Link href="/audits">
                        <ArrowLeft className="size-4" />
                        Audits
                    </Link>
                </Button>

                {page.type === 'composer' ? (
                    <ComposerAuditView
                        audit={page.audit}
                        projectName={page.projectName}
                        projectId={page.projectId}
                    />
                ) : (
                    <NpmAuditView
                        audit={page.audit}
                        projectName={page.projectName}
                        projectId={page.projectId}
                    />
                )}
            </div>
        </>
    );
}

AuditShow.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Audits', href: '/audits' },
        { title: 'Details', href: '#' },
    ],
};

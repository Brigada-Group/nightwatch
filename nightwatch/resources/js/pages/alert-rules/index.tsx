import { Head, usePage } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import * as React from 'react';
import { ResourcePageHeader } from '@/components/monitoring/resource-page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertRuleFormDialog } from '@/features/alert-rules/components/AlertRuleFormDialog';
import { AlertRulesTable } from '@/features/alert-rules/components/AlertRulesTable';
import { DeleteRuleAlertDialog } from '@/features/alert-rules/components/DeleteRuleAlertDialog';
import { RecentFiringsTable } from '@/features/alert-rules/components/RecentFiringsTable';
import { useAlertRuleEditor } from '@/features/alert-rules/hooks/useAlertRuleEditor';
import type {
    AlertRule,
    AlertRulesPageProps,
} from '@/features/alert-rules/types';

export default function AlertRulesIndex() {
    const {
        rules,
        recentFirings,
        projects,
        webhookDestinations,
        ruleTypes,
        severities,
    } = usePage<AlertRulesPageProps>().props;

    const editor = useAlertRuleEditor();
    const [deleting, setDeleting] = React.useState<AlertRule | null>(null);

    return (
        <>
            <Head title="Alert rules" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <ResourcePageHeader
                    title="Alert rules"
                    description="Periodic checks that fire webhooks when monitored data crosses your thresholds. Evaluated every minute."
                    toolbar={
                        <Button onClick={editor.openCreate} className="gap-2">
                            <Plus className="size-4" />
                            New alert rule
                        </Button>
                    }
                />

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Rules</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 pt-0">
                        <AlertRulesTable
                            rules={rules}
                            onEdit={editor.openEdit}
                            onDelete={setDeleting}
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">
                            Recent firings
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 pt-0">
                        <RecentFiringsTable firings={recentFirings} />
                    </CardContent>
                </Card>
            </div>

            <AlertRuleFormDialog
                isOpen={editor.isOpen}
                editing={editor.editing}
                submitting={editor.submitting}
                form={editor.form}
                onPatch={editor.patch}
                onToggleDestination={editor.toggleDestination}
                onAddEmail={editor.addEmail}
                onRemoveEmail={editor.removeEmail}
                onSubmit={editor.submit}
                onOpenChange={editor.setIsOpen}
                projects={projects}
                webhookDestinations={webhookDestinations}
                ruleTypes={ruleTypes}
                severities={severities}
            />

            <DeleteRuleAlertDialog
                rule={deleting}
                onClose={() => setDeleting(null)}
            />
        </>
    );
}

AlertRulesIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Alert rules', href: '/alert-rules' },
    ],
};

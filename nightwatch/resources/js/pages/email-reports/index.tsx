import { Head, router, usePage } from '@inertiajs/react';
import { Mail, Pencil, Plus, Trash2 } from 'lucide-react';
import * as React from 'react';
import { monitoringCardClass } from '@/components/monitoring/monitoring-surface';
import { ResourcePageHeader } from '@/components/monitoring/resource-page-header';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import type {
    EmailReport,
    EmailReportFrequency,
    EmailReportSection,
} from '@/entities';
import { EmailReportFormDialog } from '@/features/email-reports/components/email-report-form';
import { cn } from '@/lib/utils';
import type { ProjectOption } from '@/types/monitoring';

type PageProps = {
    reports: EmailReport[];
    projectOptions: ProjectOption[];
    timezones: string[];
    defaults: {
        sections: EmailReportSection[];
        frequencies: EmailReportFrequency[];
    };
};

function fmt(dt: string | null): string {
    if (!dt) {
        return '—';
    }

    return new Date(dt).toLocaleString();
}

function cadenceLabel(report: EmailReport): string {
    const hour = report.send_hour.toString().padStart(2, '0');

    if (report.frequency === 'daily') {
        return `Daily at ${hour}:00 · ${report.timezone}`;
    }

    if (report.frequency === 'weekly') {
        const d = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        return `Weekly · ${d[report.send_day_of_week ?? 1]} ${hour}:00 · ${report.timezone}`;
    }

    return `Monthly · day ${report.send_day_of_month ?? 1} at ${hour}:00 · ${report.timezone}`;
}

export default function EmailReportsIndex() {
    const { reports, projectOptions, timezones, defaults } =
        usePage<PageProps>().props;

    const [dialogOpen, setDialogOpen] = React.useState(false);
    const [editing, setEditing] = React.useState<EmailReport | null>(null);
    const [deleting, setDeleting] = React.useState<EmailReport | null>(null);

    const openCreate = () => {
        setEditing(null);
        setDialogOpen(true);
    };

    const openEdit = (report: EmailReport) => {
        setEditing(report);
        setDialogOpen(true);
    };

    const confirmDelete = () => {
        if (!deleting) {
            return;
        }

        router.delete(`/email-reports/${deleting.id}`, {
            preserveScroll: true,
            onFinish: () => setDeleting(null),
        });
    };

    return (
        <>
            <Head title="Email Reports" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <ResourcePageHeader
                    title="Email Reports"
                    description="Schedule recurring monitoring reports and deliver them to any email address."
                    toolbar={
                        <Button
                            type="button"
                            onClick={openCreate}
                            className="gap-2 bg-gradient-to-br from-violet-500 to-cyan-500 text-white hover:from-violet-400 hover:to-cyan-400"
                        >
                            <Plus className="size-4" />
                            New report
                        </Button>
                    }
                />

                <Card className={cn(monitoringCardClass, 'gap-0 py-0')}>
                    <CardContent className="p-0 pt-4">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Recipient</TableHead>
                                    <TableHead>Cadence</TableHead>
                                    <TableHead>Scope</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Last sent</TableHead>
                                    <TableHead>Next run</TableHead>
                                    <TableHead className="w-[120px] text-right">
                                        Actions
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {reports.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={7}
                                            className="text-muted-foreground py-12 text-center text-sm"
                                        >
                                            <Mail className="mx-auto mb-2 size-5 opacity-60" />
                                            No reports yet. Create one to start receiving
                                            scheduled monitoring digests.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    reports.map((r) => (
                                        <TableRow key={r.id}>
                                            <TableCell className="font-medium text-foreground">
                                                {r.email}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-xs">
                                                {cadenceLabel(r)}
                                            </TableCell>
                                            <TableCell className="text-xs">
                                                {r.project_scope === 'all' ? (
                                                    <Badge variant="outline">
                                                        All projects
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="secondary">
                                                        {(r.project_ids ?? []).length}{' '}
                                                        selected
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {r.enabled ? (
                                                    <Badge className="bg-emerald-500/15 text-emerald-300">
                                                        Enabled
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline">
                                                        Paused
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-xs">
                                                {fmt(r.last_sent_at)}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-xs">
                                                {fmt(r.next_run_at)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="inline-flex items-center gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="gap-1"
                                                        onClick={() => openEdit(r)}
                                                    >
                                                        <Pencil className="size-3.5" />
                                                        Edit
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="gap-1 text-rose-600 hover:bg-rose-500/10 hover:text-rose-700 dark:text-rose-300 dark:hover:text-rose-200"
                                                        onClick={() =>
                                                            setDeleting(r)
                                                        }
                                                    >
                                                        <Trash2 className="size-3.5" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            <EmailReportFormDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                report={editing}
                projectOptions={projectOptions}
                timezones={timezones}
                sections={defaults.sections}
                frequencies={defaults.frequencies}
            />

            <AlertDialog
                open={deleting !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setDeleting(null);
                    }
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remove email report?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will stop sending {deleting?.frequency} reports to{' '}
                            <span className="text-foreground font-medium">
                                {deleting?.email}
                            </span>
                            . You can always create a new one later.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            className="bg-rose-500 text-white hover:bg-rose-400"
                        >
                            Remove
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

EmailReportsIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Email Reports', href: '/email-reports' },
    ],
};

import { useForm } from '@inertiajs/react';
import * as React from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import type {
    EmailReport,
    EmailReportFrequency,
    EmailReportScope,
    EmailReportSection,
} from '@/entities';
import { cn } from '@/lib/utils';
import type { ProjectOption } from '@/types/monitoring';

type FormShape = {
    email: string;
    frequency: EmailReportFrequency;
    timezone: string;
    send_hour: number;
    send_day_of_week: number;
    send_day_of_month: number;
    project_scope: EmailReportScope;
    project_ids: number[];
    sections: EmailReportSection[];
    enabled: boolean;
};

const SECTION_LABELS: Record<EmailReportSection, string> = {
    exceptions: 'Exceptions',
    requests: 'Requests',
    queries: 'Queries',
    jobs: 'Jobs',
    audits: 'Dependency audits',
    health_checks: 'Health checks',
    outgoing_http: 'Outgoing HTTP',
};

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    report: EmailReport | null;
    projectOptions: ProjectOption[];
    timezones: string[];
    sections: EmailReportSection[];
    frequencies: EmailReportFrequency[];
};

export function EmailReportFormDialog({
    open,
    onOpenChange,
    report,
    projectOptions,
    timezones,
    sections,
    frequencies,
}: Props) {
    const initialValues = React.useMemo<FormShape>(
        () => buildInitialValues(report, sections),
        [report, sections],
    );

    const form = useForm<FormShape>(initialValues);

    React.useEffect(() => {
        if (open) {
            form.setData(initialValues);
            form.clearErrors();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, initialValues]);

    const submit: React.FormEventHandler<HTMLFormElement> = (event) => {
        event.preventDefault();

        form.transform((data) => ({
            ...data,
            project_ids:
                data.project_scope === 'selected' ? data.project_ids : [],
        }));

        const options = {
            preserveScroll: true,
            onSuccess: () => onOpenChange(false),
        };

        if (report) {
            form.patch(`/email-reports/${report.id}`, options);
        } else {
            form.post('/email-reports', options);
        }
    };

    const toggleSection = (section: EmailReportSection, checked: boolean) => {
        const current = new Set(form.data.sections);

        if (checked) {
            current.add(section);
        } else {
            current.delete(section);
        }

        form.setData('sections', Array.from(current) as EmailReportSection[]);
    };

    const toggleProject = (id: number, checked: boolean) => {
        const current = new Set(form.data.project_ids);

        if (checked) {
            current.add(id);
        } else {
            current.delete(id);
        }

        form.setData('project_ids', Array.from(current));
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>
                        {report ? 'Edit email report' : 'New email report'}
                    </DialogTitle>
                    <DialogDescription>
                        Configure who receives scheduled monitoring reports and what
                        they include.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={submit} className="space-y-5">
                    <div className="grid gap-2">
                        <Label htmlFor="email">Recipient email</Label>
                        <Input
                            id="email"
                            type="email"
                            required
                            maxLength={190}
                            value={form.data.email}
                            onChange={(e) => form.setData('email', e.target.value)}
                        />
                        <InputError message={form.errors.email} />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="grid gap-2">
                            <Label>Frequency</Label>
                            <Select
                                value={form.data.frequency}
                                onValueChange={(v) =>
                                    form.setData(
                                        'frequency',
                                        v as EmailReportFrequency,
                                    )
                                }
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {frequencies.map((f) => (
                                        <SelectItem key={f} value={f}>
                                            {f.charAt(0).toUpperCase() + f.slice(1)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={form.errors.frequency} />
                        </div>

                        <div className="grid gap-2">
                            <Label>Send hour (0–23)</Label>
                            <Input
                                type="number"
                                min={0}
                                max={23}
                                value={form.data.send_hour}
                                onChange={(e) =>
                                    form.setData(
                                        'send_hour',
                                        clamp(parseInt(e.target.value, 10) || 0, 0, 23),
                                    )
                                }
                            />
                            <InputError message={form.errors.send_hour} />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label>Timezone</Label>
                        <Select
                            value={form.data.timezone}
                            onValueChange={(v) => form.setData('timezone', v)}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="max-h-72">
                                {timezones.map((tz) => (
                                    <SelectItem key={tz} value={tz}>
                                        {tz}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError message={form.errors.timezone} />
                    </div>

                    {form.data.frequency === 'weekly' && (
                        <div className="grid gap-2">
                            <Label>Day of week</Label>
                            <div className="flex flex-wrap gap-2">
                                {WEEKDAY_LABELS.map((label, i) => (
                                    <button
                                        key={label}
                                        type="button"
                                        onClick={() =>
                                            form.setData('send_day_of_week', i)
                                        }
                                        className={cn(
                                            'rounded-md border px-3 py-1.5 text-xs transition',
                                            form.data.send_day_of_week === i
                                                ? 'border-violet-500/50 bg-violet-500/15 text-violet-700 dark:text-violet-100'
                                                : 'border-border bg-muted/40 text-muted-foreground hover:bg-accent dark:bg-white/[0.03] dark:hover:bg-white/[0.06]',
                                        )}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                            <InputError message={form.errors.send_day_of_week} />
                        </div>
                    )}

                    {form.data.frequency === 'monthly' && (
                        <div className="grid gap-2">
                            <Label>Day of month (1–28)</Label>
                            <Input
                                type="number"
                                min={1}
                                max={28}
                                value={form.data.send_day_of_month}
                                onChange={(e) =>
                                    form.setData(
                                        'send_day_of_month',
                                        clamp(parseInt(e.target.value, 10) || 1, 1, 28),
                                    )
                                }
                            />
                            <InputError message={form.errors.send_day_of_month} />
                        </div>
                    )}

                    <div className="grid gap-2">
                        <Label>Which projects to include</Label>
                        <div className="flex gap-2">
                            {(['all', 'selected'] as EmailReportScope[]).map((opt) => (
                                <button
                                    key={opt}
                                    type="button"
                                    onClick={() => form.setData('project_scope', opt)}
                                    className={cn(
                                        'rounded-md border px-3 py-1.5 text-xs capitalize transition',
                                        form.data.project_scope === opt
                                            ? 'border-cyan-500/50 bg-cyan-500/15 text-cyan-700 dark:text-cyan-100'
                                            : 'border-border bg-muted/40 text-muted-foreground hover:bg-accent dark:bg-white/[0.03] dark:hover:bg-white/[0.06]',
                                    )}
                                >
                                    {opt === 'all' ? 'All projects' : 'Selected projects'}
                                </button>
                            ))}
                        </div>
                        {form.data.project_scope === 'selected' && (
                            <div className="mt-2 grid max-h-48 gap-2 overflow-y-auto rounded-md border border-border bg-muted/40 p-3 dark:bg-black/20">
                                {projectOptions.length === 0 ? (
                                    <p className="text-muted-foreground text-xs">
                                        No projects available. Add a project first.
                                    </p>
                                ) : (
                                    projectOptions.map((p) => (
                                        <label
                                            key={p.id}
                                            className="flex items-center gap-2 text-sm"
                                        >
                                            <Checkbox
                                                checked={form.data.project_ids.includes(
                                                    p.id,
                                                )}
                                                onCheckedChange={(c) =>
                                                    toggleProject(p.id, c === true)
                                                }
                                            />
                                            <span>{p.name}</span>
                                        </label>
                                    ))
                                )}
                            </div>
                        )}
                        <InputError message={form.errors.project_ids} />
                    </div>

                    <div className="grid gap-2">
                        <Label>Sections to include</Label>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                            {sections.map((s) => (
                                <label
                                    key={s}
                                    className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2 text-sm dark:bg-white/[0.02]"
                                >
                                    <Checkbox
                                        checked={form.data.sections.includes(s)}
                                        onCheckedChange={(c) =>
                                            toggleSection(s, c === true)
                                        }
                                    />
                                    <span>{SECTION_LABELS[s] ?? s}</span>
                                </label>
                            ))}
                        </div>
                        <InputError message={form.errors.sections} />
                    </div>

                    <div className="flex items-center justify-between rounded-md border border-border bg-muted/30 px-4 py-3 dark:bg-white/[0.02]">
                        <div>
                            <div className="text-sm font-medium text-foreground">
                                Enabled
                            </div>
                            <div className="text-muted-foreground text-xs">
                                Paused reports are kept but won't send.
                            </div>
                        </div>
                        <Switch
                            checked={form.data.enabled}
                            onCheckedChange={(c) => form.setData('enabled', c)}
                        />
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={form.processing}
                            className="bg-gradient-to-br from-violet-500 to-cyan-500 text-white hover:from-violet-400 hover:to-cyan-400"
                        >
                            {form.processing
                                ? 'Saving…'
                                : report
                                  ? 'Save changes'
                                  : 'Schedule report'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function buildInitialValues(
    report: EmailReport | null,
    sections: EmailReportSection[],
): FormShape {
    if (!report) {
        return {
            email: '',
            frequency: 'weekly',
            timezone: resolveTimezone(),
            send_hour: 8,
            send_day_of_week: 1,
            send_day_of_month: 1,
            project_scope: 'all',
            project_ids: [],
            sections: [...sections],
            enabled: true,
        };
    }

    return {
        email: report.email,
        frequency: report.frequency,
        timezone: report.timezone,
        send_hour: report.send_hour,
        send_day_of_week: report.send_day_of_week ?? 1,
        send_day_of_month: report.send_day_of_month ?? 1,
        project_scope: report.project_scope,
        project_ids: report.project_ids ?? [],
        sections: (report.sections ?? sections) as EmailReportSection[],
        enabled: report.enabled,
    };
}

function resolveTimezone(): string {
    try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    } catch {
        return 'UTC';
    }
}

function clamp(n: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, n));
}

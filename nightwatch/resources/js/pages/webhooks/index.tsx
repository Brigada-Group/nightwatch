import { Head, router, usePage } from '@inertiajs/react';
import { ChevronsUpDown, Pencil, Plus, Trash2, Webhook as WebhookIcon } from 'lucide-react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import type { WebhookDestination } from '@/entities';
import { cn } from '@/lib/utils';

type PageProps = {
    destinations: WebhookDestination[];
    eventTypes: string[];
    providers: Array<'generic' | 'slack' | 'discord'>;
};

type FormState = {
    name: string;
    provider: 'generic' | 'slack' | 'discord';
    url: string;
    secret: string;
    enabled: boolean;
    subscribed_events: string[];
};

const EMPTY_FORM: FormState = {
    name: '',
    provider: 'generic',
    url: '',
    secret: '',
    enabled: true,
    subscribed_events: ['exception.created'],
};

/** Short helper text for each webhook event type (unknown keys fall back to event name only). */
const WEBHOOK_EVENT_HINTS: Partial<Record<string, string>> = {
    'exception.created': 'Unhandled exception reported from the app.',
    'job.failed': 'Queue job failed after retries.',
    'health.failed': 'Health check returned failing status.',
    'log.critical': 'Application logged at critical level.',
    'client_error.created': '4xx error page or client error capture.',
    'request.server_error': 'HTTP response status 5xx.',
    'request.client_error': 'HTTP response status 4xx.',
    'query.slow': 'Database query exceeded the slow threshold.',
    'query.n_plus_one': 'N+1 query pattern detected.',
    'outgoing_http.failed': 'Outbound HTTP request failed.',
    'mail.failed': 'Outgoing mail send failed.',
    'notification.failed': 'Notification channel delivery failed.',
    'command.failed': 'Artisan/command exited with non-zero code.',
    'scheduled_task.failed': 'Scheduled task run failed.',
    'composer_audit.issues_found': 'Composer audit reported advisories or abandoned packages.',
    'npm_audit.issues_found': 'npm audit reported vulnerabilities.',
};

function buildFormState(destination: WebhookDestination | null): FormState {
    if (!destination) {
        return EMPTY_FORM;
    }

    return {
        name: destination.name,
        provider: destination.provider,
        url: destination.url,
        secret: destination.secret ?? '',
        enabled: destination.enabled,
        subscribed_events: destination.subscribed_events ?? [],
    };
}

export default function WebhooksIndex() {
    const { destinations, eventTypes, providers } = usePage<PageProps>().props;

    const [dialogOpen, setDialogOpen] = React.useState(false);
    const [eventsPickerOpen, setEventsPickerOpen] = React.useState(false);
    const [editing, setEditing] = React.useState<WebhookDestination | null>(null);
    const [deleting, setDeleting] = React.useState<WebhookDestination | null>(null);
    const [form, setForm] = React.useState<FormState>(EMPTY_FORM);

    const openCreate = () => {
        setEditing(null);
        setForm(EMPTY_FORM);
        setEventsPickerOpen(false);
        setDialogOpen(true);
    };

    const openEdit = (destination: WebhookDestination) => {
        setEditing(destination);
        setForm(buildFormState(destination));
        setEventsPickerOpen(false);
        setDialogOpen(true);
    };

    const toggleEvent = (eventType: string, checked: boolean) => {
        setForm((prev) => ({
            ...prev,
            subscribed_events: checked
                ? Array.from(new Set([...prev.subscribed_events, eventType]))
                : prev.subscribed_events.filter((event) => event !== eventType),
        }));
    };

    const selectAllEvents = () => {
        setForm((prev) => ({ ...prev, subscribed_events: [...eventTypes] }));
    };

    const clearAllEvents = () => {
        setForm((prev) => ({ ...prev, subscribed_events: [] }));
    };

    const submit = () => {
        const payload = {
            ...form,
            secret: form.secret.trim() === '' ? null : form.secret,
        };

        if (editing) {
            router.patch(`/webhooks/${editing.id}`, payload, {
                preserveScroll: true,
                onSuccess: () => setDialogOpen(false),
            });
            return;
        }

        router.post('/webhooks', payload, {
            preserveScroll: true,
            onSuccess: () => setDialogOpen(false),
        });
    };

    const confirmDelete = () => {
        if (!deleting) {
            return;
        }

        router.delete(`/webhooks/${deleting.id}`, {
            preserveScroll: true,
            onFinish: () => setDeleting(null),
        });
    };

    return (
        <>
            <Head title="Webhooks" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <ResourcePageHeader
                    title="Webhooks"
                    description="Send incident notifications to external collaboration tools like Slack and Discord."
                    toolbar={
                        <Button
                            type="button"
                            onClick={openCreate}
                            className="gap-2"
                        >
                            <Plus className="size-4" />
                            New destination
                        </Button>
                    }
                />

                <Card className={cn(monitoringCardClass, 'gap-0 py-0')}>
                    <CardContent className="p-0 pt-4">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Provider</TableHead>
                                    <TableHead>Subscribed events</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="w-[120px] text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {destinations.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={5}
                                            className="text-muted-foreground py-12 text-center text-sm"
                                        >
                                            <WebhookIcon className="mx-auto mb-2 size-5 opacity-60" />
                                            No webhook destinations yet. Create one to start receiving incident notifications.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    destinations.map((destination) => (
                                        <TableRow key={destination.id}>
                                            <TableCell className="font-medium text-foreground">
                                                <div className="space-y-1">
                                                    <p>{destination.name}</p>
                                                    <p className="text-muted-foreground max-w-[360px] truncate text-xs">
                                                        {destination.url}
                                                    </p>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-sm">{destination.provider}</TableCell>
                                            <TableCell className="text-xs">
                                                <div className="flex flex-wrap gap-1.5">
                                                    {destination.subscribed_events.map((eventType) => (
                                                        <Badge key={eventType} variant="outline">
                                                            {eventType}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {destination.enabled ? (
                                                    <Badge className="bg-emerald-500/15 text-emerald-300">
                                                        Enabled
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline">Disabled</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="inline-flex items-center gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="gap-1"
                                                        onClick={() => openEdit(destination)}
                                                    >
                                                        <Pencil className="size-3.5" />
                                                        Edit
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="gap-1 text-rose-600 hover:bg-rose-500/10 hover:text-rose-700 dark:text-rose-300 dark:hover:text-rose-200"
                                                        onClick={() => setDeleting(destination)}
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

            <Dialog
                open={dialogOpen}
                onOpenChange={(open) => {
                    setDialogOpen(open);
                    if (!open) {
                        setEventsPickerOpen(false);
                    }
                }}
            >
                <DialogContent className="gap-6 sm:max-w-2xl">
                    <DialogHeader className="space-y-2 text-left">
                        <DialogTitle>
                            {editing ? 'Edit webhook destination' : 'Create webhook destination'}
                        </DialogTitle>
                        <DialogDescription>
                            Pick which Nightwatch events send payloads to this URL. Use the dropdown to browse every
                            event—nothing is clipped at the bottom.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="destination-name">Name</Label>
                            <Input
                                id="destination-name"
                                value={form.name}
                                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                                placeholder="Production alerts"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="destination-provider">Provider</Label>
                            <Select
                                value={form.provider}
                                onValueChange={(value: 'generic' | 'slack' | 'discord') =>
                                    setForm((prev) => ({ ...prev, provider: value }))
                                }
                            >
                                <SelectTrigger id="destination-provider">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {providers.map((provider) => (
                                        <SelectItem key={provider} value={provider}>
                                            {provider}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="destination-url">Webhook URL</Label>
                            <Input
                                id="destination-url"
                                value={form.url}
                                onChange={(event) => setForm((prev) => ({ ...prev, url: event.target.value }))}
                                placeholder="https://hooks.slack.com/services/..."
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="destination-secret">Signing secret (optional)</Label>
                            <Input
                                id="destination-secret"
                                value={form.secret}
                                onChange={(event) => setForm((prev) => ({ ...prev, secret: event.target.value }))}
                                placeholder="Optional HMAC secret"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <Checkbox
                                id="destination-enabled"
                                checked={form.enabled}
                                onCheckedChange={(checked) =>
                                    setForm((prev) => ({ ...prev, enabled: checked === true }))
                                }
                            />
                            <Label htmlFor="destination-enabled" className="cursor-pointer">
                                Destination enabled
                            </Label>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between gap-2">
                                <Label htmlFor="subscribed-events-trigger">Subscribed events</Label>
                                <span className="text-muted-foreground text-xs tabular-nums">
                                    {form.subscribed_events.length} / {eventTypes.length}
                                </span>
                            </div>

                            <Popover modal={false} open={eventsPickerOpen} onOpenChange={setEventsPickerOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        id="subscribed-events-trigger"
                                        type="button"
                                        variant="outline"
                                        aria-expanded={eventsPickerOpen}
                                        className="hover:bg-accent/50 flex h-auto min-h-10 w-full justify-between gap-2 py-2 pr-2 text-left font-normal"
                                    >
                                        <span className="line-clamp-2 min-w-0 text-sm leading-snug">
                                            {form.subscribed_events.length === 0
                                                ? 'Choose which events to subscribe to…'
                                                : `${form.subscribed_events.length} event${form.subscribed_events.length === 1 ? '' : 's'} selected`}
                                        </span>
                                        <ChevronsUpDown className="text-muted-foreground size-4 shrink-0" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent
                                    align="start"
                                    side="bottom"
                                    sideOffset={6}
                                    className="z-[110] flex w-[min(32rem,calc(100vw-2rem))] max-w-[calc(100vw-2rem)] flex-col gap-0 overflow-hidden p-0"
                                    onCloseAutoFocus={(event) => event.preventDefault()}
                                >
                                    <div className="bg-muted/35 flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2">
                                        <span className="text-sm font-medium">Events</span>
                                        <div className="flex shrink-0 gap-1">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="text-muted-foreground h-7 px-2 text-xs"
                                                onClick={() => selectAllEvents()}
                                            >
                                                Select all
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="text-muted-foreground h-7 px-2 text-xs"
                                                onClick={() => clearAllEvents()}
                                            >
                                                Clear
                                            </Button>
                                        </div>
                                    </div>
                                    <ScrollArea className="h-[min(22rem,50vh)]">
                                        <div
                                            role="list"
                                            className="space-y-3 p-4 pb-6"
                                            aria-label="Webhook event types"
                                        >
                                            {eventTypes.map((eventType) => {
                                                const checked = form.subscribed_events.includes(eventType);
                                                const hint = WEBHOOK_EVENT_HINTS[eventType];

                                                return (
                                                    <div key={eventType} className="flex items-start gap-2.5">
                                                        <Checkbox
                                                            id={`webhook-event-${eventType}`}
                                                            className="mt-0.5"
                                                            checked={checked}
                                                            onCheckedChange={(next) =>
                                                                toggleEvent(eventType, next === true)
                                                            }
                                                        />
                                                        <div className="min-w-0">
                                                            <Label
                                                                htmlFor={`webhook-event-${eventType}`}
                                                                className="cursor-pointer font-mono text-xs leading-snug"
                                                            >
                                                                {eventType}
                                                            </Label>
                                                            {hint ? (
                                                                <p className="text-muted-foreground mt-0.5 text-[11px] leading-snug">
                                                                    {hint}
                                                                </p>
                                                            ) : null}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </ScrollArea>
                                </PopoverContent>
                            </Popover>

                            {form.subscribed_events.length > 0 ? (
                                <div className="bg-muted/25 max-h-24 overflow-y-auto rounded-md border px-2 py-2">
                                    <div className="flex flex-wrap gap-1.5">
                                        {form.subscribed_events.map((eventType) => (
                                            <Badge
                                                key={eventType}
                                                variant="secondary"
                                                className="max-w-full truncate font-mono text-[10px] font-normal"
                                                title={eventType}
                                            >
                                                {eventType}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={submit}
                            disabled={
                                form.name.trim() === '' ||
                                form.url.trim() === '' ||
                                form.subscribed_events.length === 0
                            }
                        >
                            {editing ? 'Save changes' : 'Create destination'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

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
                        <AlertDialogTitle>Remove webhook destination?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will stop sending all webhook notifications to{' '}
                            <span className="text-foreground font-medium">{deleting?.name}</span>.
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

WebhooksIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Webhooks', href: '/webhooks' },
    ],
};

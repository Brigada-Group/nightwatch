import { useForm } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import * as React from 'react';
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
import {
    EmailTagsInput
    
} from '@/components/ui/email-tags-input';
import type {EmailTagsInputHandle} from '@/components/ui/email-tags-input';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type {
    CreateInvitationLinkFormFields,
    TeamProjectOption,
} from './types';

const ROLE_OPTIONS = [
    { value: 'developer', label: 'Developer' },
    { value: 'viewer', label: 'Viewer' },
    { value: 'project_manager', label: 'Project manager' },
];

function collectNotifyEmailErrors(errors: Record<string, unknown>): string[] {
    const lines: string[] = [];

    for (const [key, message] of Object.entries(errors)) {
        if (key !== 'notify_emails' && !key.startsWith('notify_emails.')) {
            continue;
        }

        if (typeof message === 'string' && message !== '') {
            lines.push(message);

            continue;
        }

        if (Array.isArray(message)) {
            for (const part of message) {
                if (typeof part === 'string' && part !== '') {
                    lines.push(part);
                }
            }
        }
    }

    return lines;
}

type Props = {
    teamProjects: TeamProjectOption[];
};

export function CreateInvitationLinkDialog(props: Props) {
    const { teamProjects } = props;

    const [open, setOpen] = React.useState(false);
    const emailTagsRef = React.useRef<EmailTagsInputHandle>(null);

    const form = useForm<CreateInvitationLinkFormFields>({
        role_slug: 'developer',
        expires_in_days: '7',
        max_uses: '',
        notify_emails: [],
    });

    const [selectedProjectIds, setSelectedProjectIds] = React.useState<
        number[]
    >([]);

    const toggleProject = (id: number) => {
        setSelectedProjectIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
        );
    };

    const createLink = (e: React.FormEvent) => {
        e.preventDefault();

        emailTagsRef.current?.flushPendingInput();

        form.transform((data) => {
            const rawExpires = data.expires_in_days.trim();
            const rawUses = data.max_uses.trim();

            return {
                role_slug: data.role_slug,
                expires_in_days:
                    rawExpires === ''
                        ? null
                        : Number.parseInt(rawExpires, 10),
                max_uses:
                    rawUses === ''
                        ? null
                        : Number.parseInt(rawUses, 10),
                project_ids:
                    selectedProjectIds.length > 0
                        ? selectedProjectIds
                        : undefined,
                notify_emails:
                    data.notify_emails.length > 0
                        ? data.notify_emails
                        : undefined,
            };
        });

        form.post(window.location.pathname, {
            preserveScroll: true,
            onSuccess: () => {
                setOpen(false);
                setSelectedProjectIds([]);
                form.reset();
                form.clearErrors();
            },
        });
    };

    const notifyErrors = collectNotifyEmailErrors(form.errors);

    return (
        <Dialog modal={false} open={open} onOpenChange={setOpen}>
            <Button
                type="button"
                className="gap-2"
                onClick={() => setOpen(true)}
            >
                <Plus className="size-4" />
                New link
            </Button>
            <DialogContent
                className="sm:max-w-md"
                onOpenAutoFocus={(event) => event.preventDefault()}
            >
                <form onSubmit={createLink}>
                    <DialogHeader>
                        <DialogTitle>Create invitation link</DialogTitle>
                        <DialogDescription>
                            Choose role, expiry, and optional project
                            pre-assignment. Add one or more email addresses to send
                            the same join link to each inbox.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="invitation_link_role">Role</Label>
                            <Select
                                value={form.data.role_slug}
                                onValueChange={(v) =>
                                    form.setData('role_slug', v)
                                }
                            >
                                <SelectTrigger
                                    id="invitation_link_role"
                                    className="w-full"
                                >
                                    <SelectValue placeholder="Role" />
                                </SelectTrigger>
                                <SelectContent>
                                    {ROLE_OPTIONS.map((r) => (
                                        <SelectItem
                                            key={r.value}
                                            value={r.value}
                                        >
                                            {r.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {form.errors.role_slug ? (
                                <p className="text-destructive text-sm">
                                    {form.errors.role_slug}
                                </p>
                            ) : null}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="invitation_link_expires">
                                Expires in (days)
                            </Label>
                            <Input
                                id="invitation_link_expires"
                                type="number"
                                min={1}
                                max={30}
                                value={form.data.expires_in_days}
                                onFocus={(event) => event.currentTarget.select()}
                                onChange={(event) =>
                                    form.setData(
                                        'expires_in_days',
                                        event.target.value,
                                    )
                                }
                            />
                            <p className="text-muted-foreground text-xs">
                                Between 1 and 30 days.
                            </p>
                            {form.errors.expires_in_days ? (
                                <p className="text-destructive text-sm">
                                    {form.errors.expires_in_days}
                                </p>
                            ) : null}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="invitation_link_max_uses">
                                Max uses (optional)
                            </Label>
                            <Input
                                id="invitation_link_max_uses"
                                type="number"
                                min={1}
                                max={10000}
                                placeholder="Unlimited"
                                value={form.data.max_uses}
                                onFocus={(event) => event.currentTarget.select()}
                                onChange={(event) =>
                                    form.setData('max_uses', event.target.value)
                                }
                            />
                            {form.errors.max_uses ? (
                                <p className="text-destructive text-sm">
                                    {form.errors.max_uses}
                                </p>
                            ) : null}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="invitation_link_notify_emails">
                                Send invitation email (optional)
                            </Label>
                            <EmailTagsInput
                                id="invitation_link_notify_emails"
                                ref={emailTagsRef}
                                value={form.data.notify_emails}
                                placeholder="invite@company.com"
                                disabled={form.processing}
                                onChange={(next) =>
                                    form.setData('notify_emails', next)
                                }
                            />
                            <p className="text-muted-foreground text-xs leading-snug">
                                Type an address and press Enter, comma, or space
                                to turn it into a tag. Paste several at once —
                                duplicates are skipped. Sends the generated /join
                                link separately to each inbox using your mail
                                settings.
                            </p>
                            {notifyErrors.length > 0 ? (
                                <div className="space-y-1">
                                    {notifyErrors.map((msg, index) => (
                                        <p
                                            key={`notify-${index}-${msg}`}
                                            className="text-destructive text-sm"
                                        >
                                            {msg}
                                        </p>
                                    ))}
                                </div>
                            ) : null}
                        </div>
                        {teamProjects.length > 0 ? (
                            <fieldset className="grid gap-3">
                                <p className="text-sm leading-none font-medium">
                                    Assign to projects (optional)
                                </p>
                                <p className="text-muted-foreground text-xs leading-snug">
                                    When someone accepts this link for the first
                                    time, they are added to these team projects
                                    automatically.
                                </p>
                                <div className="max-h-[12rem] space-y-2 overflow-y-auto rounded-md border border-border p-3">
                                    {teamProjects.map((p) => (
                                        <label
                                            key={p.id}
                                            className="flex cursor-pointer items-center gap-2 text-sm"
                                        >
                                            <Checkbox
                                                checked={selectedProjectIds.includes(
                                                    p.id,
                                                )}
                                                onCheckedChange={() =>
                                                    toggleProject(p.id)
                                                }
                                            />
                                            <span className="text-foreground">
                                                {p.name}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </fieldset>
                        ) : null}
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={form.processing}>
                            {form.processing ? 'Creating…' : 'Create link'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

import { Check, Copy, ShieldAlert } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

export type InvitationLinkCreated = {
    join_url: string;
    plain_token: string;
};

type Props = {
    payload: InvitationLinkCreated | null;
};

function InvitationLinkReveal({ payload }: { payload: InvitationLinkCreated }) {
    const [open, setOpen] = React.useState(true);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="min-w-0 overflow-hidden sm:max-w-xl [&>*]:min-w-0">
                <DialogHeader>
                    <div className="flex items-center gap-2">
                        <div className="rounded-lg border border-amber-300/60 bg-amber-100 p-2 text-amber-700 dark:border-amber-400/30 dark:bg-amber-500/15 dark:text-amber-200">
                            <ShieldAlert className="size-5" />
                        </div>
                        <DialogTitle>Invitation link created</DialogTitle>
                    </div>
                    <DialogDescription>
                        Copy this link now. For security, the full secret token is
                        only shown once — share the link, not the token, with
                        teammates.
                    </DialogDescription>
                </DialogHeader>

                <div className="min-w-0 space-y-4">
                    <CredentialRow
                        label="Join URL"
                        value={payload.join_url}
                        description="Send this URL to anyone you want to invite."
                    />
                    <CredentialRow
                        label="Plain token"
                        value={payload.plain_token}
                        description="Only needed for debugging; the URL above already contains everything required."
                        isSecret
                    />
                </div>

                <DialogFooter>
                    <Button
                        type="button"
                        onClick={() => setOpen(false)}
                        className="shrink-0"
                    >
                        Done
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export function InvitationLinkCreatedDialog({ payload }: Props) {
    if (!payload) {
        return null;
    }

    return (
        <InvitationLinkReveal
            key={`${payload.plain_token.slice(0, 16)}-${payload.join_url}`}
            payload={payload}
        />
    );
}

function CredentialRow({
    label,
    value,
    description,
    isSecret = false,
}: {
    label: string;
    value: string;
    description: string;
    isSecret?: boolean;
}) {
    return (
        <div className="min-w-0 space-y-1.5">
            <div className="flex min-w-0 items-center justify-between gap-2">
                <span className="text-muted-foreground min-w-0 truncate text-[11px] font-semibold uppercase tracking-wider">
                    {label}
                </span>
                <CopyButton value={value} label={label} />
            </div>
            <code
                className={cn(
                    'block break-all rounded-md border border-border bg-muted/40 px-3 py-2 font-mono text-xs dark:bg-black/40',
                    isSecret
                        ? 'text-amber-700 dark:text-amber-200'
                        : 'text-foreground',
                )}
            >
                {value}
            </code>
            <p className="text-muted-foreground text-xs">{description}</p>
        </div>
    );
}

function CopyButton({ value, label }: { value: string; label: string }) {
    const [copied, setCopied] = React.useState(false);

    const onCopy = async () => {
        try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            toast.success(`${label} copied`);
            window.setTimeout(() => setCopied(false), 1500);
        } catch {
            toast.error('Unable to copy — select the value manually');
        }
    };

    return (
        <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCopy}
            className="h-7 shrink-0 gap-1.5 px-2 text-xs"
        >
            {copied ? (
                <>
                    <Check className="size-3.5 text-emerald-600 dark:text-emerald-300" />
                    Copied
                </>
            ) : (
                <>
                    <Copy className="size-3.5" />
                    Copy
                </>
            )}
        </Button>
    );
}

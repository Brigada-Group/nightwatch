import { Check, Copy, Download, ShieldAlert } from 'lucide-react';
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
import type { ProjectCredentials } from '@/entities';
import { cn } from '@/lib/utils';

type Props = {
    credentials: ProjectCredentials | null;
    hubUrl: string;
};

export function CredentialsRevealDialog({ credentials, hubUrl }: Props) {
    const [open, setOpen] = React.useState(false);

    React.useEffect(() => {
        if (credentials) {
            setOpen(true);
        }
    }, [credentials]);

    if (!credentials) {
        return null;
    }

    const envSnippet = [
        `GUARDIAN_HUB_URL=${hubUrl}`,
        `GUARDIAN_HUB_PROJECT_ID=${credentials.project_uuid}`,
        `GUARDIAN_HUB_API_TOKEN=${credentials.api_token}`,
    ].join('\n');

    const title =
        credentials.kind === 'rotated'
            ? 'Your new API token'
            : 'Project credentials';
    const description =
        credentials.kind === 'rotated'
            ? 'The previous token has been invalidated. Copy the new token — it will not be shown again.'
            : 'Copy these credentials now. For your security, the API token will not be shown again.';

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="min-w-0 overflow-hidden sm:max-w-xl [&>*]:min-w-0">
                <DialogHeader>
                    <div className="flex items-center gap-2">
                        <div className="rounded-lg border border-amber-300/60 bg-amber-100 p-2 text-amber-700 dark:border-amber-400/30 dark:bg-amber-500/15 dark:text-amber-200">
                            <ShieldAlert className="size-5" />
                        </div>
                        <DialogTitle>{title}</DialogTitle>
                    </div>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>

                <div className="min-w-0 space-y-4">
                    <CredentialRow
                        label="Project ID"
                        value={credentials.project_uuid}
                        description="Public identifier — sent in the JSON body of every ingest."
                    />
                    <CredentialRow
                        label="API token"
                        value={credentials.api_token}
                        description="Secret — sent as the Bearer token. Treat like a password."
                        isSecret
                    />

                    <div className="min-w-0 rounded-lg border border-border bg-muted/40 dark:bg-black/40">
                        <div className="flex min-w-0 items-center justify-between gap-2 border-b border-border px-4 py-2.5">
                            <span className="text-muted-foreground min-w-0 truncate text-[11px] font-semibold uppercase tracking-wider">
                                .env snippet
                            </span>
                            <CopyButton
                                value={envSnippet}
                                label=".env snippet"
                            />
                        </div>
                        <pre className="scrollbar-slim overflow-x-auto p-4 font-mono text-xs text-foreground">
                            {envSnippet}
                        </pre>
                    </div>
                </div>

                <DialogFooter className="flex-wrap gap-2 sm:flex-nowrap">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                            downloadCredentialsJson(credentials, hubUrl)
                        }
                        className="shrink-0 gap-2"
                    >
                        <Download className="size-4" />
                        Download JSON
                    </Button>
                    <Button
                        type="button"
                        onClick={() => setOpen(false)}
                        className="shrink-0 bg-gradient-to-br from-violet-500 to-cyan-500 text-white hover:from-violet-400 hover:to-cyan-400"
                    >
                        I have saved the credentials
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function downloadCredentialsJson(
    credentials: ProjectCredentials,
    hubUrl: string,
): void {
    const payload = {
        hub_url: hubUrl,
        project_id: credentials.project_uuid,
        api_token: credentials.api_token,
        env: {
            GUARDIAN_HUB_URL: hubUrl,
            GUARDIAN_HUB_PROJECT_ID: credentials.project_uuid,
            GUARDIAN_HUB_API_TOKEN: credentials.api_token,
        },
        issued_at: new Date().toISOString(),
    };

    const fileName = `nightwatch-guardian-${credentials.project_uuid}.json`;
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: 'application/json',
    });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    toast.success('Credentials file downloaded');
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
            toast.success(`${label} copied to clipboard`);
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

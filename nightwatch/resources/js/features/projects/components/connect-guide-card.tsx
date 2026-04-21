import { Check, Copy, Plug } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';
import { monitoringCardClass } from '@/components/monitoring/monitoring-surface';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';

type Props = {
    projectUuid: string;
    apiTokenLastFour: string | null;
    hubUrl: string;
    onRotateToken: () => void;
    rotating?: boolean;
};

export function ConnectGuideCard({
    projectUuid,
    apiTokenLastFour,
    hubUrl,
    onRotateToken,
    rotating = false,
}: Props) {
    const maskedToken = apiTokenLastFour
        ? `••••••••••••••••••••••••${apiTokenLastFour}`
        : 'not set';

    const envSnippet = [
        `GUARDIAN_HUB_URL=${hubUrl}`,
        `GUARDIAN_HUB_PROJECT_ID=${projectUuid}`,
        `GUARDIAN_HUB_API_TOKEN=<your api token>`,
    ].join('\n');

    return (
        <Card className={cn(monitoringCardClass, 'gap-0 py-0')}>
            <CardHeader className="gap-1 border-b border-white/[0.06] pb-4 pt-5">
                <div className="flex items-center gap-2">
                    <div className="rounded-lg border border-white/10 bg-violet-500/15 p-2 text-violet-200">
                        <Plug className="size-4" />
                    </div>
                    <CardTitle className="text-base text-white">
                        Connect Guardian
                    </CardTitle>
                </div>
                <CardDescription className="text-zinc-400">
                    Install the{' '}
                    <code className="rounded bg-white/[0.06] px-1 py-0.5 text-[11px] text-zinc-200">
                        guardian
                    </code>{' '}
                    package in your Laravel app, then add these variables to
                    its <code>.env</code>.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 px-6 py-5">
                <div className="grid gap-4 md:grid-cols-2">
                    <InfoField label="Hub URL" value={hubUrl} copyable />
                    <InfoField
                        label="Project ID"
                        value={projectUuid}
                        copyable
                        description="Public — sent in each JSON body."
                    />
                </div>

                <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                        <span className="text-muted-foreground text-[11px] font-semibold uppercase tracking-wider">
                            API token
                        </span>
                        <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            onClick={onRotateToken}
                            disabled={rotating}
                            className="h-7 gap-1.5 px-2 text-xs"
                        >
                            {rotating ? 'Rotating…' : 'Rotate token'}
                        </Button>
                    </div>
                    <code className="block break-all rounded-md border border-white/[0.08] bg-black/40 px-3 py-2 font-mono text-xs text-zinc-400">
                        {maskedToken}
                    </code>
                    <p className="text-muted-foreground text-xs">
                        The full token is only visible the moment it is
                        generated. Rotate to reveal a new one.
                    </p>
                </div>

                <div className="rounded-lg border border-white/[0.08] bg-black/40">
                    <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-2.5">
                        <span className="text-muted-foreground text-[11px] font-semibold uppercase tracking-wider">
                            .env template
                        </span>
                        <CopyIconButton value={envSnippet} label=".env template" />
                    </div>
                    <pre className="scrollbar-slim-dark overflow-x-auto p-4 font-mono text-xs text-zinc-200">
                        {envSnippet}
                    </pre>
                </div>
            </CardContent>
        </Card>
    );
}

function InfoField({
    label,
    value,
    description,
    copyable = false,
}: {
    label: string;
    value: string;
    description?: string;
    copyable?: boolean;
}) {
    return (
        <div className="space-y-1.5">
            <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-[11px] font-semibold uppercase tracking-wider">
                    {label}
                </span>
                {copyable ? <CopyIconButton value={value} label={label} /> : null}
            </div>
            <code className="block break-all rounded-md border border-white/[0.08] bg-black/40 px-3 py-2 font-mono text-xs text-zinc-100">
                {value}
            </code>
            {description ? (
                <p className="text-muted-foreground text-xs">{description}</p>
            ) : null}
        </div>
    );
}

function CopyIconButton({ value, label }: { value: string; label: string }) {
    const [copied, setCopied] = React.useState(false);

    const onCopy = async () => {
        try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            toast.success(`${label} copied`);
            window.setTimeout(() => setCopied(false), 1500);
        } catch {
            toast.error('Unable to copy');
        }
    };

    return (
        <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCopy}
            className="h-7 gap-1.5 px-2 text-xs text-zinc-300 hover:bg-white/[0.06] hover:text-white"
        >
            {copied ? (
                <>
                    <Check className="size-3.5 text-emerald-300" />
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

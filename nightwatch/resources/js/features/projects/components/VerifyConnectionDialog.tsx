import { router } from '@inertiajs/react';
import { CheckCircle2, Copy, Loader2, RefreshCw, Terminal } from 'lucide-react';
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
import { echoReady } from '@/shared/echo/client';
import {
    startProjectVerification,
    type StartVerificationResponse,
} from '../api/projectVerificationService';

type Props = {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    projectUuid: string;
    projectName: string;
};

type State = 'loading' | 'waiting' | 'verified' | 'expired' | 'error';

/**
 * Setup-verification ceremony.
 *
 * Open → POST /start-verification → get token + command + TTL → display
 * the token and copy-paste command → subscribe to the project's Reverb
 * channel → flip to verified when the heartbeat round-trip completes →
 * countdown timer drives "expired" state if no SDK response.
 *
 * Cleans up subscriptions on close. Idempotent re-open generates a fresh
 * token, so users can retry as many times as they want.
 */
export function VerifyConnectionDialog({
    isOpen,
    onOpenChange,
    projectUuid,
    projectName,
}: Props) {
    const [state, setState] = React.useState<State>('loading');
    const [issued, setIssued] = React.useState<StartVerificationResponse | null>(
        null,
    );
    const [secondsLeft, setSecondsLeft] = React.useState(0);

    // Generate a fresh token whenever the dialog opens. This is the bottom
    // of the flow — every time the user opens this modal, we restart.
    const start = React.useCallback(async () => {
        setState('loading');
        try {
            const data = await startProjectVerification(projectUuid);
            setIssued(data);
            setSecondsLeft(data.ttl_seconds);
            setState('waiting');
        } catch (e) {
            console.error(e);
            setState('error');
            toast.error('Could not start verification.');
        }
    }, [projectUuid]);

    React.useEffect(() => {
        if (isOpen) start();
    }, [isOpen, start]);

    // Subscribe to the project's broadcast channel while waiting. The SDK's
    // heartbeat-with-token will trigger the ProjectVerified event server-
    // side, which lands here with no polling needed.
    React.useEffect(() => {
        if (! isOpen || state !== 'waiting') return;

        let cancelled = false;
        let cleanup: (() => void) | null = null;

        echoReady.then((echo) => {
            if (cancelled || ! echo) return;

            const channel = echo.channel(`projects.${projectUuid}`);
            channel.listen('.project.verified', () => {
                setState('verified');
                // Pull updated project state into Inertia props.
                router.reload({ only: ['project'] });
            });

            cleanup = () => {
                channel.stopListening('.project.verified');
                echo.leave(`projects.${projectUuid}`);
            };
        });

        return () => {
            cancelled = true;
            cleanup?.();
        };
    }, [isOpen, projectUuid, state]);

    // Countdown timer. Drops to 'expired' state when zero — user can retry
    // by clicking "Generate new token".
    React.useEffect(() => {
        if (state !== 'waiting') return;

        const interval = setInterval(() => {
            setSecondsLeft((prev) => {
                if (prev <= 1) {
                    setState('expired');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [state]);

    const copyCommand = () => {
        if (! issued?.command) return;
        navigator.clipboard.writeText(issued.command);
        toast.success('Command copied.');
    };

    const handleClose = () => {
        // Reset internal state so a re-open starts clean.
        setState('loading');
        setIssued(null);
        setSecondsLeft(0);
        onOpenChange(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(o) => (o ? onOpenChange(true) : handleClose())}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Verify connection</DialogTitle>
                    <DialogDescription>
                        Confirms that <strong>{projectName}</strong>'s SDK can
                        reach this hub. The verification finishes when the SDK
                        sends a heartbeat carrying your token.
                    </DialogDescription>
                </DialogHeader>

                {state === 'loading' ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="text-muted-foreground size-6 animate-spin" />
                    </div>
                ) : null}

                {state === 'waiting' && issued ? (
                    <div className="space-y-4">
                        <div className="border-border space-y-2 rounded-md border p-4">
                            <p className="text-muted-foreground text-[11px] font-medium uppercase tracking-wider">
                                Run on your project
                            </p>
                            <div className="bg-muted/40 flex items-center justify-between gap-2 rounded-md border border-border p-3 font-mono text-xs">
                                <span className="flex items-center gap-2 break-all">
                                    <Terminal className="text-muted-foreground size-3.5 shrink-0" />
                                    {issued.command}
                                </span>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={copyCommand}
                                    className="h-7 shrink-0 px-2"
                                >
                                    <Copy className="size-3.5" />
                                </Button>
                            </div>
                        </div>

                        <div className="text-muted-foreground flex items-center justify-center gap-2 text-sm">
                            <Loader2 className="size-3.5 animate-spin" />
                            Waiting for the SDK to acknowledge…
                        </div>

                        <p className="text-muted-foreground text-center text-xs tabular-nums">
                            Token expires in {Math.floor(secondsLeft / 60)}:
                            {String(secondsLeft % 60).padStart(2, '0')}
                        </p>
                    </div>
                ) : null}

                {state === 'verified' ? (
                    <div className="flex flex-col items-center gap-3 py-6">
                        <div className="border-emerald-500/40 bg-emerald-500/10 flex size-14 items-center justify-center rounded-full border">
                            <CheckCircle2 className="size-8 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <p className="text-foreground text-base font-medium">
                            Connection verified
                        </p>
                        <p className="text-muted-foreground text-center text-sm">
                            <strong>{projectName}</strong>'s SDK can talk to
                            the hub. You can close this window.
                        </p>
                    </div>
                ) : null}

                {state === 'expired' ? (
                    <div className="space-y-3 py-2">
                        <p className="text-muted-foreground text-center text-sm">
                            Token expired. The SDK didn't respond in time —
                            check that the consuming app's queue worker /
                            scheduler is running and that the hub URL is
                            reachable from there.
                        </p>
                    </div>
                ) : null}

                {state === 'error' ? (
                    <div className="space-y-3 py-2">
                        <p className="text-destructive text-center text-sm">
                            Something went wrong starting the verification.
                            Try again.
                        </p>
                    </div>
                ) : null}

                <DialogFooter>
                    {state === 'expired' || state === 'error' ? (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={start}
                            className="gap-2"
                        >
                            <RefreshCw className="size-3.5" />
                            Generate new token
                        </Button>
                    ) : null}
                    <Button
                        type="button"
                        variant={state === 'verified' ? 'default' : 'outline'}
                        onClick={handleClose}
                    >
                        {state === 'verified' ? 'Done' : 'Close'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

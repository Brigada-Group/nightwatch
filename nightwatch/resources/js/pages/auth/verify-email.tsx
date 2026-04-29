import { Head, router, useForm } from '@inertiajs/react';
import * as React from 'react';
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
} from '@/components/ui/input-otp';
import { Spinner } from '@/components/ui/spinner';
import { logout } from '@/routes';

type Props = {
    email: string;
    status?: string;
    resendAvailableInSeconds: number;
};

export default function VerifyEmail({
    email,
    status,
    resendAvailableInSeconds,
}: Props) {
    const verifyForm = useForm({
        code: '',
    });

    const resendForm = useForm({});

    const [cooldownSeconds, setCooldownSeconds] = React.useState(() =>
        Math.max(0, resendAvailableInSeconds),
    );

    /* eslint-disable react-hooks/set-state-in-effect -- aligning client timer with authoritative server throttle */
    React.useEffect(() => {
        setCooldownSeconds(Math.max(0, resendAvailableInSeconds));
    }, [resendAvailableInSeconds]);
    /* eslint-enable react-hooks/set-state-in-effect */

    React.useEffect(() => {
        if (cooldownSeconds <= 0) {
            return;
        }

        const id = window.setInterval(() => {
            setCooldownSeconds((s) => Math.max(0, s - 1));
        }, 1000);

        return () => window.clearInterval(id);
    }, [cooldownSeconds]);

    const submit = (event: React.FormEvent) => {
        event.preventDefault();
        verifyForm.post('/email/verify', {
            preserveScroll: true,
            onSuccess: () => verifyForm.reset('code'),
        });
    };

    const resend = () => {
        resendForm.post('/email/verify/resend', {
            preserveScroll: true,
            onSuccess: () => {
                router.reload({
                    only: ['resendAvailableInSeconds', 'status'],
                });
            },
        });
    };

    const codeReady = verifyForm.data.code.length === 6;

    return (
        <>
            <Head title="Verify email" />

            <div className="flex flex-col gap-6">
                <div className="bg-muted/50 rounded-md border px-3 py-2 text-center text-xs">
                    <span className="text-muted-foreground">Sent to </span>
                    <span className="text-foreground break-all font-medium">
                        {email}
                    </span>
                </div>

                {status === 'verification-link-sent' && (
                    <div
                        role="status"
                        className="rounded-md border border-green-500/40 bg-green-500/10 px-3 py-2 text-center text-xs font-medium text-green-700 dark:text-green-400"
                    >
                        A new code has been sent to your inbox.
                    </div>
                )}

                <form onSubmit={submit} className="flex flex-col gap-4">
                    <div className="flex flex-col items-center gap-2">
                        <InputOTP
                            maxLength={6}
                            value={verifyForm.data.code}
                            onChange={(v) => {
                                verifyForm.setData(
                                    'code',
                                    v.replace(/\D/g, '').slice(0, 6),
                                );
                                verifyForm.clearErrors('code');
                            }}
                            autoFocus
                            inputMode="numeric"
                            pattern="\d*"
                            containerClassName="justify-center"
                        >
                            <InputOTPGroup>
                                {Array.from({ length: 6 }).map((_, i) => (
                                    <InputOTPSlot
                                        key={i}
                                        index={i}
                                        className="h-11 w-11 text-base"
                                    />
                                ))}
                            </InputOTPGroup>
                        </InputOTP>
                        <InputError
                            message={verifyForm.errors.code}
                            className="text-center"
                        />
                    </div>

                    <Button
                        type="submit"
                        disabled={verifyForm.processing || !codeReady}
                        className="w-full"
                    >
                        {verifyForm.processing && <Spinner />}
                        Verify email
                    </Button>
                </form>

                <div className="flex flex-col items-center gap-2 border-t pt-4">
                    <p className="text-muted-foreground text-xs">
                        Didn't receive a code?
                    </p>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={resendForm.processing || cooldownSeconds > 0}
                        onClick={resend}
                    >
                        {resendForm.processing && <Spinner />}
                        {cooldownSeconds > 0
                            ? `Resend in ${cooldownSeconds}s`
                            : 'Resend code'}
                    </Button>
                    <TextLink href={logout()} className="text-xs">
                        Log out
                    </TextLink>
                </div>
            </div>
        </>
    );
}

VerifyEmail.layout = {
    title: 'Verify your email',
    description:
        'We emailed you a 6-digit code. Enter it below to confirm your address. Codes expire after 15 minutes.',
};

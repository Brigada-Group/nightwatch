import { Head, router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

type Props = {
    token: string;
};

export default function AcceptInvitePage() {
    const { token } = usePage<Props>().props;
    const [processing, setProcessing] = useState(false);

    const accept = () => {
        setProcessing(true);
        router.post(`/team/invitations/${token}/accept`, {}, {
            onSuccess: () => toast.success('Invitation accepted.'),
            onError: () => toast.error('Failed to accept invitation.'),
            onFinish: () => setProcessing(false),
        });
    };

    useEffect(() => {
        accept();
    }, []);

    return (
        <>
            <Head title="Accept Invitation" />
            <div className="mx-auto max-w-lg p-8">
                <h1 className="text-xl font-semibold">Accepting invitation...</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                    If it does not continue automatically, click below.
                </p>
                <Button className="mt-4" onClick={accept} disabled={processing}>
                    {processing ? 'Processing...' : 'Accept invitation'}
                </Button>
            </div>
        </>
    );
}
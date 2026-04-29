import { Head, router, usePage } from '@inertiajs/react';
import { format, parseISO } from 'date-fns';
import { Layers, Loader2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AuthCardLayout from '@/layouts/auth/auth-card-layout';

export type JoinShowPageProps = {
    valid: boolean;
    team?: {
        name: string;
        slug: string;
    };
    role?: {
        name: string;
        slug: string;
    };
    expires_at?: string;
    token?: string | null;
    projects?: { id: number; name: string }[];
    is_owner?: boolean;
};

export default function JoinShowPage() {
    const props = usePage<JoinShowPageProps>().props;
    const {
        valid,
        team,
        role,
        expires_at: expiresAtIso,
        token,
        projects: projectsProp,
        is_owner: isOwner,
    } = props;
    const projects = projectsProp ?? [];

    const { auth } = usePage<{ auth?: { user?: unknown } }>().props;
    const loggedIn = Boolean(auth?.user);

    const [busy, setBusy] = useState(false);

    const expiresLabel = useMemo(() => {
        if (!expiresAtIso) {
            return '';
        }

        try {
            return format(parseISO(expiresAtIso), 'MMM d, yyyy h:mm a');
        } catch {
            return expiresAtIso;
        }
    }, [expiresAtIso]);

    const accept = () => {
        if (!token) {
            return;
        }

        setBusy(true);
        router.post(
            `/join/${token}/accept`,
            {},
            {
                preserveScroll: true,
                onFinish: () => setBusy(false),
            },
        );
    };

    if (!valid) {
        return (
            <>
                <Head title="Invitation unavailable" />
                <AuthCardLayout
                    title="Invitation unavailable"
                    description="This link is invalid, expired, revoked, or has already been used too many times."
                >
                    <div className="flex flex-col gap-4">
                        <p className="text-muted-foreground text-center text-sm">
                            Ask your team administrator for a new invitation
                            link or email invitation.
                        </p>
                        <Button asChild variant="outline" className="w-full">
                            <a href="/">Back to home</a>
                        </Button>
                    </div>
                </AuthCardLayout>
            </>
        );
    }

    if (!team || !role || !expiresAtIso) {
        return null;
    }

    if (isOwner) {
        return (
            <>
                <Head title={`Your invitation link — ${team.name}`} />
                <AuthCardLayout
                    title="This is a link you created"
                    description={`You created this invitation link for ${team.name}, so it can't be accepted by you. Share it with someone you'd like to invite.`}
                >
                    <div className="flex flex-col gap-3">
                        <Button asChild className="w-full">
                            <a href="/team">Back to team</a>
                        </Button>
                        <Button asChild variant="outline" className="w-full">
                            <a href="/dashboard">Go to dashboard</a>
                        </Button>
                    </div>
                </AuthCardLayout>
            </>
        );
    }

    if (!token) {
        return null;
    }

    const hasProjects = projects.length > 0;

    return (
        <>
            <Head title={`Join ${team.name}`} />
            <AuthCardLayout
                title={`Join ${team.name}`}
                description={
                    hasProjects
                        ? `You’re invited as ${role.name}. You’ll also be assigned to the project${projects.length > 1 ? 's' : ''} listed below once you confirm.`
                        : `You’re invited as ${role.name}. Confirm below to join ${team.name} (this link does not pre-assign projects).`
                }
            >
                <div className="space-y-6">
                    <dl className="space-y-3 text-sm">
                        <div className="flex justify-between gap-4">
                            <dt className="text-muted-foreground">Team</dt>
                            <dd className="font-medium">{team.name}</dd>
                        </div>
                        <div className="flex justify-between gap-4">
                            <dt className="text-muted-foreground">Role</dt>
                            <dd className="font-medium">{role.name}</dd>
                        </div>
                        {expiresLabel ? (
                            <div className="flex justify-between gap-4">
                                <dt className="text-muted-foreground">
                                    Link expires
                                </dt>
                                <dd className="font-medium">{expiresLabel}</dd>
                            </div>
                        ) : null}
                    </dl>

                    {hasProjects ? (
                        <div className="bg-muted/50 space-y-2 rounded-lg border p-4">
                            <div className="flex items-start gap-2">
                                <Layers
                                    className="text-primary mt-0.5 size-4 shrink-0"
                                    aria-hidden
                                />
                                <div className="min-w-0 flex-1">
                                    <p className="font-medium leading-snug">
                                        Project assignment
                                    </p>
                                    <p className="text-muted-foreground mt-1 text-xs leading-snug">
                                        Accepting assigns you to these team
                                        projects automatically (along with your
                                        role above).
                                    </p>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {projects.map((p) => (
                                            <Badge
                                                key={p.id}
                                                variant="secondary"
                                                className="font-normal leading-tight"
                                            >
                                                {p.name}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="rounded-lg border border-dashed p-4">
                            <p className="text-muted-foreground text-center text-xs leading-snug">
                                No projects are bundled with this link — only
                                your team membership and role will be updated
                                when you accept.
                            </p>
                        </div>
                    )}

                    {!loggedIn ? (
                        <div className="flex flex-col gap-3">
                            <p className="text-muted-foreground text-center text-sm">
                                Sign in or create an account to accept this
                                invitation.
                            </p>
                            <Button asChild className="w-full">
                                <a href="/login">Sign in to continue</a>
                            </Button>
                            <Button asChild variant="outline" className="w-full">
                                <a href="/register">Create account</a>
                            </Button>
                        </div>
                    ) : (
                        <Button
                            type="button"
                            className="w-full"
                            onClick={accept}
                            disabled={busy}
                        >
                            {busy ? (
                                <>
                                    <Loader2 className="mr-2 size-4 animate-spin" />
                                    Joining
                                </>
                            ) : (
                                `Accept and join ${team.name}`
                            )}
                        </Button>
                    )}
                </div>
            </AuthCardLayout>
        </>
    );
}

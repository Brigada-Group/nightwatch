import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ClientErrorEvent } from '@/entities';
import type { WithProjectRelation } from '@/types/monitoring';

type PageProps = {
    event: WithProjectRelation<ClientErrorEvent>;
};

export default function ClientErrorShow() {
    const { event } = usePage<PageProps>().props;
    const userPayload =
        event.user_payload && typeof event.user_payload === 'object'
            ? event.user_payload
            : {};
    const userId = userPayload.id ?? userPayload.user_id ?? null;
    const userName = userPayload.name ?? userPayload.full_name ?? null;
    const userEmail = userPayload.email ?? null;
    const userAuthenticated = userPayload.authenticated;
    const userContext = userPayload.context ?? null;

    return (
        <>
            <Head title={`Client Error #${event.id}`} />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <Button variant="ghost" size="sm" className="w-fit gap-2 px-2" asChild>
                    <Link href="/client-errors">
                        <ArrowLeft className="size-4" />
                        Client Errors
                    </Link>
                </Button>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Error Overview</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-3 text-sm md:grid-cols-2">
                        <p><span className="text-muted-foreground">Exception:</span> {event.exception_class}</p>
                        <p><span className="text-muted-foreground">Severity:</span> {event.severity}</p>
                        <p><span className="text-muted-foreground">Runtime:</span> {event.runtime}</p>
                        <p><span className="text-muted-foreground">Project:</span> {event.project?.name ?? event.project_id}</p>
                        <p><span className="text-muted-foreground">Environment:</span> {event.environment}</p>
                        <p><span className="text-muted-foreground">Server:</span> {event.server}</p>
                        <p><span className="text-muted-foreground">Occurred:</span> {new Date(event.occurred_at).toLocaleString()}</p>
                        <p><span className="text-muted-foreground">Received:</span> {new Date(event.received_at).toLocaleString()}</p>
                        <p className="md:col-span-2"><span className="text-muted-foreground">Message:</span> {event.message}</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Location & Request Context</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-3 text-sm md:grid-cols-2">
                        <p><span className="text-muted-foreground">Source file:</span> {event.source_file ?? '—'}</p>
                        <p><span className="text-muted-foreground">Line / Col:</span> {event.line}{event.colno != null ? ` / ${event.colno}` : ''}</p>
                        <p className="md:col-span-2"><span className="text-muted-foreground">Request URL:</span> {event.request_url ?? '—'}</p>
                        <p><span className="text-muted-foreground">Status code:</span> {event.status_code}</p>
                        <p><span className="text-muted-foreground">IP:</span> {event.ip ?? '—'}</p>
                        <p className="md:col-span-2"><span className="text-muted-foreground">Fingerprint:</span> <span className="font-mono text-xs">{event.fingerprint ?? '—'}</span></p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">User Context</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-3 text-sm md:grid-cols-2">
                        <p>
                            <span className="text-muted-foreground">Authenticated:</span>{' '}
                            {typeof userAuthenticated === 'boolean'
                                ? userAuthenticated
                                    ? 'Yes'
                                    : 'No'
                                : 'Unknown'}
                        </p>
                        <p>
                            <span className="text-muted-foreground">Context:</span>{' '}
                            {typeof userContext === 'string' && userContext !== '' ? userContext : '—'}
                        </p>
                        <p>
                            <span className="text-muted-foreground">User ID:</span>{' '}
                            {userId != null ? String(userId) : '—'}
                        </p>
                        <p>
                            <span className="text-muted-foreground">User name:</span>{' '}
                            {typeof userName === 'string' && userName !== '' ? userName : '—'}
                        </p>
                        <p className="md:col-span-2">
                            <span className="text-muted-foreground">User email:</span>{' '}
                            {typeof userEmail === 'string' && userEmail !== '' ? userEmail : '—'}
                        </p>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

ClientErrorShow.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Client Errors', href: '/client-errors' },
        { title: 'Details', href: '#' },
    ],
};

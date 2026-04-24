import { FormEvent, useMemo, useState } from 'react';
import type { AxiosError } from 'axios';
import { webApi } from '@/shared/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

type UserHit = {
    id: number;
    name: string;
    email: string;
};

type InviteErrorResponse = {
    message?: string;
    errors?: Record<string, string[]>;
};

const ROLE_OPTIONS = [
    { value: 'developer', label: 'Developer' },
    { value: 'viewer', label: 'Viewer' },
    { value: 'project_manager', label: 'Project Manager' },
];

export function InviteMemberDialog() {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [email, setEmail] = useState('');
    
    const [roleSlug, setRoleSlug] = useState('developer');
    const [results, setResults] = useState<UserHit[]>([]);
    const [searching, setSearching] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const canSearch = useMemo(() => query.trim().length >= 2, [query]);

    const searchUsers = async () => {
        if (!canSearch) return;
        setSearching(true);
        try {
            const { data } = await webApi.get('/team/invitations/search-users', {
                params: { q: query.trim() },
            });
            setResults(Array.isArray(data?.data) ? data.data : []);
        } catch (error) {
            const axiosError = error as AxiosError;
            console.log('[Invite Search] Error response:', axiosError.response?.data ?? axiosError.message);
            toast.error('Failed to search users.');
        } finally {
            setSearching(false);
        }
    };

    const submitInvite = async (e: FormEvent) => {
        e.preventDefault();
        if (!email.trim()) {
            toast.error('Email is required.');
            return;
        }

        setSubmitting(true);
        try {
            const response = await webApi.post('/team/invitations', {
                email: email.trim(),
                role_slug: roleSlug,
            });
            console.log('[Invite Submit] Success response:', response.data);
            toast.success('Invitation sent.');
            setEmail('');
            setQuery('');
            setResults([]);
            setOpen(false);
        } catch (error) {
            const axiosError = error as AxiosError<InviteErrorResponse>;
            console.log('[Invite Submit] Error response:', axiosError.response?.data ?? axiosError.message);
            const message = axiosError.response?.data?.message;
            const validationMessage = axiosError.response?.data?.errors
                ? Object.values(axiosError.response.data.errors)[0]?.[0]
                : null;

            toast.error(validationMessage ?? message ?? 'Failed to send invitation.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>Invite member</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Invite team member</DialogTitle>
                    <DialogDescription>
                        Search by email, choose role, and send invite.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={submitInvite} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="search">Search user by email</Label>
                        <div className="flex gap-2">
                            <Input
                                id="search"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="dev@company.com"
                            />
                            <Button type="button" variant="secondary" onClick={searchUsers} disabled={!canSearch || searching}>
                                {searching ? 'Searching...' : 'Search'}
                            </Button>
                        </div>
                        {results.length > 0 ? (
                            <div className="rounded-md border p-2 text-sm">
                                {results.map((u) => (
                                    <button
                                        key={u.id}
                                        type="button"
                                        className="block w-full rounded px-2 py-1 text-left hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                        onClick={() => setEmail(u.email)}
                                    >
                                        {u.name} — {u.email}
                                    </button>
                                ))}
                            </div>
                        ) : null}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">Invite email</Label>
                        <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="dev@company.com"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="role">Role</Label>
                        <select
                            id="role"
                            value={roleSlug}
                            onChange={(e) => setRoleSlug(e.target.value)}
                            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                        >
                            {ROLE_OPTIONS.map((r) => (
                                <option key={r.value} value={r.value}>
                                    {r.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={submitting}>
                            {submitting ? 'Sending...' : 'Send invitation'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
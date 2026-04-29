import { Head, router, usePage } from '@inertiajs/react';
import { Pencil, Users } from 'lucide-react';
import * as React from 'react';
import { monitoringCardClass } from '@/components/monitoring/monitoring-surface';
import { ResourcePageHeader } from '@/components/monitoring/resource-page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import type { TeamRosterMember } from '@/entities';
import { cn } from '@/lib/utils';

type TeamSummary = {
    id: number;
    name: string;
    slug: string;
};

type TeamProjectOption = {
    id: number;
    name: string;
};

type PageProps = {
    team: TeamSummary;
    members: TeamRosterMember[];
    canManageProjectAssignments: boolean;
    teamProjects: TeamProjectOption[];
};

function joinedLabel(iso: string | null): string {
    if (!iso) {
        return '—';
    }

    try {
        return new Date(iso).toLocaleDateString(undefined, {
            dateStyle: 'medium',
        });
    } catch {
        return '—';
    }
}

export default function TeamIndex() {
    const { team, members, canManageProjectAssignments, teamProjects } =
        usePage<PageProps>().props;

    const [assignmentDialog, setAssignmentDialog] = React.useState<{
        member: TeamRosterMember;
        selectedIds: number[];
    } | null>(null);

    const [assignmentSaving, setAssignmentSaving] = React.useState(false);

    const toggleAssignmentProject = (projectId: number) => {
        setAssignmentDialog((d) => {
            if (!d) {
                return d;
            }

            const has = d.selectedIds.includes(projectId);

            return {
                ...d,
                selectedIds: has
                    ? d.selectedIds.filter((x) => x !== projectId)
                    : [...d.selectedIds, projectId],
            };
        });
    };

    const saveAssignments = () => {
        if (!assignmentDialog) {
            return;
        }

        router.post(
            '/team/project-assignments',
            {
                user_id: assignmentDialog.member.user.id,
                project_ids: assignmentDialog.selectedIds,
            },
            {
                preserveScroll: true,
                onStart: () => setAssignmentSaving(true),
                onFinish: () => setAssignmentSaving(false),
                onSuccess: () => setAssignmentDialog(null),
            },
        );
    };

    return (
        <>
            <Head title={`Team · ${team.name}`} />
            <Dialog
                open={assignmentDialog !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setAssignmentDialog(null);
                    }
                }}
            >
                <DialogContent
                    className="sm:max-w-md"
                    onOpenAutoFocus={(e) => e.preventDefault()}
                >
                    <DialogHeader>
                        <DialogTitle>
                            Project assignments
                            {assignmentDialog
                                ? ` · ${assignmentDialog.member.user.name}`
                                : ''}
                        </DialogTitle>
                        <DialogDescription>
                            Choose which projects this team member is assigned
                            to. This does not change their team role.
                        </DialogDescription>
                    </DialogHeader>
                    {assignmentDialog && teamProjects.length > 0 ? (
                        <div className="max-h-[14rem] space-y-2 overflow-y-auto rounded-md border border-border p-3">
                            {teamProjects.map((p) => (
                                <label
                                    key={p.id}
                                    className="flex cursor-pointer items-center gap-2 text-sm"
                                >
                                    <Checkbox
                                        checked={assignmentDialog.selectedIds.includes(
                                            p.id,
                                        )}
                                        onCheckedChange={() =>
                                            toggleAssignmentProject(p.id)
                                        }
                                    />
                                    <span className="text-foreground">
                                        {p.name}
                                    </span>
                                </label>
                            ))}
                        </div>
                    ) : assignmentDialog ? (
                        <p className="text-muted-foreground text-sm">
                            This team has no projects yet. Create a project
                            first.
                        </p>
                    ) : null}
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setAssignmentDialog(null)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            disabled={
                                assignmentSaving ||
                                teamProjects.length === 0 ||
                                !assignmentDialog
                            }
                            onClick={saveAssignments}
                        >
                            {assignmentSaving ? 'Saving…' : 'Save'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <ResourcePageHeader
                    title="Team members"
                    description={`People who belong to ${team.name}. Showing accepted members.`}
                    toolbar={
                        <div className="text-muted-foreground flex items-center gap-2 text-sm">
                            <Users className="size-4 shrink-0" />
                            <span className="max-w-[12rem] truncate sm:max-w-none">
                                Team:{' '}
                                <span className="text-foreground font-medium">
                                    {team.name}
                                </span>
                            </span>
                        </div>
                    }
                />

                <Card className={cn(monitoringCardClass, 'gap-0 py-0')}>
                    <CardContent className="p-0 pt-4">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Projects</TableHead>
                                    <TableHead className="text-right">
                                        Joined
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {members.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={6}
                                            className="text-muted-foreground py-12 text-center text-sm"
                                        >
                                            No team members yet.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    members.map((m) => (
                                        <TableRow key={m.id}>
                                            <TableCell className="font-medium">
                                                {m.user.name}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {m.user.email}
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm">
                                                    {m.role?.name ?? '—'}
                                                </span>
                                                {m.role?.slug ? (
                                                    <span className="text-muted-foreground ml-1 text-xs">
                                                        ({m.role.slug})
                                                    </span>
                                                ) : null}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="secondary"
                                                    className="capitalize"
                                                >
                                                    {m.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-wrap items-center gap-1.5">
                                                    {m.assigned_projects
                                                        .length === 0 ? (
                                                        <span className="text-muted-foreground text-sm">
                                                            —
                                                        </span>
                                                    ) : (
                                                        m.assigned_projects.map(
                                                            (p) => (
                                                                <Badge
                                                                    key={p.id}
                                                                    variant="outline"
                                                                    className="font-normal"
                                                                >
                                                                    {p.name}
                                                                </Badge>
                                                            ),
                                                        )
                                                    )}
                                                    {canManageProjectAssignments ? (
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="size-8 shrink-0"
                                                            onClick={() =>
                                                                setAssignmentDialog(
                                                                    {
                                                                        member: m,
                                                                        selectedIds:
                                                                            m.assigned_projects.map(
                                                                                (
                                                                                    ap,
                                                                                ) =>
                                                                                    ap.id,
                                                                            ),
                                                                    },
                                                                )
                                                            }
                                                            aria-label="Edit project assignments"
                                                        >
                                                            <Pencil className="size-3.5" />
                                                        </Button>
                                                    ) : null}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-right text-sm">
                                                {joinedLabel(m.joined_at)}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

TeamIndex.layout = {
    breadcrumbs: [
        { title: 'Team', href: '/team' },
    ],
};

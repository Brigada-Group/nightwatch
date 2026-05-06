import { Head, usePage } from '@inertiajs/react';
import { ResourcePageHeader } from '@/components/monitoring/resource-page-header';
import { AssignedTasksTable } from '@/features/tasks/components/AssignedTasksTable';
import { KanbanBoard } from '@/features/tasks/components/KanbanBoard';
import { ManagerStatsSection } from '@/features/tasks/components/ManagerStatsSection';
import type {
    KanbanColumns,
    ManagerStats,
    ManagerTask,
    ProjectAiConfigMap,
} from '@/features/tasks/types';

type PageProps = {
    view: 'developer' | 'manager';
    team: { id: number; name: string };
    kanban: KanbanColumns | null;
    assigned: ManagerTask[] | null;
    stats: ManagerStats | null;
    project_ai_configs: ProjectAiConfigMap | null;
    auth?: { user?: { id?: number } | null } | null;
};

export default function TasksIndex() {
    const { view, kanban, assigned, stats, project_ai_configs, auth } =
        usePage<PageProps>().props;
    const isManager = view === 'manager';
    const currentUserId = auth?.user?.id ?? null;

    return (
        <>
            <Head title="Tasks" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <ResourcePageHeader
                    title="Tasks"
                    description={
                        isManager
                            ? 'Exceptions you have assigned to teammates and their current progress.'
                            : 'Drag a card across columns as you pick up, work on, and finish each exception.'
                    }
                />

                {isManager ? (
                    <>
                        {stats ? <ManagerStatsSection stats={stats} /> : null}
                        <AssignedTasksTable tasks={assigned ?? []} />
                    </>
                ) : (
                    <KanbanBoard
                        initial={
                            kanban ?? {
                                started: [],
                                ongoing: [],
                                review: [],
                                finished: [],
                            }
                        }
                        projectAiConfigs={project_ai_configs ?? {}}
                        currentUserId={currentUserId}
                    />
                )}
            </div>
        </>
    );
}

TasksIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Tasks', href: '/tasks' },
    ],
};

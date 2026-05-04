import { Head } from '@inertiajs/react';
import { Accordion } from '@/components/ui/accordion';
import {
    AiConfigProjectAccordionItem,
    type AiConfigProjectSummary,
    type AiConfigValues,
} from '@/features/ai-config/components/AiConfigProjectAccordionItem';

type ProjectConfigEntry = {
    project: AiConfigProjectSummary;
    config: AiConfigValues;
};

type Props = {
    projects: ProjectConfigEntry[];
};

export default function AiConfigPage({ projects }: Props) {
    return (
        <>
            <Head title="AI Config" />

            <div className="flex h-full flex-1 flex-col gap-6 bg-background p-4 text-foreground md:p-6">
                <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                    <h1 className="text-foreground text-2xl font-semibold tracking-tight">
                        AI Configuration
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Configure AI capabilities per project. Click a project
                        to expand its options.
                    </p>
                </div>

                {projects.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center shadow-sm">
                        <p className="text-foreground text-sm font-medium">
                            No projects yet
                        </p>
                        <p className="text-muted-foreground mt-1 text-xs">
                            Create a project for your team to configure AI
                            settings for it.
                        </p>
                    </div>
                ) : (
                    <div className="rounded-xl border border-border bg-card shadow-sm">
                        <Accordion
                            type="single"
                            collapsible
                            className="w-full"
                        >
                            {projects.map((entry) => (
                                <AiConfigProjectAccordionItem
                                    key={entry.project.id}
                                    project={entry.project}
                                    config={entry.config}
                                />
                            ))}
                        </Accordion>
                    </div>
                )}
            </div>
        </>
    );
}

AiConfigPage.layout = {
    breadcrumbs: [
        {
            title: 'AI Config',
            href: '/ai-config',
        },
    ],
};

import { useForm } from '@inertiajs/react';
import { Bot, HeartPulse } from 'lucide-react';
import {
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import { cn } from '@/lib/utils';
import { AiConfigToggleRow } from './AiConfigToggleRow';

export type AiConfigProjectSummary = {
    id: number;
    uuid: string;
    name: string;
    environment: string | null;
};

export type AiConfigValues = {
    use_ai: boolean;
    self_heal: boolean;
};

type Props = {
    project: AiConfigProjectSummary;
    config: AiConfigValues;
};

function StatePill({ label, enabled }: { label: string; enabled: boolean }) {
    return (
        <span
            className={cn(
                'inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-medium whitespace-nowrap',
                enabled
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                    : 'border-border bg-muted text-muted-foreground',
            )}
        >
            {label}: {enabled ? 'On' : 'Off'}
        </span>
    );
}

export function AiConfigProjectAccordionItem({ project, config }: Props) {
    const form = useForm<AiConfigValues>({
        use_ai: config.use_ai,
        self_heal: config.self_heal,
    });

    const isDirty =
        form.data.use_ai !== config.use_ai ||
        form.data.self_heal !== config.self_heal;

    const submit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        form.patch(`/ai-config/${project.uuid}`, { preserveScroll: true });
    };

    return (
        <AccordionItem value={String(project.id)} className="px-4">
            <AccordionTrigger className="hover:no-underline">
                <div className="flex flex-1 items-center justify-between gap-4 pr-2">
                    <div className="min-w-0 text-left">
                        <p className="text-foreground flex items-center gap-2 truncate font-semibold">
                            <span className="truncate">{project.name}</span>
                            {isDirty ? (
                                <span
                                    className="size-1.5 shrink-0 rounded-full bg-amber-500"
                                    title="Unsaved changes"
                                />
                            ) : null}
                        </p>
                        {project.environment ? (
                            <p className="text-muted-foreground mt-0.5 text-xs">
                                {project.environment}
                            </p>
                        ) : null}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                        <StatePill label="AI" enabled={config.use_ai} />
                        <StatePill
                            label="Self-Heal"
                            enabled={config.self_heal}
                        />
                    </div>
                </div>
            </AccordionTrigger>

            <AccordionContent>
                <form onSubmit={submit} className="grid gap-3">
                    <AiConfigToggleRow
                        icon={Bot}
                        label="Use AI"
                        description="Enable AI-powered features for this project."
                        checked={form.data.use_ai}
                        onCheckedChange={(next) =>
                            form.setData('use_ai', next)
                        }
                        disabled={form.processing}
                    />

                    <AiConfigToggleRow
                        icon={HeartPulse}
                        label="Self-Heal"
                        description="Allow the AI to suggest and apply automatic fixes for recurring issues."
                        checked={form.data.self_heal}
                        onCheckedChange={(next) =>
                            form.setData('self_heal', next)
                        }
                        disabled={form.processing || !form.data.use_ai}
                    />

                    <div className="flex items-center gap-2 pt-1">
                        <button
                            type="submit"
                            disabled={form.processing || !isDirty}
                            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50"
                        >
                            {form.processing ? 'Saving...' : 'Save changes'}
                        </button>

                        {isDirty && !form.processing ? (
                            <button
                                type="button"
                                onClick={() => form.reset()}
                                className="text-foreground hover:bg-muted rounded-md border border-border px-4 py-2 text-sm font-medium"
                            >
                                Discard
                            </button>
                        ) : null}
                    </div>
                </form>
            </AccordionContent>
        </AccordionItem>
    );
}

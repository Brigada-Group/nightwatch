import { router } from '@inertiajs/react';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { ProjectOption } from '@/types/monitoring';

type Props = {
    path: string;
    value: number | null;
    options: ProjectOption[];
    filters: Record<string, string | number | boolean | null | undefined>;
};

export function ProjectFilter({ path, value, options, filters }: Props) {
    return (
        <div className="flex flex-col gap-1.5">
            <Label className="text-muted-foreground text-xs">Project</Label>
            <Select
                value={value != null ? String(value) : 'all'}
                onValueChange={(v) => {
                    const next =
                        v === 'all'
                            ? { ...filters, project_id: undefined, page: 1 }
                            : { ...filters, project_id: Number(v), page: 1 };
                    router.get(path, next, {
                        preserveScroll: true,
                        replace: true,
                    });
                }}
            >
                <SelectTrigger className="w-[220px]">
                    <SelectValue placeholder="All projects" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All projects</SelectItem>
                    {options.map((p) => (
                        <SelectItem key={p.id} value={String(p.id)}>
                            {p.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}

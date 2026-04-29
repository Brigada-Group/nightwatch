import { Filter, Search, X } from 'lucide-react';
import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import type { DashboardFilters } from '@/features/dashboard/api/dashboardService';

type Props = {
    searchQuery: string;
    onSearchChange: (query: string) => void;
    filters: DashboardFilters;
    onFiltersChange: (next: DashboardFilters) => void;
    availableEnvironments?: string[];
};

const STATUS_OPTIONS: Array<{ value: string; label: string }> = [
    { value: 'normal', label: 'Normal' },
    { value: 'warning', label: 'Warning' },
    { value: 'critical', label: 'Critical' },
    { value: 'unknown', label: 'Unknown' },
];

const DEFAULT_ENVIRONMENTS = ['production', 'staging', 'local'];

export function DashboardToolbar({
    searchQuery,
    onSearchChange,
    filters,
    onFiltersChange,
    availableEnvironments,
}: Props) {
    const environments = useMemo(() => {
        const unique = new Set<string>(availableEnvironments ?? DEFAULT_ENVIRONMENTS);

        for (const env of filters.environments) {
            unique.add(env);
        }

        return [...unique].sort();
    }, [availableEnvironments, filters.environments]);

    const activeCount =
        filters.statuses.length + filters.environments.length;

    const toggleMembership = (
        list: string[],
        value: string,
    ): string[] => {
        if (list.includes(value)) {
            return list.filter((v) => v !== value);
        }

        return [...list, value];
    };

    const clearFilters = () => {
        onFiltersChange({ search: '', statuses: [], environments: [] });
        onSearchChange('');
    };

    const searchActive = searchQuery.trim() !== '';
    const anyActive = activeCount > 0 || searchActive;

    return (
        <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
                <Search className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
                <Input
                    placeholder="Search projects by name"
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="bg-muted/50 border-border/50 pl-9 pr-9 h-9"
                />
                {searchActive && (
                    <button
                        type="button"
                        aria-label="Clear search"
                        onClick={() => onSearchChange('')}
                        className="text-muted-foreground hover:text-foreground absolute right-2 top-1/2 -translate-y-1/2"
                    >
                        <X className="size-4" />
                    </button>
                )}
            </div>

            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                        <Filter className="size-3.5" />
                        Filter
                        {activeCount > 0 && (
                            <Badge
                                variant="secondary"
                                className="ml-1 h-5 px-1.5 text-[10px]"
                            >
                                {activeCount}
                            </Badge>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-64 p-3">
                    <div className="space-y-3">
                        <div>
                            <div className="text-xs font-semibold text-muted-foreground mb-2">
                                Status
                            </div>
                            <div className="space-y-2">
                                {STATUS_OPTIONS.map((opt) => {
                                    const id = `filter-status-${opt.value}`;
                                    const checked = filters.statuses.includes(
                                        opt.value,
                                    );

                                    return (
                                        <div
                                            key={opt.value}
                                            className="flex items-center gap-2"
                                        >
                                            <Checkbox
                                                id={id}
                                                checked={checked}
                                                onCheckedChange={() =>
                                                    onFiltersChange({
                                                        ...filters,
                                                        statuses:
                                                            toggleMembership(
                                                                filters.statuses,
                                                                opt.value,
                                                            ),
                                                    })
                                                }
                                            />
                                            <Label
                                                htmlFor={id}
                                                className="text-sm font-normal"
                                            >
                                                {opt.label}
                                            </Label>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <Separator />

                        <div>
                            <div className="text-xs font-semibold text-muted-foreground mb-2">
                                Environment
                            </div>
                            <div className="space-y-2">
                                {environments.map((env) => {
                                    const id = `filter-env-${env}`;
                                    const checked = filters.environments.includes(
                                        env,
                                    );

                                    return (
                                        <div
                                            key={env}
                                            className="flex items-center gap-2"
                                        >
                                            <Checkbox
                                                id={id}
                                                checked={checked}
                                                onCheckedChange={() =>
                                                    onFiltersChange({
                                                        ...filters,
                                                        environments:
                                                            toggleMembership(
                                                                filters.environments,
                                                                env,
                                                            ),
                                                    })
                                                }
                                            />
                                            <Label
                                                htmlFor={id}
                                                className="text-sm font-normal"
                                            >
                                                {env}
                                            </Label>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {anyActive && (
                            <>
                                <Separator />
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-full justify-start text-xs"
                                    onClick={clearFilters}
                                >
                                    <X className="size-3.5" />
                                    Clear all filters
                                </Button>
                            </>
                        )}
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
}

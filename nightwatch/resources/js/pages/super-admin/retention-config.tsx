import { Head, router, useForm } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { DynamicDropdown } from '@/components/ui/dynamic-dropdown';

type RetentionRun = {
    cleanup_key: string;
    last_ran_at: string | null;
    last_deleted_rows: number;
    last_retention_days: number;
    notes: string | null;
};

type Props = {
    retention_details: Array<{
        id: number;
        table_name: string;
        is_enabled: boolean;
        run_interval_days: number;
        retention_days: number;
    }>;
    available_tables: string[];
    retention_runs: RetentionRun[];
};

function normalizeTableName(tableName: string): string {
    const base = tableName.startsWith('hub_') ? tableName.slice(4) : tableName;

    if (base.length === 0) {
        return tableName;
    }

    return base.charAt(0).toUpperCase() + base.slice(1);
}

function normalizeCleanupKey(cleanupKey: string): string {
    const tableName = cleanupKey.startsWith('table:') ? cleanupKey.slice('table:'.length) : cleanupKey;

    return normalizeTableName(tableName);
}

export default function SuperAdminRetentionConfig({ retention_details, available_tables, retention_runs }: Props) {
    const createForm = useForm({
        table_name: available_tables[0] ?? '',
        is_enabled: true,
        run_interval_days: 1,
        retention_days: 14,
    });

    const [instanceState, setInstanceState] = useState<Record<number, {
        is_enabled: boolean;
        run_interval_days: number;
        retention_days: number;
    }>>(() => Object.fromEntries(
        retention_details.map((row) => [row.id, {
            is_enabled: row.is_enabled,
            run_interval_days: row.run_interval_days,
            retention_days: row.retention_days,
        }])
    ));

    const sortedInstances = useMemo(
        () => [...retention_details].sort((a, b) => a.table_name.localeCompare(b.table_name)),
        [retention_details],
    );

    const dropdownItems = useMemo(
        () =>
            available_tables.length === 0
                ? [{ value: '__none__', label: 'All supported tables are already configured', disabled: true }]
                : available_tables.map((tableName) => ({
                      value: tableName,
                      label: normalizeTableName(tableName),
                  })),
        [available_tables],
    );

    return (
        <>
            <Head title="Retention Config" />

            <div className="flex h-full flex-1 flex-col gap-6 bg-background p-4 text-foreground md:p-6">
                <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                    <h1 className="text-2xl font-semibold tracking-tight text-foreground">Retention Configuration</h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Configure one retention rule per telemetry table.
                    </p>
                </div>

                <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
                    <h2 className="text-foreground text-base font-semibold">Create Retention Rule</h2>
                    <p className="text-muted-foreground mt-1 text-xs">
                        Pick a table from the dropdown and create a retention rule for it.
                    </p>

                    <form
                        className="mt-4 grid gap-3 md:grid-cols-2"
                        onSubmit={(event) => {
                            event.preventDefault();
                            createForm.post('/super-admin/retention-details', { preserveScroll: true });
                        }}
                    >
                        <div className="grid gap-1">
                            <span className="text-muted-foreground text-xs">Table</span>
                            <DynamicDropdown
                                items={dropdownItems}
                                value={createForm.data.table_name}
                                onValueChange={(value) => createForm.setData('table_name', value)}
                                placeholder="Select a telemetry table"
                                disabled={available_tables.length === 0}
                            />
                        </div>

                        <label className="text-foreground mt-6 flex items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                checked={createForm.data.is_enabled}
                                onChange={(event) => createForm.setData('is_enabled', event.target.checked)}
                            />
                            Rule enabled
                        </label>

                        <div className="grid gap-1">
                            <span className="text-muted-foreground text-xs">Run interval days</span>
                            <input
                                type="number"
                                min={1}
                                className="border-input bg-background rounded-md border px-3 py-2 text-sm text-foreground"
                                value={createForm.data.run_interval_days}
                                onChange={(event) => createForm.setData('run_interval_days', Number(event.target.value))}
                            />
                        </div>

                        <div className="grid gap-1">
                            <span className="text-muted-foreground text-xs">Retention days</span>
                            <input
                                type="number"
                                min={1}
                                className="border-input bg-background rounded-md border px-3 py-2 text-sm text-foreground"
                                value={createForm.data.retention_days}
                                onChange={(event) => createForm.setData('retention_days', Number(event.target.value))}
                            />
                        </div>

                        <div className="md:col-span-2">
                            <button
                                type="submit"
                                disabled={createForm.processing || available_tables.length === 0}
                                className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50"
                            >
                                {createForm.processing ? 'Creating...' : 'Create rule'}
                            </button>
                        </div>
                    </form>
                </section>

                <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
                    <h2 className="text-foreground text-base font-semibold">Configured Retention Rules</h2>
                    <p className="text-muted-foreground mt-1 text-xs">
                        Each rule controls cleanup behavior for one table.
                    </p>

                    <div className="mt-4 space-y-3">
                        {sortedInstances.length === 0 ? (
                            <p className="text-muted-foreground text-sm">No retention rules configured yet.</p>
                        ) : (
                            sortedInstances.map((instance) => {
                                const current = instanceState[instance.id];
                                if (!current) {
                                    return null;
                                }

                                return (
                                    <div key={instance.id} className="bg-muted/30 rounded-lg border border-border p-3">
                                        <p className="text-foreground text-sm font-semibold">
                                            {normalizeTableName(instance.table_name)}
                                        </p>

                                        <div className="mt-3 grid gap-3 md:grid-cols-2">
                                            <label className="text-foreground flex items-center gap-2 text-sm">
                                                <input
                                                    type="checkbox"
                                                    checked={current.is_enabled}
                                                    onChange={(event) =>
                                                        setInstanceState((prev) => ({
                                                            ...prev,
                                                            [instance.id]: { ...prev[instance.id], is_enabled: event.target.checked },
                                                        }))
                                                    }
                                                />
                                                Rule enabled
                                            </label>

                                            <div className="grid gap-1">
                                                <span className="text-muted-foreground text-xs">Run interval days</span>
                                                <input
                                                    type="number"
                                                    min={1}
                                                    className="border-input bg-background rounded-md border px-3 py-2 text-sm text-foreground"
                                                    value={current.run_interval_days}
                                                    onChange={(event) =>
                                                        setInstanceState((prev) => ({
                                                            ...prev,
                                                            [instance.id]: { ...prev[instance.id], run_interval_days: Number(event.target.value) },
                                                        }))
                                                    }
                                                />
                                            </div>

                                            <div className="grid gap-1">
                                                <span className="text-muted-foreground text-xs">Retention days</span>
                                                <input
                                                    type="number"
                                                    min={1}
                                                    className="border-input bg-background rounded-md border px-3 py-2 text-sm text-foreground"
                                                    value={current.retention_days}
                                                    onChange={(event) =>
                                                        setInstanceState((prev) => ({
                                                            ...prev,
                                                            [instance.id]: { ...prev[instance.id], retention_days: Number(event.target.value) },
                                                        }))
                                                    }
                                                />
                                            </div>
                                        </div>

                                        <div className="mt-3 flex items-center gap-2">
                                            <button
                                                type="button"
                                                className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-3 py-2 text-xs font-medium"
                                                onClick={() =>
                                                    router.patch(`/super-admin/retention-details/${instance.id}`, current, {
                                                        preserveScroll: true,
                                                    })
                                                }
                                            >
                                                Save rule
                                            </button>

                                            <button
                                                type="button"
                                                className="rounded-md border border-border px-3 py-2 text-xs font-medium text-foreground hover:bg-muted"
                                                onClick={() => {
                                                    const confirmed = window.confirm(
                                                        `Delete retention rule for ${normalizeTableName(instance.table_name)}?`,
                                                    );

                                                    if (!confirmed) {
                                                        return;
                                                    }

                                                    router.delete(`/super-admin/retention-details/${instance.id}`, {
                                                        preserveScroll: true,
                                                    });
                                                }}
                                            >
                                                Delete rule
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </section>

                <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
                    <h2 className="text-foreground text-base font-semibold">Retention Cleanup Status</h2>
                    <p className="text-muted-foreground mt-1 text-xs">Last run snapshot for each retention cleanup key.</p>

                    <div className="mt-4 space-y-2">
                        {retention_runs.length === 0 ? (
                            <p className="text-muted-foreground text-sm">No retention cleanup runs recorded yet.</p>
                        ) : (
                            retention_runs.map((run) => (
                                <div
                                    key={run.cleanup_key}
                                    className="bg-muted/30 rounded-lg border border-border px-3 py-2 text-sm"
                                >
                                    <p className="text-foreground font-medium">{normalizeCleanupKey(run.cleanup_key)}</p>
                                    <p className="text-muted-foreground mt-1 text-xs">
                                        last={run.last_ran_at ?? 'never'} | deleted={run.last_deleted_rows} | retention_days={run.last_retention_days}
                                    </p>
                                    {run.notes ? <p className="text-muted-foreground mt-1 text-xs">{run.notes}</p> : null}
                                </div>
                            ))
                        )}
                    </div>
                </section>
            </div>
        </>
    );
}

SuperAdminRetentionConfig.layout = {
    breadcrumbs: [
        {
            title: 'Retention Config',
            href: '/super-admin/retention-config',
        },
    ],
};

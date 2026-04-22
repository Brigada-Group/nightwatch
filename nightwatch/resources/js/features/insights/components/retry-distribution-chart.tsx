import { useMemo } from 'react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Legend,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { useAppearance } from '@/hooks/use-appearance';

export type RetryBucket = {
    bucket: string;
    completed: number;
    failed: number;
};

const COLORS = {
    completed: '#10b981',
    failed: '#ef4444',
};

function RetryTooltip({
    active,
    payload,
    label,
}: {
    active?: boolean;
    payload?: Array<{ dataKey: string; value: number; color: string }>;
    label?: string;
}) {
    if (!active || !payload?.length) {
        return null;
    }

    const total = payload.reduce((sum, e) => sum + (e.value ?? 0), 0);

    return (
        <div className="bg-popover text-popover-foreground border-border rounded-lg border px-3 py-2 text-xs shadow-xl">
            <p className="text-muted-foreground mb-1 font-medium">{label}</p>
            {payload.map((e) => (
                <div key={e.dataKey} className="flex items-center gap-2">
                    <span
                        className="inline-block size-2 rounded-full"
                        style={{ backgroundColor: e.color }}
                    />
                    <span className="text-muted-foreground capitalize">
                        {e.dataKey}
                    </span>
                    <span className="ml-auto font-mono font-semibold text-foreground">
                        {e.value.toLocaleString()}
                    </span>
                </div>
            ))}
            {total > 0 && (
                <div className="border-border mt-1 flex items-center gap-2 border-t pt-1 text-[11px]">
                    <span className="text-muted-foreground">Total</span>
                    <span className="ml-auto font-mono font-semibold text-foreground">
                        {total.toLocaleString()}
                    </span>
                </div>
            )}
        </div>
    );
}

type Props = {
    data: RetryBucket[];
};

export function RetryDistributionChart({ data }: Props) {
    const { resolvedAppearance } = useAppearance();
    const theme = useMemo(
        () =>
            resolvedAppearance === 'dark'
                ? { grid: 'rgba(150, 160, 200, 0.15)', tick: '#9ca3af' }
                : { grid: 'rgba(30, 41, 59, 0.12)', tick: '#64748b' },
        [resolvedAppearance],
    );

    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-base">Retry distribution</CardTitle>
                <CardDescription>
                    Final status of jobs grouped by attempt number. Healthy
                    systems resolve most jobs on attempt 1; a big failed bar on
                    the right means retries aren't saving the work.
                </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
                <div style={{ width: '100%', height: 260 }}>
                    <ResponsiveContainer width="100%" height={260} minHeight={260}>
                        <BarChart
                            data={data}
                            margin={{ top: 10, right: 12, left: 0, bottom: 0 }}
                        >
                            <CartesianGrid
                                strokeDasharray="3 3"
                                stroke={theme.grid}
                                vertical={false}
                            />
                            <XAxis
                                dataKey="bucket"
                                tickLine={false}
                                axisLine={false}
                                tick={{ fontSize: 11, fill: theme.tick }}
                            />
                            <YAxis
                                tickLine={false}
                                axisLine={false}
                                tick={{ fontSize: 10, fill: theme.tick }}
                                width={36}
                            />
                            <Tooltip content={<RetryTooltip />} cursor={false} />
                            <Legend
                                iconType="circle"
                                wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                            />
                            <Bar
                                dataKey="completed"
                                stackId="a"
                                fill={COLORS.completed}
                                radius={[0, 0, 0, 0]}
                            />
                            <Bar
                                dataKey="failed"
                                stackId="a"
                                fill={COLORS.failed}
                                radius={[4, 4, 0, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}

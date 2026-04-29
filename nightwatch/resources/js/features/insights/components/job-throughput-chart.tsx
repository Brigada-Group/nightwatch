import { useMemo } from 'react';
import {
    Area,
    AreaChart,
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
import { countDomain } from '@/lib/chart-domain';

export type ThroughputPoint = {
    time: string;
    completed: number;
    failed: number;
};

const COLORS = {
    completed: '#10b981',
    failed: '#ef4444',
};

function ThroughputTooltip({
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
        </div>
    );
}

type Props = {
    data: ThroughputPoint[];
};

export function JobThroughputChart({ data }: Props) {
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
                <CardTitle className="text-base">
                    Job throughput over time
                </CardTitle>
                <CardDescription>
                    Completed vs failed jobs per hour.
                </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
                <div style={{ width: '100%', height: 260 }}>
                    <ResponsiveContainer width="100%" height={260} minHeight={260}>
                        <AreaChart
                            data={data}
                            margin={{ top: 10, right: 12, left: 0, bottom: 0 }}
                        >
                            <defs>
                                <linearGradient
                                    id="job-completed-grad"
                                    x1="0"
                                    y1="0"
                                    x2="0"
                                    y2="1"
                                >
                                    <stop
                                        offset="0%"
                                        stopColor={COLORS.completed}
                                        stopOpacity={0.35}
                                    />
                                    <stop
                                        offset="100%"
                                        stopColor={COLORS.completed}
                                        stopOpacity={0}
                                    />
                                </linearGradient>
                                <linearGradient
                                    id="job-failed-grad"
                                    x1="0"
                                    y1="0"
                                    x2="0"
                                    y2="1"
                                >
                                    <stop
                                        offset="0%"
                                        stopColor={COLORS.failed}
                                        stopOpacity={0.35}
                                    />
                                    <stop
                                        offset="100%"
                                        stopColor={COLORS.failed}
                                        stopOpacity={0}
                                    />
                                </linearGradient>
                            </defs>
                            <CartesianGrid
                                strokeDasharray="3 3"
                                stroke={theme.grid}
                            />
                            <XAxis
                                dataKey="time"
                                tickLine={false}
                                axisLine={false}
                                tick={{ fontSize: 10, fill: theme.tick }}
                                interval="preserveStartEnd"
                                tickCount={8}
                            />
                            <YAxis
                                tickLine={false}
                                axisLine={false}
                                tick={{ fontSize: 10, fill: theme.tick }}
                                width={36}
                                domain={countDomain()}
                                allowDecimals={false}
                            />
                            <Tooltip content={<ThroughputTooltip />} cursor={false} />
                            <Legend
                                iconType="circle"
                                wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                            />
                            <Area
                                type="monotone"
                                dataKey="completed"
                                stackId="1"
                                stroke={COLORS.completed}
                                strokeWidth={1.5}
                                fill="url(#job-completed-grad)"
                                dot={false}
                            />
                            <Area
                                type="monotone"
                                dataKey="failed"
                                stackId="1"
                                stroke={COLORS.failed}
                                strokeWidth={1.5}
                                fill="url(#job-failed-grad)"
                                dot={false}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}

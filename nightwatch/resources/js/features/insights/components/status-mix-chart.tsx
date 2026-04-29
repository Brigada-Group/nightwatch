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

export type StatusMixPoint = {
    time: string;
    c2xx: number;
    c3xx: number;
    c4xx: number;
    c5xx: number;
};

const COLORS = {
    c2xx: '#10b981',
    c3xx: '#06b6d4',
    c4xx: '#f59e0b',
    c5xx: '#ef4444',
};

const LABELS: Record<keyof typeof COLORS, string> = {
    c2xx: '2xx Success',
    c3xx: '3xx Redirect',
    c4xx: '4xx Client',
    c5xx: '5xx Server',
};

function StatusTooltip({
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
                    <span className="text-muted-foreground">
                        {LABELS[e.dataKey as keyof typeof LABELS] ?? e.dataKey}
                    </span>
                    <span className="ml-auto font-mono font-semibold text-foreground">
                        {e.value.toLocaleString()}
                    </span>
                </div>
            ))}
            <div className="border-border mt-1 flex items-center gap-2 border-t pt-1 text-[11px]">
                <span className="text-muted-foreground">Total</span>
                <span className="ml-auto font-mono font-semibold text-foreground">
                    {total.toLocaleString()}
                </span>
            </div>
        </div>
    );
}

type Props = {
    data: StatusMixPoint[];
};

export function StatusMixChart({ data }: Props) {
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
                    HTTP status classes over time
                </CardTitle>
                <CardDescription>
                    Stacked counts of 2xx / 3xx / 4xx / 5xx responses per hour.
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
                                {Object.entries(COLORS).map(([k, c]) => (
                                    <linearGradient
                                        key={k}
                                        id={`grad-${k}`}
                                        x1="0"
                                        y1="0"
                                        x2="0"
                                        y2="1"
                                    >
                                        <stop
                                            offset="0%"
                                            stopColor={c}
                                            stopOpacity={0.35}
                                        />
                                        <stop
                                            offset="100%"
                                            stopColor={c}
                                            stopOpacity={0}
                                        />
                                    </linearGradient>
                                ))}
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
                            <Tooltip content={<StatusTooltip />} cursor={false} />
                            <Legend
                                iconType="circle"
                                wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                                formatter={(value) =>
                                    LABELS[value as keyof typeof LABELS] ?? value
                                }
                            />
                            {(
                                ['c2xx', 'c3xx', 'c4xx', 'c5xx'] as const
                            ).map((key) => (
                                <Area
                                    key={key}
                                    type="monotone"
                                    dataKey={key}
                                    stackId="1"
                                    stroke={COLORS[key]}
                                    strokeWidth={1.5}
                                    fill={`url(#grad-${key})`}
                                    dot={false}
                                />
                            ))}
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}

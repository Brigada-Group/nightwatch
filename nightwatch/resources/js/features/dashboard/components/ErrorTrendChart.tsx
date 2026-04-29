import { useMemo } from 'react';
import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { countDomain } from '@/lib/chart-domain';

type ErrorTrendPoint = {
    time: string;
    exceptions: number;
    warnings: number;
};

type Props = {
    data?: ErrorTrendPoint[];
    timePeriod?: string;
};

function emptyHourlySeries(): ErrorTrendPoint[] {
    const start = new Date();
    start.setMinutes(0, 0, 0);
    start.setHours(start.getHours() - 23);

    return Array.from({ length: 24 }, (_, i) => {
        const d = new Date(start.getTime() + i * 60 * 60 * 1000);
        const label = `${d.getHours().toString().padStart(2, '0')}:00`;

        return { time: label, exceptions: 0, warnings: 0 };
    });
}

const COLORS = {
    exceptions: '#6d8cff',
    warnings: '#36d4a8',
    border: 'rgba(100, 130, 200, 0.15)',
    muted: 'rgba(140, 160, 200, 0.6)',
};

function CustomTooltip({
    active,
    payload,
    label,
}: {
    active?: boolean;
    payload?: Array<{ value: number; dataKey: string; color: string }>;
    label?: string;
}) {
    if (!active || !payload?.length) {
        return null;
    }

    return (
        <div className="bg-popover border-border rounded-lg border px-3 py-2 text-xs shadow-xl">
            <p className="text-muted-foreground mb-1 font-medium">{label}</p>
            {payload.map((entry) => (
                <div key={entry.dataKey} className="flex items-center gap-2">
                    <span
                        className="inline-block size-2 rounded-full"
                        style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-muted-foreground capitalize">
                        {entry.dataKey}:
                    </span>
                    <span className="font-mono font-semibold text-foreground">
                        {entry.value}
                    </span>
                </div>
            ))}
        </div>
    );
}

export function ErrorTrendChart({ data, timePeriod = '24H' }: Props) {
    const chartData = useMemo(
        () => (data && data.length > 0 ? data : emptyHourlySeries()),
        [data],
    );

    return (
        <Card className="flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                    <p className="text-muted-foreground text-[11px] font-semibold tracking-widest uppercase">
                        Error Trend Monitor
                    </p>
                    <CardTitle className="text-lg font-bold">
                        Incident Flow
                    </CardTitle>
                </div>
                <span className="text-muted-foreground text-[10px] font-medium tracking-wide uppercase">
                    {timePeriod}
                </span>
            </CardHeader>
            <CardContent className="flex-1 pb-4">
                <div className="h-[220px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient
                                    id="exceptionsGrad"
                                    x1="0"
                                    y1="0"
                                    x2="0"
                                    y2="1"
                                >
                                    <stop
                                        offset="0%"
                                        stopColor={COLORS.exceptions}
                                        stopOpacity={0.35}
                                    />
                                    <stop
                                        offset="100%"
                                        stopColor={COLORS.exceptions}
                                        stopOpacity={0}
                                    />
                                </linearGradient>
                                <linearGradient
                                    id="warningsGrad"
                                    x1="0"
                                    y1="0"
                                    x2="0"
                                    y2="1"
                                >
                                    <stop
                                        offset="0%"
                                        stopColor={COLORS.warnings}
                                        stopOpacity={0.25}
                                    />
                                    <stop
                                        offset="100%"
                                        stopColor={COLORS.warnings}
                                        stopOpacity={0}
                                    />
                                </linearGradient>
                            </defs>
                            <CartesianGrid
                                strokeDasharray="3 3"
                                stroke={COLORS.border}
                            />
                            <XAxis
                                dataKey="time"
                                tickLine={false}
                                axisLine={false}
                                tick={{ fontSize: 10, fill: COLORS.muted }}
                                interval="preserveStartEnd"
                                tickCount={6}
                            />
                            <YAxis
                                tickLine={false}
                                axisLine={false}
                                tick={{ fontSize: 10, fill: COLORS.muted }}
                                width={30}
                                domain={countDomain()}
                                allowDecimals={false}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={false} />
                            <Area
                                type="monotone"
                                dataKey="warnings"
                                stroke={COLORS.warnings}
                                strokeWidth={1.5}
                                fill="url(#warningsGrad)"
                                dot={false}
                            />
                            <Area
                                type="monotone"
                                dataKey="exceptions"
                                stroke={COLORS.exceptions}
                                strokeWidth={1.5}
                                fill="url(#exceptionsGrad)"
                                dot={false}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}

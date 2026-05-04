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
import type { RequestDurationPoint } from '../api/dashboardService';

type Props = {
    data: RequestDurationPoint[];
    timePeriod?: string;
};

const COLORS = {
    line: '#36d4a8',
    fill: 'rgba(54, 212, 168, 0.18)',
};

function CustomTooltip({
    active,
    payload,
    label,
}: {
    active?: boolean;
    payload?: Array<{ value: number }>;
    label?: string;
}) {
    if (!active || !payload?.length) return null;

    return (
        <div className="bg-popover text-popover-foreground rounded-md border border-border px-2 py-1.5 text-xs shadow-md">
            <p className="font-mono">{label}</p>
            <p className="text-muted-foreground mt-0.5">
                avg{' '}
                <span className="text-foreground font-semibold">
                    {payload[0].value}ms
                </span>
            </p>
        </div>
    );
}

export function RequestDurationTrendChart({ data, timePeriod = '24H' }: Props) {
    const peak = data.reduce((max, p) => (p.avg_ms > max ? p.avg_ms : max), 0);

    return (
        <Card className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
                <CardTitle className="text-sm font-semibold">
                    Avg Request Duration
                </CardTitle>
                <span className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider">
                    {timePeriod}{peak > 0 ? ` · peak ${peak}ms` : ''}
                </span>
            </CardHeader>
            <CardContent className="px-2 pb-3 pt-0">
                {data.every((p) => p.avg_ms === 0) ? (
                    <p className="text-muted-foreground py-8 text-center text-xs">
                        No requests in the last {timePeriod}.
                    </p>
                ) : (
                    <ResponsiveContainer width="100%" height={180}>
                        <AreaChart
                            data={data}
                            margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
                        >
                            <defs>
                                <linearGradient
                                    id="durationFill"
                                    x1="0"
                                    y1="0"
                                    x2="0"
                                    y2="1"
                                >
                                    <stop
                                        offset="0%"
                                        stopColor={COLORS.line}
                                        stopOpacity={0.4}
                                    />
                                    <stop
                                        offset="100%"
                                        stopColor={COLORS.line}
                                        stopOpacity={0}
                                    />
                                </linearGradient>
                            </defs>
                            <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="rgba(100, 130, 200, 0.15)"
                            />
                            <XAxis
                                dataKey="time"
                                stroke="rgba(140, 160, 200, 0.6)"
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                                interval="preserveStartEnd"
                            />
                            <YAxis
                                stroke="rgba(140, 160, 200, 0.6)"
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(v) => `${v}ms`}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Area
                                type="monotone"
                                dataKey="avg_ms"
                                stroke={COLORS.line}
                                strokeWidth={2}
                                fill="url(#durationFill)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </CardContent>
        </Card>
    );
}

import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { countDomain } from '@/lib/chart-domain';
import type { WeeklyResolution } from '../types';

type Props = {
    series: WeeklyResolution[];
};

const COLORS = {
    accent: '#10b981',
    border: 'rgba(100, 130, 200, 0.15)',
    muted: 'rgba(140, 160, 200, 0.65)',
};

function ChartTooltip({
    active,
    payload,
    label,
}: {
    active?: boolean;
    payload?: Array<{ value: number; payload: WeeklyResolution }>;
    label?: string;
}) {
    if (!active || !payload?.length) {
        return null;
    }

    const point = payload[0];

    return (
        <div className="bg-popover border-border rounded-lg border px-3 py-2 text-xs shadow-xl">
            <p className="text-muted-foreground mb-1 font-medium">
                Week of {label}
            </p>
            <div className="flex items-center gap-2">
                <span
                    className="inline-block size-2 rounded-full"
                    style={{ backgroundColor: COLORS.accent }}
                />
                <span className="text-muted-foreground">Resolved:</span>
                <span className="text-foreground font-mono font-semibold">
                    {point.value}
                </span>
            </div>
        </div>
    );
}

export function WeeklyResolutionsChart({ series }: Props) {
    const total = series.reduce((sum, point) => sum + point.count, 0);
    const isEmpty = total === 0;

    return (
        <Card className="flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                    <p className="text-muted-foreground text-[11px] font-semibold uppercase tracking-widest">
                        Resolution trend
                    </p>
                    <CardTitle className="text-base font-semibold">
                        Resolutions per week
                    </CardTitle>
                </div>
                <span className="text-muted-foreground text-xs tabular-nums">
                    {total} total
                </span>
            </CardHeader>
            <CardContent className="flex-1 pb-4">
                <div className="h-[220px] w-full">
                    {isEmpty ? (
                        <div className="text-muted-foreground flex h-full items-center justify-center text-sm">
                            No resolutions in this window yet.
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart
                                data={series}
                                margin={{
                                    top: 10,
                                    right: 12,
                                    left: 0,
                                    bottom: 0,
                                }}
                            >
                                <defs>
                                    <linearGradient
                                        id="weekly-resolved-grad"
                                        x1="0"
                                        y1="0"
                                        x2="0"
                                        y2="1"
                                    >
                                        <stop
                                            offset="0%"
                                            stopColor={COLORS.accent}
                                            stopOpacity={0.35}
                                        />
                                        <stop
                                            offset="100%"
                                            stopColor={COLORS.accent}
                                            stopOpacity={0}
                                        />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke={COLORS.border}
                                />
                                <XAxis
                                    dataKey="label"
                                    tickLine={false}
                                    axisLine={false}
                                    tick={{
                                        fontSize: 10,
                                        fill: COLORS.muted,
                                    }}
                                    interval="preserveStartEnd"
                                />
                                <YAxis
                                    tickLine={false}
                                    axisLine={false}
                                    tick={{
                                        fontSize: 10,
                                        fill: COLORS.muted,
                                    }}
                                    width={30}
                                    domain={countDomain()}
                                    allowDecimals={false}
                                />
                                <Tooltip
                                    content={<ChartTooltip />}
                                    cursor={false}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="count"
                                    stroke={COLORS.accent}
                                    strokeWidth={1.75}
                                    fill="url(#weekly-resolved-grad)"
                                    dot={false}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

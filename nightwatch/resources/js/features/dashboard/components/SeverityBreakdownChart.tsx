import { useMemo } from 'react';
import {
    Bar,
    BarChart,
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

type VolumePoint = {
    time: string;
    errors: number;
    warnings: number;
};

type Props = {
    data?: VolumePoint[];
    timePeriod?: string;
};

function emptyHourlyVolume(): VolumePoint[] {
    const start = new Date();
    start.setMinutes(0, 0, 0);
    start.setHours(start.getHours() - 23);

    return Array.from({ length: 24 }, (_, i) => {
        const d = new Date(start.getTime() + i * 60 * 60 * 1000);
        const label = `${d.getHours().toString().padStart(2, '0')}:00`;

        return { time: label, errors: 0, warnings: 0 };
    });
}

const COLORS = {
    errors: '#818cf8',
    warnings: '#475569',
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

export function SeverityBreakdownChart({ data, timePeriod = '24H' }: Props) {
    const chartData = useMemo(
        () => (data && data.length > 0 ? data : emptyHourlyVolume()),
        [data],
    );

    return (
        <Card className="flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                    <p className="text-muted-foreground text-[11px] font-semibold tracking-widest uppercase">
                        Issue Severity Breakdown
                    </p>
                    <CardTitle className="text-lg font-bold">
                        Incident Volume
                    </CardTitle>
                </div>
                <span className="text-muted-foreground text-[10px] font-medium tracking-wide uppercase">
                    {timePeriod}
                </span>
            </CardHeader>
            <CardContent className="flex-1 pb-4">
                <div className="h-[220px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} barCategoryGap="15%">
                            <CartesianGrid
                                strokeDasharray="3 3"
                                stroke={COLORS.border}
                                horizontal
                                vertical={false}
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
                            />
                            <Tooltip content={<CustomTooltip />} cursor={false} />
                            <Bar
                                dataKey="warnings"
                                fill={COLORS.warnings}
                                stackId="volume"
                                radius={[0, 0, 0, 0]}
                                opacity={0.85}
                            />
                            <Bar
                                dataKey="errors"
                                fill={COLORS.errors}
                                stackId="volume"
                                radius={[2, 2, 0, 0]}
                                opacity={0.85}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}

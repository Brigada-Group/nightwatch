import {
    Bar,
    BarChart,
    Cell,
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
import type { TopExceptionClass } from '../api/dashboardService';

type Props = {
    data: TopExceptionClass[];
    timePeriod?: string;
};

const BAR_COLORS = ['#ef4444', '#f97316', '#eab308', '#a855f7', '#3b82f6'];

function shortClass(fqcn: string): string {
    if (!fqcn) return '—';
    const parts = fqcn.split('\\');
    return parts[parts.length - 1] || fqcn;
}

function CustomTooltip({
    active,
    payload,
}: {
    active?: boolean;
    payload?: Array<{ value: number; payload: TopExceptionClass }>;
}) {
    if (!active || !payload?.length) return null;

    const item = payload[0];
    return (
        <div className="bg-popover text-popover-foreground rounded-md border border-border p-2 shadow-md">
            <p className="font-mono text-xs font-medium">
                {item.payload.exception_class}
            </p>
            <p className="text-muted-foreground mt-0.5 text-xs">
                {item.value} occurrence{item.value === 1 ? '' : 's'}
            </p>
        </div>
    );
}

export function TopExceptionClassesChart({ data, timePeriod = '24H' }: Props) {
    const rows = [...data]
        .map((d) => ({ ...d, label: shortClass(d.exception_class) }))
        .sort((a, b) => a.total - b.total);

    return (
        <Card className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
                <CardTitle className="text-sm font-semibold">
                    Top Exception Classes
                </CardTitle>
                <span className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider">
                    {timePeriod}
                </span>
            </CardHeader>
            <CardContent className="px-2 pb-3 pt-0">
                {rows.length === 0 ? (
                    <p className="text-muted-foreground py-8 text-center text-xs">
                        No exceptions in the last {timePeriod}.
                    </p>
                ) : (
                    <ResponsiveContainer width="100%" height={32 + rows.length * 32}>
                        <BarChart
                            data={rows}
                            layout="vertical"
                            margin={{ top: 4, right: 16, left: 0, bottom: 4 }}
                        >
                            <XAxis
                                type="number"
                                tickLine={false}
                                axisLine={false}
                                stroke="rgba(140, 160, 200, 0.6)"
                                fontSize={10}
                                allowDecimals={false}
                            />
                            <YAxis
                                type="category"
                                dataKey="label"
                                tickLine={false}
                                axisLine={false}
                                stroke="rgba(140, 160, 200, 0.6)"
                                fontSize={11}
                                width={140}
                            />
                            <Tooltip
                                cursor={{ fill: 'rgba(120, 140, 200, 0.08)' }}
                                content={<CustomTooltip />}
                            />
                            <Bar dataKey="total" radius={[0, 4, 4, 0]}>
                                {rows.map((_, i) => (
                                    <Cell
                                        key={i}
                                        fill={
                                            BAR_COLORS[
                                                (rows.length - 1 - i) %
                                                    BAR_COLORS.length
                                            ]
                                        }
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </CardContent>
        </Card>
    );
}

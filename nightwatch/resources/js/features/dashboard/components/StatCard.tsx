import type { LucideIcon } from 'lucide-react';
import {
    Bar,
    BarChart,
    ResponsiveContainer,
    YAxis,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { countDomain } from '@/lib/chart-domain';
import { cn } from '@/lib/utils';

type BarDatum = { value: number };

type Props = {
    title: string;
    value: string | number;
    subtitle?: string;
    icon?: LucideIcon;
    trend?: 'up' | 'down' | 'neutral';
    timePeriod?: string;
    chartData?: BarDatum[];
    chartColor?: string;
    className?: string;
};

export function StatCard({
    title,
    value,
    subtitle,
    icon: Icon,
    trend,
    timePeriod,
    chartData,
    chartColor = '#6d8cff',
    className,
}: Props) {
    return (
        <Card className={cn('relative overflow-hidden', className)}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-muted-foreground text-[11px] font-semibold tracking-widest uppercase">
                    {title}
                </CardTitle>
                {timePeriod && (
                    <span className="text-muted-foreground text-[10px] font-medium tracking-wide uppercase">
                        {timePeriod}
                    </span>
                )}
            </CardHeader>
            <CardContent className="space-y-3">
                <div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold tracking-tight">
                            {value}
                        </span>
                        {subtitle && (
                            <span
                                className={cn(
                                    'text-muted-foreground text-xs',
                                    trend === 'up' && 'text-red-500',
                                    trend === 'down' && 'text-green-500',
                                )}
                            >
                                {subtitle}
                            </span>
                        )}
                    </div>
                </div>

                {chartData && chartData.length > 0 && (
                    <div className="h-[60px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} barCategoryGap="20%">
                                <YAxis
                                    hide
                                    domain={countDomain()}
                                    allowDecimals={false}
                                />
                                <Bar
                                    dataKey="value"
                                    fill={chartColor}
                                    radius={[2, 2, 0, 0]}
                                    opacity={0.85}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {Icon && !chartData && (
                    <div className="absolute right-4 top-4">
                        <Icon className="text-muted-foreground/40 size-8" />
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

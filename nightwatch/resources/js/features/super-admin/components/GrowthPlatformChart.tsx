import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { GrowthSeriesPoint } from '@/features/super-admin/types';

type Props = {
    series: GrowthSeriesPoint[];
    hasSparseHistory: boolean;
};

export function GrowthPlatformChart({ series, hasSparseHistory }: Props) {
    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-foreground text-base font-semibold">Platform growth (snapshots)</CardTitle>
                {hasSparseHistory ? (
                    <p className="text-muted-foreground text-xs">
                        History fills in as metrics are recorded daily (scheduler + dashboard, hourly).
                    </p>
                ) : null}
            </CardHeader>
            <CardContent className="h-[280px] pt-0">
                {series.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No snapshot data yet.</p>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                            <XAxis dataKey="date" tick={{ fontSize: 10 }} className="text-muted-foreground" />
                            <YAxis allowDecimals={false} tick={{ fontSize: 10 }} className="text-muted-foreground" />
                            <Tooltip
                                contentStyle={{ fontSize: 12 }}
                                labelFormatter={(d) => String(d)}
                            />
                            <Legend wrapperStyle={{ fontSize: 12 }} />
                            <Line type="monotone" dataKey="users" name="Users" stroke="#6d8cff" dot={false} strokeWidth={2} />
                            <Line type="monotone" dataKey="teams" name="Teams" stroke="#22c55e" dot={false} strokeWidth={2} />
                            <Line type="monotone" dataKey="projects" name="Projects" stroke="#a855f7" dot={false} strokeWidth={2} />
                        </LineChart>
                    </ResponsiveContainer>
                )}
            </CardContent>
        </Card>
    );
}

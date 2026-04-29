import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { countDomain } from '@/lib/chart-domain';

type Props = {
    databaseLabel: string;
    telemetryRows: number;
    trend: Array<{ date: string; value: number }>;
};

const fmt = new Intl.NumberFormat();

export function DatabaseFootprintSection({ databaseLabel, telemetryRows, trend }: Props) {
    return (
        <div className="grid gap-4 lg:grid-cols-2">
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-foreground text-base font-semibold">Storage footprint</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                    <div>
                        <p className="text-muted-foreground text-xs uppercase tracking-wide">Database (estimate)</p>
                        <p className="text-foreground text-xl font-semibold">{databaseLabel}</p>
                    </div>
                    <div>
                        <p className="text-muted-foreground text-xs uppercase tracking-wide">Telemetry rows (approx.)</p>
                        <p className="text-foreground text-xl font-semibold tabular-nums">{fmt.format(telemetryRows)}</p>
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-foreground text-base font-semibold">Telemetry row growth (snapshots)</CardTitle>
                </CardHeader>
                <CardContent className="h-[200px]">
                    {trend.length === 0 ? (
                        <p className="text-muted-foreground text-sm">No history.</p>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trend} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                                <XAxis dataKey="date" tick={{ fontSize: 10 }} className="text-muted-foreground" />
                                <YAxis tick={{ fontSize: 10 }} domain={countDomain()} allowDecimals={false} className="text-muted-foreground" />
                                <Tooltip contentStyle={{ fontSize: 12 }} />
                                <Area type="monotone" dataKey="value" name="Rows" stroke="#6d8cff" fill="#6d8cff" fillOpacity={0.2} />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

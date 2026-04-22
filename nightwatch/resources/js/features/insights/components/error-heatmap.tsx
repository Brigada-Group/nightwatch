import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';

export type HeatmapCell = {
    dow: number;
    hour: number;
    errors: number;
};

export type HeatmapProps = {
    cells: HeatmapCell[];
    max: number;
};

const DOW_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function intensity(value: number, max: number): number {
    if (max <= 0 || value <= 0) {
        return 0;
    }

    // Log scale so a few very bad hours don't wash everything else out.
    return Math.min(1, Math.log1p(value) / Math.log1p(max));
}

function cellStyle(value: number, max: number): React.CSSProperties {
    const alpha = intensity(value, max);
    if (alpha === 0) {
        return { backgroundColor: 'transparent' };
    }

    // Red ramp, strong enough to pop against light or dark backgrounds.
    return { backgroundColor: `rgba(239, 68, 68, ${0.12 + alpha * 0.78})` };
}

export function ErrorHeatmap({ cells, max }: HeatmapProps) {
    const grid: HeatmapCell[][] = Array.from({ length: 7 }, () =>
        Array.from({ length: 24 }, (_, hour) => ({
            dow: 0,
            hour,
            errors: 0,
        })),
    );
    for (const cell of cells) {
        if (cell.dow >= 0 && cell.dow < 7 && cell.hour >= 0 && cell.hour < 24) {
            grid[cell.dow][cell.hour] = cell;
        }
    }

    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-base">Error heatmap</CardTitle>
                <CardDescription>
                    Request errors (status ≥ 400) by day of week × hour of day.
                    Darker cells = more errors. Max in window: {max.toLocaleString()}.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <table className="min-w-[640px] border-separate border-spacing-0.5">
                        <thead>
                            <tr>
                                <th className="w-10" />
                                {Array.from({ length: 24 }, (_, h) => (
                                    <th
                                        key={h}
                                        className="text-muted-foreground w-6 text-center text-[10px] font-normal"
                                    >
                                        {h % 3 === 0 ? h : ''}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {grid.map((row, dow) => (
                                <tr key={dow}>
                                    <td className="text-muted-foreground pr-2 text-right text-[11px]">
                                        {DOW_LABELS[dow]}
                                    </td>
                                    {row.map((cell, hour) => (
                                        <td
                                            key={hour}
                                            title={`${DOW_LABELS[dow]} ${hour.toString().padStart(2, '0')}:00 — ${cell.errors} error${cell.errors === 1 ? '' : 's'}`}
                                            className="border-border/40 size-5 rounded-sm border"
                                            style={cellStyle(cell.errors, max)}
                                        />
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="text-muted-foreground mt-3 flex items-center gap-2 text-[11px]">
                    <span>less</span>
                    {[0.1, 0.3, 0.55, 0.8, 1].map((a) => (
                        <span
                            key={a}
                            className="border-border/40 inline-block size-3 rounded-sm border"
                            style={{
                                backgroundColor: `rgba(239, 68, 68, ${0.12 + a * 0.78})`,
                            }}
                        />
                    ))}
                    <span>more</span>
                </div>
            </CardContent>
        </Card>
    );
}

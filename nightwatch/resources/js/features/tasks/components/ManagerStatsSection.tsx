import { StatsKpiRow } from './StatsKpiRow';
import { TopResolversCard } from './TopResolversCard';
import { WeeklyResolutionsChart } from './WeeklyResolutionsChart';
import type { ManagerStats } from '../types';

type Props = {
    stats: ManagerStats;
};

/**
 * Composes the four KPI tiles, the weekly resolution chart, and the top
 * resolvers leaderboard into the manager-only stats header. Each piece is a
 * self-contained component so individual panels can be reused or swapped
 * without touching the page.
 */
export function ManagerStatsSection({ stats }: Props) {
    return (
        <div className="flex flex-col gap-4">
            <StatsKpiRow counts={stats.status_counts} />
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    <WeeklyResolutionsChart
                        series={stats.weekly_resolutions}
                    />
                </div>
                <TopResolversCard resolvers={stats.top_resolvers} />
            </div>
        </div>
    );
}

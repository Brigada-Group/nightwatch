import { dashboardSpendingBars, dashboardStats } from '@/features/landing/data/landing-content';
import { motion } from 'framer-motion';

type StatTileProps = {
    label: string;
    value: string;
    tone: string;
};

function StatTile({ label, value, tone }: StatTileProps) {
    return (
        <motion.article
            whileHover={{ y: -5 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="landing-gradient-border rounded-xl border border-zinc-800 bg-zinc-900/70 p-3 transition duration-300 hover:border-violet-300/40 hover:shadow-[0_12px_28px_rgba(124,58,237,0.2)]"
        >
            <p className="text-[11px] text-zinc-400">{label}</p>
            <p className="mt-1 text-2xl font-semibold text-zinc-100">{value}</p>
            <div className="mt-3 flex gap-1">
                <span className={`h-2 w-2 rounded-full ${tone}`} />
                <span className="h-2 w-2 rounded-full bg-zinc-700" />
                <span className="h-2 w-2 rounded-full bg-zinc-700" />
            </div>
        </motion.article>
    );
}

type SpendingBarProps = {
    height: number;
    highlighted: boolean;
};

function SpendingBar({ height, highlighted }: SpendingBarProps) {
    return (
        <div className="w-full rounded-t-md bg-zinc-800">
            <div
                className={`w-full rounded-t-md ${highlighted ? 'bg-violet-500' : 'bg-zinc-700'}`}
                style={{ height: `${height}%` }}
            />
        </div>
    );
}

export function LandingDashboardPreview() {
    return (
        <div className="landing-gradient-border relative mx-auto mt-12 w-full max-w-4xl rounded-2xl border border-violet-400/35 bg-zinc-950/95 p-4 shadow-[0_26px_90px_rgba(0,0,0,0.75),0_0_0_1px_rgba(167,139,250,0.2)]">
            <div className="mb-4 flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/80 px-4 py-2">
                <div className="text-xs font-medium text-zinc-200">Overview</div>
                <div className="h-2 w-24 rounded-full bg-zinc-800" />
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {dashboardStats.map((stat) => (
                    <StatTile key={stat.label} label={stat.label} value={stat.value} tone={stat.tone} />
                ))}
            </div>

            <div className="mt-3 grid gap-3 lg:grid-cols-[2fr_1fr]">
                <motion.div
                    whileHover={{ y: -5 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    className="landing-gradient-border rounded-xl border border-zinc-800 bg-zinc-900/70 p-4"
                >
                    <div className="mb-3 h-2.5 w-28 rounded-full bg-zinc-700" />
                    <div className="flex h-28 items-end gap-2">
                        {dashboardSpendingBars.map((bar, index) => (
                            <SpendingBar key={index} height={bar} highlighted={index === 5} />
                        ))}
                    </div>
                </motion.div>

                <motion.div
                    whileHover={{ y: -5 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    className="landing-gradient-border rounded-xl border border-zinc-800 bg-zinc-900/70 p-4"
                >
                    <div className="mb-4 h-2.5 w-24 rounded-full bg-zinc-700" />
                    <div className="mx-auto h-32 w-32 rounded-full border-[14px] border-zinc-800 border-t-violet-500 border-r-indigo-400" />
                    <div className="mt-4 h-2 w-full rounded-full bg-zinc-800" />
                </motion.div>
            </div>
        </div>
    );
}

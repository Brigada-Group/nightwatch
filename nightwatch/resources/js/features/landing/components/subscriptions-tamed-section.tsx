import { subscriptionsTamedCards } from '@/features/landing/data/landing-content';
import { motion } from 'framer-motion';

type TamedCard = {
    title: string;
    description: string;
    value: string;
    trend: string;
};

function PatternBackdrop() {
    return (
        <div
            aria-hidden
            className="absolute inset-0 opacity-40"
            style={{
                backgroundImage:
                    'linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)',
                backgroundSize: '20px 20px',
            }}
        />
    );
}

function StatCard({ card }: { card: TamedCard }) {
    return (
        <article className="landing-gradient-border relative overflow-hidden rounded-2xl border border-zinc-800 bg-[#0a0a0a] p-5 transition duration-300 hover:-translate-y-1.5 hover:border-violet-300/45 hover:shadow-[0_14px_42px_rgba(124,58,237,0.22)]">
            <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 h-24"
                style={{
                    background: 'radial-gradient(circle at 50% 0%, rgba(139,92,246,0.35), rgba(0,0,0,0) 70%)',
                }}
            />

            <p className="relative text-xs uppercase tracking-[0.16em] text-zinc-400">{card.title}</p>
            <p className="relative mt-3 text-4xl font-semibold tracking-tight text-zinc-100">{card.value}</p>
            <p className="relative mt-1 text-xs font-medium text-violet-300">{card.trend}</p>
            <p className="relative mt-4 text-sm leading-6 text-zinc-400">{card.description}</p>
        </article>
    );
}

function SummaryPanel() {
    return (
        <div className="landing-gradient-border relative overflow-hidden rounded-2xl border border-violet-300/25 bg-[#0b0b0d] p-6">
            <PatternBackdrop />
            <div
                aria-hidden
                className="pointer-events-none absolute left-1/2 top-0 h-40 w-[520px] -translate-x-1/2"
                style={{
                    background: 'radial-gradient(circle at center, rgba(139,92,246,0.33), rgba(0,0,0,0) 72%)',
                }}
            />

            <div className="relative">
                <p className="text-xs uppercase tracking-[0.16em] text-zinc-400">Subscription control center</p>
                <h3 className="mt-3 text-2xl font-medium tracking-tight text-zinc-100 sm:text-3xl">
                    One view to cut waste and stop renewal surprises.
                </h3>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">
                    Guardian combines usage activity, renewal dates, and spend patterns so your team sees exactly
                    what to keep, downgrade, or cancel.
                </p>
            </div>
        </div>
    );
}

export function SubscriptionsTamedSection() {
    return (
        <section className="bg-[#070707] px-4 pb-24 pt-8 sm:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-5xl">
                <div className="mx-auto max-w-3xl text-center">
                    <h2 className="text-4xl font-medium tracking-tight text-zinc-100 sm:text-5xl">
                        Your subscriptions,
                        <span className="block italic text-violet-200">finally tamed.</span>
                    </h2>
                    <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-zinc-400">
                        Move from chaotic trial sprawl to a clean, accountable stack with proactive alerts and
                        crystal-clear spend visibility.
                    </p>
                </div>

                <div className="mt-10">
                    <SummaryPanel />
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-3">
                    {subscriptionsTamedCards.map((card, index) => (
                        <motion.div
                            key={card.title}
                            initial={{ opacity: 0, y: 22 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, amount: 0.3 }}
                            transition={{ duration: 0.45, delay: index * 0.08, ease: 'easeOut' }}
                        >
                            <StatCard card={card} />
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}

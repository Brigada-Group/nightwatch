import { freeTrialTrapCards, trialAppRows, trialCalendarCells } from '@/features/landing/data/landing-content';
import { motion } from 'framer-motion';

type TrapCardData = {
    title: string;
    description: string;
};

function TrapMiniMock({ index }: { index: number }) {
    if (index === 0) {
        return (
            <div className="mx-auto w-full max-w-[210px] rounded-xl border border-zinc-700/70 bg-[#090909] p-3">
                <div className="space-y-2">
                    <div className="h-5 rounded-md bg-zinc-800" />
                    <div className="h-5 rounded-md bg-zinc-800" />
                    <div className="grid grid-cols-2 gap-2">
                        <div className="h-4 rounded-md bg-zinc-800" />
                        <div className="h-4 rounded-md bg-zinc-800" />
                    </div>
                    <div className="h-6 rounded-md bg-gradient-to-r from-violet-600 to-indigo-500" />
                </div>
            </div>
        );
    }

    if (index === 1) {
        return (
            <div className="mx-auto w-full max-w-[210px] rounded-xl border border-zinc-700/70 bg-[#090909] p-3">
                <div className="mb-2 flex items-center justify-between">
                    <span className="h-2 w-14 rounded-full bg-zinc-700" />
                    <span className="h-2 w-7 rounded-full bg-zinc-700" />
                </div>
                <div className="grid grid-cols-7 gap-1">
                    {trialCalendarCells.map((day) => (
                        <div
                            key={day}
                            className={`h-4 rounded-sm ${day === 17 ? 'bg-violet-500' : 'bg-zinc-800'}`}
                        />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto w-full max-w-[210px] rounded-xl border border-zinc-700/70 bg-[#090909] p-3">
            <div className="space-y-2">
                {trialAppRows.map((app, appIndex) => (
                    <div key={app} className="flex items-center justify-between rounded-md border border-zinc-700/80 px-2 py-1.5">
                        <div className="flex items-center gap-2">
                            <span className={`h-2.5 w-2.5 rounded-full ${appIndex === 2 ? 'bg-violet-500' : 'bg-zinc-500'}`} />
                            <span className="text-[10px] text-zinc-300">{app}</span>
                        </div>
                        <span className="text-[10px] text-zinc-400">${appIndex === 0 ? '40' : appIndex === 1 ? '20' : '15'}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function TrapCard({ title, description, index }: TrapCardData & { index: number }) {
    return (
        <article className="landing-gradient-border rounded-2xl border border-zinc-800 bg-[#080808] p-4 transition duration-300 hover:-translate-y-1.5 hover:border-violet-300/45 hover:shadow-[0_14px_42px_rgba(124,58,237,0.22)]">
            <div
                className="landing-gradient-border rounded-xl border border-violet-300/20 px-3 py-4"
                style={{
                    background:
                        'radial-gradient(circle at 50% -5%, rgba(139,92,246,0.42), rgba(15,15,15,0.98) 45%)',
                }}
            >
                <TrapMiniMock index={index} />
            </div>
            <h3 className="mt-4 text-2xl font-medium tracking-tight text-zinc-100">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-zinc-400">{description}</p>
        </article>
    );
}

export function FreeTrialTrapSection() {
    return (
        <section className="bg-[#070707] px-4 pb-20 pt-12 sm:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-5xl">
                <div className="mx-auto max-w-2xl text-center">
                    <h2 className="text-4xl font-medium tracking-tight text-zinc-100 sm:text-5xl">
                        The <span className="italic text-violet-200">"Free Trial"</span>
                        <br />
                        Trap Is Real.
                    </h2>
                    <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-zinc-400">
                        Teams sign up for tools fast and forget renewals even faster. Nightwatch makes hidden risk
                        visible before it starts draining your budget.
                    </p>
                </div>

                <div className="mt-10 grid gap-4 md:grid-cols-3">
                    {freeTrialTrapCards.map((card, index) => (
                        <motion.div
                            key={card.title}
                            initial={{ opacity: 0, y: 22 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, amount: 0.3 }}
                            transition={{ duration: 0.45, delay: index * 0.08, ease: 'easeOut' }}
                        >
                            <TrapCard title={card.title} description={card.description} index={index} />
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}

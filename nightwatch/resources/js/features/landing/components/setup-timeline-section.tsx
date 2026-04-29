import { setupSectionContent, setupTimelineRows, type SetupTimelineCard } from '@/features/landing/data/landing-content';
import { motion, useMotionValueEvent, useScroll } from 'framer-motion';
import { useRef, useState } from 'react';

function ShieldVisual() {
    return (
        <div className="landing-gradient-border relative overflow-hidden rounded-2xl border border-violet-300/20 bg-[#0b0b0c] p-6">
            <div className="absolute inset-x-0 top-0 h-20 bg-[radial-gradient(circle_at_top,rgba(139,92,246,0.45),transparent_70%)]" />
            <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-3xl border border-violet-300/20 bg-zinc-900">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden>
                        <path
                            d="M12 3.25 18.5 6v5.4c0 4.1-2.8 7.8-6.5 9.35-3.7-1.55-6.5-5.25-6.5-9.35V6L12 3.25Z"
                            fill="rgba(255,255,255,0.18)"
                            stroke="rgba(255,255,255,0.45)"
                            strokeWidth="1.2"
                        />
                        <path
                            d="m8.45 12.35 2.2 2.2 4.7-4.7"
                            stroke="white"
                            strokeWidth="1.9"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </div>
            </div>
        </div>
    );
}

function DotsVisual() {
    return (
        <div className="landing-gradient-border relative overflow-hidden rounded-2xl border border-violet-300/20 bg-[#0b0b0c] p-6">
            <div className="absolute left-0 top-0 h-full w-24 bg-[radial-gradient(circle_at_right,rgba(139,92,246,0.35),transparent_70%)]" />
            <div className="grid grid-cols-6 gap-2">
                {Array.from({ length: 18 }).map((_, idx) => (
                    <span
                        key={idx}
                        className={`h-2.5 w-2.5 rounded-full ${
                            idx % 7 === 0 ? 'bg-violet-400' : idx % 5 === 0 ? 'bg-indigo-400' : 'bg-zinc-700'
                        }`}
                    />
                ))}
            </div>
        </div>
    );
}

function BillingVisual() {
    return (
        <div className="landing-gradient-border relative overflow-hidden rounded-2xl border border-violet-300/20 bg-[#0b0b0c] p-6">
            <div className="absolute inset-x-0 top-0 h-16 bg-[radial-gradient(circle_at_top,rgba(139,92,246,0.35),transparent_70%)]" />
            <div className="mx-auto max-w-[220px] space-y-2 rounded-xl border border-zinc-700/70 bg-zinc-900/90 p-3">
                {[
                    ['Slack', '$15'],
                    ['Figma', '$28'],
                    ['Notion', '$40'],
                ].map(([name, price], i) => (
                    <div key={name} className="flex items-center justify-between rounded-md border border-zinc-700/80 px-2 py-1.5">
                        <div className="flex items-center gap-2">
                            <span className={`h-2.5 w-2.5 rounded-full ${i === 2 ? 'bg-violet-400' : 'bg-zinc-500'}`} />
                            <span className="text-[10px] text-zinc-300">{name}</span>
                        </div>
                        <span className="text-[10px] text-zinc-400">{price}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function VisualCard({ variant }: { variant: 'shield' | 'dots' | 'billing' }) {
    if (variant === 'shield') {
        return <ShieldVisual />;
    }

    if (variant === 'dots') {
        return <DotsVisual />;
    }

    return <BillingVisual />;
}

function StepCard({ card }: { card: SetupTimelineCard }) {
    if (card.kind === 'text') {
        return (
            <article className="landing-gradient-border rounded-2xl border border-zinc-800 bg-[#090909] p-6 transition duration-300 hover:-translate-y-1 hover:border-violet-300/45 hover:shadow-[0_14px_40px_rgba(124,58,237,0.2)]">
                <h3 className="text-2xl font-medium tracking-tight text-zinc-100">{card.title}</h3>
                <p className="mt-3 text-sm leading-6 text-zinc-400">{card.description}</p>
            </article>
        );
    }

    return (
        <div className="transition duration-300 hover:-translate-y-1 hover:drop-shadow-[0_14px_40px_rgba(124,58,237,0.2)]">
            <VisualCard variant={card.variant} />
        </div>
    );
}

export function SetupTimelineSection() {
    const sectionRef = useRef<HTMLElement | null>(null);
    const [activeStep, setActiveStep] = useState(1);

    const totalSteps = setupTimelineRows.length;
    const progressPercent = totalSteps > 1 ? ((activeStep - 1) / (totalSteps - 1)) * 100 : 100;
    
    const { scrollYProgress } = useScroll({
        target: sectionRef,
        offset: ['start 70%', 'end 35%'],
    });

    useMotionValueEvent(scrollYProgress, 'change', (value) => {
        if (value < 0.34) {
            setActiveStep(1);
            return;
        }
        if (value < 0.67) {
            setActiveStep(2);
            return;
        }
        setActiveStep(3);
    });

    return (
        <section ref={sectionRef} className="bg-[#070707] px-4 pb-24 pt-8 sm:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-5xl">
                <div className="mx-auto max-w-2xl text-center">
                    <h2 className="text-4xl font-medium tracking-tight text-zinc-100 sm:text-5xl">{setupSectionContent.title}</h2>
                    <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-zinc-400">{setupSectionContent.description}</p>
                </div>

                <div className="relative mt-12 space-y-8">
                    <div className="pointer-events-none absolute left-1/2 top-5 hidden h-[calc(100%-2.5rem)] w-px -translate-x-1/2 bg-zinc-800 md:block" />
                    <div
                        className="pointer-events-none absolute left-1/2 top-5 hidden w-px -translate-x-1/2 bg-gradient-to-b from-violet-400 to-indigo-400 transition-all duration-500 md:block"
                        style={{ height: `calc((100% - 2.5rem) * ${progressPercent / 100})` }}
                    />

                    {setupTimelineRows.map((row, index) => (
                        <div key={row.step} className="relative grid gap-5 md:grid-cols-[1fr_auto_1fr] md:items-center md:gap-6">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, amount: 0.3 }}
                                transition={{ duration: 0.45, delay: index * 0.06, ease: 'easeOut' }}
                            >
                                <StepCard card={row.left} />
                            </motion.div>

                            <div className="relative z-20 hidden rounded-full bg-[#070707] p-2 md:flex">
                                <span
                                    className={`flex h-9 w-9 items-center justify-center rounded-full border text-xs font-semibold transition-all duration-300 ${
                                        activeStep >= row.step
                                            ? 'border-violet-300/70 bg-violet-500/20 text-violet-100 shadow-[0_0_28px_rgba(139,92,246,0.45)]'
                                            : 'border-zinc-700 bg-[#090909] text-zinc-400'
                                    }`}
                                >
                                    {`0${row.step}`}
                                </span>
                            </div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, amount: 0.3 }}
                                transition={{ duration: 0.45, delay: index * 0.08 + 0.06, ease: 'easeOut' }}
                            >
                                <StepCard card={row.right} />
                            </motion.div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

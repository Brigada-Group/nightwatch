import {
    envCommandBlock,
    howItWorksSectionContent,
    howItWorksSteps,
    installCommandBlock,
    type HowItWorksStep,
} from '@/features/landing/data/landing-content';
import { motion, useInView } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';

function TypewriterLine({
    text,
    active,
    delayMs = 0,
    speedMs = 18,
    prefix = '$',
}: {
    text: string;
    active: boolean;
    delayMs?: number;
    speedMs?: number;
    prefix?: string;
}) {
    const [output, setOutput] = useState('');

    useEffect(() => {
        if (!active) {
            return;
        }

        let index = 0;
        let intervalId: ReturnType<typeof setInterval> | null = null;
        const timeoutId = setTimeout(() => {
            intervalId = setInterval(() => {
                index += 1;
                setOutput(text.slice(0, index));
                if (index >= text.length && intervalId) {
                    clearInterval(intervalId);
                }
            }, speedMs);
        }, delayMs);

        return () => {
            clearTimeout(timeoutId);
            if (intervalId) {
                clearInterval(intervalId);
            }
        };
    }, [active, delayMs, speedMs, text]);

    return (
        <div>
            {prefix ? <span className="mr-2 text-violet-300">{prefix}</span> : null}
            <span>{output}</span>
            {active && output.length < text.length ? <span className="ml-0.5 animate-pulse text-violet-300">|</span> : null}
        </div>
    );
}

function CodeBlock({ title, lines, active }: { title: string; lines: string[]; active: boolean }) {
    return (
        <div className="landing-gradient-border overflow-hidden rounded-xl border border-zinc-800 bg-[#0b0b0e]">
            <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/80 px-4 py-2">
                <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-zinc-600" />
                    <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
                    <span className="h-2.5 w-2.5 rounded-full bg-zinc-800" />
                </div>
                <span className="text-[11px] text-zinc-400">{title}</span>
            </div>
            <pre className="overflow-x-auto px-4 py-4 text-xs leading-6 text-zinc-200">
                <code>
                    {lines.map((line, index) => (
                        <TypewriterLine
                            key={line}
                            text={line}
                            active={active}
                            delayMs={index * 160}
                            speedMs={16}
                            prefix="$"
                        />
                    ))}
                </code>
            </pre>
        </div>
    );
}

function EnvBlock({ title, lines, active }: { title: string; lines: string[]; active: boolean }) {
    return (
        <div className="landing-gradient-border overflow-hidden rounded-xl border border-violet-300/25 bg-[#0b0b0e]">
            <div className="border-b border-zinc-800 bg-violet-500/10 px-4 py-2 text-[11px] text-violet-100">{title}</div>
            <pre className="overflow-x-auto px-4 py-4 text-xs leading-6 text-zinc-200">
                <code>
                    {lines.map((line, index) => (
                        <TypewriterLine
                            key={line}
                            text={line}
                            active={active}
                            delayMs={index * 150}
                            speedMs={14}
                            prefix=""
                        />
                    ))}
                </code>
            </pre>
        </div>
    );
}

function StepItem({ step }: { step: HowItWorksStep }) {
    return (
        <div className="landing-gradient-border rounded-xl border border-zinc-800 bg-[#0a0a0d] px-4 py-3">
            <div className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full border border-violet-300/45 bg-violet-500/15 text-[11px] font-semibold text-violet-100">
                    {step.id}
                </span>
                <div>
                    <h3 className="text-sm font-semibold text-zinc-100">{step.title}</h3>
                    <p className="mt-1 text-xs leading-5 text-zinc-400">{step.description}</p>
                </div>
            </div>
        </div>
    );
}

export function HowItWorksSection() {
    const sectionRef = useRef<HTMLElement | null>(null);
    const inView = useInView(sectionRef, { once: true, amount: 0.35 });
    const typewriterReady = useMemo(() => inView, [inView]);

    return (
        <section ref={sectionRef} className="bg-[#070707] px-4 pb-14 pt-10 sm:px-6 lg:px-8">
            <div className="landing-gradient-border mx-auto w-full max-w-5xl rounded-2xl border border-zinc-800 bg-[#08080a] px-5 py-8 sm:px-7">
                <div className="text-center">
                    <span className="inline-flex rounded-full border border-violet-300/35 bg-violet-500/10 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-violet-100">
                        {howItWorksSectionContent.badge}
                    </span>
                    <h2 className="mt-4 text-4xl font-medium tracking-tight text-zinc-100 sm:text-5xl">
                        {howItWorksSectionContent.title}
                    </h2>
                    <p className="mx-auto mt-3 max-w-xl text-xs leading-5 text-zinc-500">{howItWorksSectionContent.description}</p>
                </div>

                <div className="mt-8 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
                    <motion.div
                        initial={{ opacity: 0, y: 18 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.25 }}
                        transition={{ duration: 0.45, ease: 'easeOut' }}
                        className="space-y-4"
                    >
                        <CodeBlock title={installCommandBlock.title} lines={installCommandBlock.lines} active={typewriterReady} />
                        <EnvBlock title={envCommandBlock.title} lines={envCommandBlock.lines} active={typewriterReady} />
                    </motion.div>

                    <div className="space-y-3">
                        {howItWorksSteps.map((step, index) => (
                            <motion.div
                                key={step.id}
                                initial={{ opacity: 0, x: 18 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true, amount: 0.25 }}
                                transition={{ duration: 0.35, delay: index * 0.06, ease: 'easeOut' }}
                            >
                                <StepItem step={step} />
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}

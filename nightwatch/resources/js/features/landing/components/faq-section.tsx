import { faqItems, faqSectionContent } from '@/features/landing/data/landing-content';
import { motion } from 'framer-motion';
import { useState } from 'react';

type FaqRowProps = {
    question: string;
    answer: string;
    open: boolean;
    onToggle: () => void;
};

function FaqRow({ question, answer, open, onToggle }: FaqRowProps) {
    return (
        <div className="landing-gradient-border rounded-lg border border-zinc-800 bg-[#0a0a0c]">
            <button
                type="button"
                onClick={onToggle}
                className="flex w-full cursor-pointer items-center justify-between gap-4 px-4 py-3 text-left"
            >
                <span className="text-sm text-zinc-100">{question}</span>
                <span
                    className={`inline-flex h-5 w-5 items-center justify-center rounded-full border text-xs transition ${
                        open
                            ? 'border-violet-300/60 bg-violet-500/20 text-violet-100'
                            : 'border-zinc-700 text-zinc-400'
                    }`}
                >
                    {open ? '−' : '+'}
                </span>
            </button>
            <motion.div
                initial={false}
                animate={{ height: open ? 'auto' : 0, opacity: open ? 1 : 0 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className="overflow-hidden"
            >
                <p className="px-4 pb-4 text-xs leading-5 text-zinc-400">{answer}</p>
            </motion.div>
        </div>
    );
}

export function FaqSection() {
    const [openIndex, setOpenIndex] = useState(0);

    return (
        <section className="bg-[#070707] px-4 pb-16 pt-6 sm:px-6 lg:px-8">
            <div className="mx-auto grid w-full max-w-5xl gap-8 border-t border-zinc-800 pt-10 md:grid-cols-[0.85fr_1.15fr]">
                <div className="md:pr-8">
                    <h2 className="text-4xl font-medium leading-tight tracking-tight text-zinc-100">
                        Frequently asked
                        <br />
                        questions
                    </h2>
                    <p className="mt-3 max-w-sm text-xs leading-5 text-zinc-500">{faqSectionContent.description}</p>
                    <button
                        type="button"
                        className="mt-4 cursor-pointer rounded-md border border-violet-300/45 bg-violet-500/10 px-3 py-1.5 text-[11px] font-medium text-violet-100 transition hover:bg-violet-500/20"
                    >
                        {faqSectionContent.cta}
                    </button>
                </div>

                <div className="space-y-2">
                    {faqItems.map((item, index) => (
                        <FaqRow
                            key={item.question}
                            question={item.question}
                            answer={item.answer}
                            open={openIndex === index}
                            onToggle={() => setOpenIndex((current) => (current === index ? -1 : index))}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}

import { testimonialCards, testimonialsSectionContent, type TestimonialCard } from '@/features/landing/data/landing-content';
import { motion } from 'framer-motion';

function Stars() {
    return (
        <div className="mb-3 flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, index) => (
                <svg key={index} width="10" height="10" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path
                        d="m12 3.7 2.5 5.06 5.58.81-4.04 3.94.95 5.56L12 16.4l-4.99 2.64.95-5.56-4.04-3.94 5.58-.81L12 3.7Z"
                        fill="url(#starGrad)"
                    />
                    <defs>
                        <linearGradient id="starGrad" x1="4" y1="4" x2="20" y2="20" gradientUnits="userSpaceOnUse">
                            <stop stopColor="#a78bfa" />
                            <stop offset="1" stopColor="#818cf8" />
                        </linearGradient>
                    </defs>
                </svg>
            ))}
        </div>
    );
}

function TestimonialCardView({ card }: { card: TestimonialCard }) {
    return (
        <article className="landing-gradient-border rounded-xl border border-zinc-800 bg-[#0a0a0c] p-4 transition duration-300 hover:-translate-y-1 hover:border-violet-300/45 hover:shadow-[0_14px_36px_rgba(124,58,237,0.2)]">
            <Stars />
            <p className="min-h-[96px] text-xs leading-5 text-zinc-300">{card.quote}</p>
            <div className="mt-4 flex items-center gap-2 border-t border-zinc-800 pt-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
                    {card.author.split(' ').map((part) => part[0]).join('')}
                </span>
                <div>
                    <p className="text-[11px] font-medium text-zinc-100">{card.author}</p>
                    <p className="text-[10px] text-zinc-500">{card.role}</p>
                </div>
            </div>
        </article>
    );
}

export function TestimonialsSection() {
    return (
        <section className="bg-[#070707] px-4 pb-16 pt-8 sm:px-6 lg:px-8">
            <div className="landing-gradient-border mx-auto w-full max-w-5xl rounded-[24px] border border-zinc-900 bg-[#060607] px-5 py-10 sm:px-8">
                <div className="mx-auto max-w-xl text-center">
                    <h2 className="text-4xl font-medium tracking-tight text-zinc-100 sm:text-5xl">
                        {testimonialsSectionContent.title.replace('smart users.', '')}
                        <span className="italic text-violet-200">smart users.</span>
                    </h2>
                    <p className="mx-auto mt-3 max-w-lg text-xs leading-5 text-zinc-500">
                        {testimonialsSectionContent.description}
                    </p>
                </div>

                <div className="mt-8 grid gap-3 md:grid-cols-3">
                    {testimonialCards.map((card, index) => (
                        <motion.div
                            key={card.author}
                            initial={{ opacity: 0, y: 18 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, amount: 0.35 }}
                            transition={{ duration: 0.4, delay: index * 0.07, ease: 'easeOut' }}
                        >
                            <TestimonialCardView card={card} />
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}

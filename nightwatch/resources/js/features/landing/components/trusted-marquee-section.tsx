import { trustedLogoNames } from '@/features/landing/data/landing-content';

function LogoItem({ name }: { name: string }) {
    return (
        <div className="mx-5 flex min-w-fit items-center gap-2 text-zinc-500">
            <span className="h-2 w-2 rounded-full bg-zinc-700" />
            <span className="text-xs font-medium tracking-wide">{name}</span>
        </div>
    );
}

export function TrustedMarqueeSection() {
    const marqueeItems = [...trustedLogoNames, ...trustedLogoNames];

    return (
        <section className="relative bg-[#070707] px-4 pt-8 sm:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-5xl border-t border-zinc-800/80 pt-8">
                <p className="text-center text-xs text-zinc-400">Trusted by 10,000+ smart teams and freelancers</p>

                <div className="relative mt-6 overflow-hidden">
                    <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-[#070707] to-transparent" />
                    <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-[#070707] to-transparent" />

                    <div className="flex w-max animate-[trusted-marquee_28s_linear_infinite] items-center py-2">
                        {marqueeItems.map((name, index) => (
                            <LogoItem key={`${name}-${index}`} name={name} />
                        ))}
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes trusted-marquee {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
            `}</style>
        </section>
    );
}

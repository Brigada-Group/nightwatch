import { LandingDashboardPreview } from './landing-dashboard-preview';
import { LandingNavbar } from './landing-navbar';

type HomeHeroSectionProps = {
    authenticated: boolean;
    canRegister: boolean;
};

export function HomeHeroSection({ authenticated, canRegister }: HomeHeroSectionProps) {
    return (
        <section className="relative min-h-screen overflow-hidden bg-[#070707] px-4 py-8 font-sans text-white sm:px-6 lg:px-8">
            <div
                aria-hidden
                className="absolute inset-0 opacity-40"
                style={{
                    backgroundImage:
                        'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
                    backgroundSize: '22px 22px',
                }}
            />
            <div
                aria-hidden
                className="pointer-events-none absolute left-1/2 top-0 h-[520px] w-[900px] -translate-x-1/2 rounded-full"
                style={{
                    background:
                        'radial-gradient(ellipse at center, rgba(139,92,246,0.6) 0%, rgba(99,102,241,0.25) 42%, rgba(7,7,7,0) 74%)',
                    filter: 'blur(22px)',
                }}
            />
            <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-violet-500/20 via-violet-500/5 to-transparent"
            />

            <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col">
                <LandingNavbar authenticated={authenticated} canRegister={canRegister} />

                <div className="mx-auto mt-16 max-w-3xl text-center sm:mt-20">
                    <h1 className="text-balance text-4xl font-semibold leading-tight tracking-tight text-zinc-100 sm:text-5xl md:text-6xl">
                        Stop Missing Critical
                        <span className="block bg-gradient-to-r from-violet-200 via-purple-300 to-indigo-400 bg-clip-text italic text-transparent">
                            Production Signals.
                        </span>
                    </h1>
                    <p className="mx-auto mt-5 max-w-2xl text-sm leading-6 text-zinc-400 sm:text-base">
                        Nightwatch tracks failed requests, queue retries, exceptions, and service health in one
                        collaborative control center so your team reacts faster.
                    </p>

                    <div className="mt-7 flex items-center justify-center gap-3">
                        <button
                            type="button"
                            className="cursor-pointer rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-md transition hover:bg-primary/90"
                        >
                            Get Started Free
                        </button>
                        <button
                            type="button"
                            className="cursor-pointer rounded-full border border-zinc-700 bg-zinc-900/60 px-6 py-2.5 text-sm font-medium text-zinc-200 transition hover:border-violet-300/60 hover:bg-violet-500/10"
                        >
                            View Demo
                        </button>
                    </div>
                </div>

                <LandingDashboardPreview />
            </div>
        </section>
    );
}

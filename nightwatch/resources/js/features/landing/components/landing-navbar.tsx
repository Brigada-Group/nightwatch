import { Link } from '@inertiajs/react';
import { landingNavItems } from '@/features/landing/data/landing-content';
import { dashboard, login, register } from '@/routes';

type LandingNavbarProps = {
    authenticated: boolean;
    canRegister: boolean;
};

export function LandingNavbar({ authenticated, canRegister }: LandingNavbarProps) {
    return (
        <header className="mx-auto flex w-full max-w-5xl items-center justify-between rounded-full border border-violet-300/20 bg-black/65 px-6 py-3 backdrop-blur-xl">
            <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-violet-400 shadow-[0_0_24px_2px_rgba(167,139,250,0.75)]" />
                <span className="text-sm font-semibold tracking-wide text-white">NIGHTWATCH</span>
            </div>

            <nav className="hidden items-center gap-6 md:flex">
                {landingNavItems.map((item) => (
                    <button
                        key={item}
                        type="button"
                        className="cursor-pointer rounded-full px-2 py-1 text-xs text-zinc-400 transition hover:bg-white/5 hover:text-zinc-200"
                    >
                        {item}
                    </button>
                ))}
            </nav>

            <div className="flex items-center gap-2">
                {authenticated ? (
                    <Link
                        href={dashboard()}
                        className="cursor-pointer rounded-full border border-zinc-700 px-4 py-1.5 text-xs font-medium text-zinc-100 transition hover:border-violet-300/50 hover:bg-violet-500/10"
                    >
                        Dashboard
                    </Link>
                ) : (
                    <>
                        <Link
                            href={login()}
                            className="cursor-pointer rounded-full border border-transparent px-3 py-1.5 text-xs font-medium text-zinc-300 transition hover:border-zinc-700 hover:text-white"
                        >
                            Log in
                        </Link>
                        {canRegister ? (
                            <Link
                                href={register()}
                                className="cursor-pointer rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground shadow-md transition hover:bg-primary/90"
                            >
                                Get Started Free
                            </Link>
                        ) : null}
                    </>
                )}
            </div>
        </header>
    );
}

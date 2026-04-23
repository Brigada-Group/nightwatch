import { footerColumns } from '@/features/landing/data/landing-content';
import type { ReactNode } from 'react';

type SocialLink = {
    name: string;
    href: string;
    icon: ReactNode;
};

const socialLinks: SocialLink[] = [
    {
        name: 'X',
        href: '#',
        icon: (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                    d="M17.53 3H20.9l-7.37 8.42L22 21h-6.64l-5.2-6.05L4.86 21H1.5l7.88-9-8.1-9H8l4.7 5.47L17.53 3Z"
                    fill="currentColor"
                />
            </svg>
        ),
    },
    {
        name: 'LinkedIn',
        href: '#',
        icon: (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                    d="M6.94 8.5H3.56V20h3.38V8.5Zm.22-3.56C7.16 3.87 6.3 3 5.25 3 4.2 3 3.34 3.87 3.34 4.94c0 1.06.86 1.94 1.91 1.94 1.05 0 1.91-.88 1.91-1.94ZM20.66 13.37c0-3.28-1.75-4.8-4.08-4.8-1.88 0-2.73 1.03-3.2 1.76V8.5H10v11.5h3.38v-6.42c0-1.69.32-3.34 2.4-3.34 2.05 0 2.08 1.92 2.08 3.45V20H21v-6.63h-.34Z"
                    fill="currentColor"
                />
            </svg>
        ),
    },
    {
        name: 'GitHub',
        href: '#',
        icon: (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                    d="M12 3a9 9 0 0 0-2.85 17.55c.45.09.62-.2.62-.44v-1.72c-2.53.55-3.06-1.1-3.06-1.1-.4-1.06-.99-1.34-.99-1.34-.81-.55.06-.54.06-.54.9.07 1.38.95 1.38.95.8 1.38 2.1.98 2.61.75.08-.59.31-.98.56-1.2-2.02-.23-4.15-1.03-4.15-4.56 0-1 .35-1.82.92-2.47-.1-.23-.4-1.15.08-2.4 0 0 .76-.25 2.48.95a8.41 8.41 0 0 1 4.5 0c1.72-1.2 2.48-.95 2.48-.95.48 1.25.18 2.17.09 2.4.57.65.92 1.47.92 2.47 0 3.54-2.14 4.33-4.18 4.56.32.28.61.83.61 1.67v2.48c0 .24.16.53.62.44A9 9 0 0 0 12 3Z"
                    fill="currentColor"
                />
            </svg>
        ),
    },
    {
        name: 'Dribbble',
        href: '#',
        icon: (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                    d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm5.9 4.14a7.44 7.44 0 0 1 1.57 4.6 19.4 19.4 0 0 0-5.4-.07 24.25 24.25 0 0 0-1.16-2.33 16.31 16.31 0 0 0 4.99-2.2Zm-1.14-1.2a14.84 14.84 0 0 1-4.57 2 37.72 37.72 0 0 0-2.2-3.45A7.43 7.43 0 0 1 16.76 5.94ZM8.18 4.99a35.4 35.4 0 0 1 2.16 3.4 31.42 31.42 0 0 1-6 .79A7.5 7.5 0 0 1 8.18 5Zm-4 5.74h.23a33 33 0 0 0 6.75-.9c.35.67.67 1.35.96 2.04-3.2.88-5.66 2.72-6.72 3.6a7.47 7.47 0 0 1-1.22-4.74Zm2.31 6.12c.88-.75 3.05-2.34 6.13-3.2a18.2 18.2 0 0 1 1.12 5.07 7.44 7.44 0 0 1-7.25-1.87Zm8.73 1.56a19.77 19.77 0 0 0-1.03-4.45c1.65-.2 3.64-.18 5.13.06a7.48 7.48 0 0 1-4.1 4.39Z"
                    fill="currentColor"
                />
            </svg>
        ),
    },
];

export function LandingFooter() {
    return (
        <footer className="bg-[#070707] px-4 pb-14 pt-8 sm:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-5xl border-t border-zinc-800 pt-8">
                <div className="grid gap-8 md:grid-cols-[1fr_auto_auto] md:items-start md:gap-16">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="h-2.5 w-2.5 rounded-full bg-violet-400 shadow-[0_0_20px_rgba(167,139,250,0.7)]" />
                            <span className="text-sm font-semibold tracking-wide text-zinc-100">NIGHTWATCH</span>
                        </div>

                        <div className="mt-4 flex flex-wrap items-center gap-2 text-zinc-500">
                            {socialLinks.map((social) => (
                                <a
                                    key={social.name}
                                    href={social.href}
                                    className="inline-flex items-center gap-1.5 rounded-full border border-zinc-800 px-2.5 py-1 text-[10px] transition hover:border-violet-300/40 hover:text-zinc-200"
                                >
                                    {social.icon}
                                    <span>{social.name}</span>
                                </a>
                            ))}
                        </div>
                    </div>

                    {footerColumns.map((column) => (
                        <div key={column.title}>
                            <h4 className="text-sm font-medium text-zinc-200">{column.title}</h4>
                            <ul className="mt-3 space-y-2">
                                {column.links.map((link) => (
                                    <li key={link} className="text-xs text-zinc-500 transition hover:text-zinc-300">
                                        {link}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                <div className="mt-8 border-t border-zinc-900 pt-4 text-center text-[10px] text-zinc-600">
                    © 2026 NIGHTWATCH. All rights reserved.
                </div>
            </div>
        </footer>
    );
}

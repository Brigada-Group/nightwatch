import { Link, usePage } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

export default function AuthSplitLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    const { name } = usePage().props;

    return (
        <div className="relative grid h-dvh flex-col items-center justify-center px-8 sm:px-0 lg:max-w-none lg:grid-cols-2 lg:px-0">
            <div className="relative hidden h-full flex-col bg-sidebar p-10 text-sidebar-foreground lg:flex dark:border-r">
                <div className="absolute inset-0 bg-sidebar" />
                <Link
                    href={home()}
                    className="relative z-20 flex items-center gap-2 text-lg font-medium"
                >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                        <AppLogoIcon className="size-5 text-primary-foreground" />
                    </div>
                    Nightwatch
                </Link>
            </div>
            <div className="w-full bg-background lg:p-8">
                <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
                    <Link
                        href={home()}
                        className="relative z-20 flex items-center justify-center gap-2 lg:hidden"
                    >
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                            <AppLogoIcon className="size-6 text-primary-foreground" />
                        </div>
                        <span className="text-lg font-bold tracking-tight">Nightwatch</span>
                    </Link>
                    <div className="flex flex-col items-start gap-2 text-left sm:items-center sm:text-center">
                        <h1 className="text-xl font-medium">{title}</h1>
                        <p className="text-sm text-balance text-muted-foreground">
                            {description}
                        </p>
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
}

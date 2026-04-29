import { AuthBrandMark } from '@/components/auth-brand-mark';
import type { AuthLayoutProps } from '@/types';

export default function AuthSplitLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    return (
        <div className="relative grid h-dvh flex-col items-center justify-center px-8 sm:px-0 lg:max-w-none lg:grid-cols-2 lg:px-0">
            <div className="relative hidden h-full flex-col bg-sidebar p-10 text-sidebar-foreground lg:flex dark:border-r">
                <div className="absolute inset-0 bg-sidebar" />
                <AuthBrandMark
                    className="relative z-20"
                    linkClassName="relative z-20 text-sidebar-foreground"
                    nameClassName="text-lg font-medium"
                />
            </div>
            <div className="w-full bg-background lg:p-8">
                <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
                    <AuthBrandMark
                        className="relative z-20 flex justify-center lg:hidden"
                        linkClassName="justify-center"
                        nameClassName="text-lg font-semibold"
                    />
                    <div className="flex flex-col items-start gap-2 text-left sm:items-center sm:text-center">
                        <h1 className="text-xl font-medium">{title}</h1>
                        <p className="text-sm text-pretty text-muted-foreground">
                            {description}
                        </p>
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
}

import type { PropsWithChildren } from 'react';
import { AuthBrandMark } from '@/components/auth-brand-mark';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';

export default function AuthCardLayout({
    children,
    title,
    description,
}: PropsWithChildren<{
    name?: string;
    title?: string;
    description?: string;
}>) {
    return (
        <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
            <div className="flex w-full max-w-md flex-col gap-6">
                <AuthBrandMark
                    className="flex justify-center"
                    linkClassName="self-center"
                    nameClassName="text-lg font-semibold"
                />

                <div className="flex flex-col gap-6">
                    <Card className="rounded-xl shadow-sm">
                        <CardHeader className="px-10 pt-8 pb-0 text-center">
                            <CardTitle className="text-xl">{title}</CardTitle>
                            <CardDescription className="text-pretty">
                                {description}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="px-10 py-8">
                            {children}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

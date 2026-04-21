import * as React from 'react';
import { cn } from '@/lib/utils';

type Props = React.ComponentProps<'main'>;

export function AppContent({ children, className, ...props }: Props) {
    return (
        <main
            className={cn(
                'relative flex min-h-svh flex-1 flex-col bg-sidebar',
                className,
            )}
            {...props}
        >
            {children}
        </main>
    );
}

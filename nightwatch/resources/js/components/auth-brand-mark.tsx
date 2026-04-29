import { Link, usePage } from '@inertiajs/react';
import { appDisplayName } from '@/lib/app-brand';
import { cn } from '@/lib/utils';
import { home } from '@/routes';

type Props = {
    className?: string;
    linkClassName?: string;
    nameClassName?: string;
    layout?: 'row' | 'stack';
};

export function AuthBrandMark({
    className,
    linkClassName,
    nameClassName,
    layout = 'row',
}: Props) {
    const name = usePage().props.name || appDisplayName;

    return (
        <div className={className}>
            <Link
                href={home()}
                className={cn(
                    'font-medium transition-opacity hover:opacity-90',
                    layout === 'stack' && 'flex flex-col items-center gap-1',
                    linkClassName,
                )}
            >
                <span
                    className={cn(
                        'truncate leading-none tracking-tight',
                        nameClassName,
                    )}
                >
                    {name}
                </span>
            </Link>
        </div>
    );
}

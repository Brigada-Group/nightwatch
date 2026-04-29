import { usePage } from '@inertiajs/react';
import { appDisplayName } from '@/lib/app-brand';

export default function AppLogo() {
    const name = usePage().props.name || appDisplayName;

    return (
        <span className="truncate text-sm font-semibold tracking-tight">
            {name}
        </span>
    );
}

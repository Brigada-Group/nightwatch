import type { ReactNode } from 'react';

type Props = {
    title: string;
    description: string;
    toolbar?: ReactNode;
};

export function ResourcePageHeader({ title, description, toolbar }: Props) {
    return (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
                <p className="text-muted-foreground text-sm">{description}</p>
            </div>
            {toolbar ? (
                <div className="flex flex-wrap items-end gap-3">{toolbar}</div>
            ) : null}
        </div>
    );
}

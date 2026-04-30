import type { ReactNode } from 'react';

export type ExceptionField = {
    label: string;
    value: ReactNode;
};

type Props = {
    fields: ExceptionField[];
};

/**
 * Two-column label/value list used by the exception detail sections.
 * Filters out fields whose value is null/undefined/empty-string so the page
 * never renders empty rows.
 */
export function ExceptionFieldList({ fields }: Props) {
    const visible = fields.filter(
        (field) =>
            field.value !== null &&
            field.value !== undefined &&
            field.value !== '',
    );

    if (visible.length === 0) {
        return null;
    }

    return (
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
            {visible.map((field) => (
                <div key={field.label} className="min-w-0">
                    <dt className="text-muted-foreground text-[11px] font-medium uppercase tracking-wider">
                        {field.label}
                    </dt>
                    <dd className="text-foreground mt-0.5 break-words">
                        {field.value}
                    </dd>
                </div>
            ))}
        </dl>
    );
}

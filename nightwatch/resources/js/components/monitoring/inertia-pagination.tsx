import { Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import type { PaginatedResponse } from '@/entities';
import { pathWithQuery } from '@/lib/inertia-query';
type Props = {
    path: string;
    meta: Pick<
        PaginatedResponse<unknown>,
        'current_page' | 'last_page' | 'total' | 'per_page'
    >;
    filters: Record<string, string | number | boolean | null | undefined>;
};

export function InertiaPagination({ path, meta, filters }: Props) {
    if (meta.last_page <= 1) {
        return (
            <p className="text-muted-foreground text-xs">
                {meta.total} {meta.total === 1 ? 'row' : 'rows'}
            </p>
        );
    }

    const prev =
        meta.current_page > 1
            ? pathWithQuery(path, {
                  ...filters,
                  page: meta.current_page - 1,
                  per_page: meta.per_page,
              })
            : null;
    const next =
        meta.current_page < meta.last_page
            ? pathWithQuery(path, {
                  ...filters,
                  page: meta.current_page + 1,
                  per_page: meta.per_page,
              })
            : null;

    return (
        <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-muted-foreground text-xs">
                Page {meta.current_page} of {meta.last_page} · {meta.total}{' '}
                total
            </p>
            <div className="flex gap-2">
                {prev ? (
                    <Button variant="outline" size="sm" asChild>
                        <Link href={prev} preserveScroll>
                            Previous
                        </Link>
                    </Button>
                ) : (
                    <Button variant="outline" size="sm" disabled>
                        Previous
                    </Button>
                )}
                {next ? (
                    <Button variant="outline" size="sm" asChild>
                        <Link href={next} preserveScroll>
                            Next
                        </Link>
                    </Button>
                ) : (
                    <Button variant="outline" size="sm" disabled>
                        Next
                    </Button>
                )}
            </div>
        </div>
    );
}

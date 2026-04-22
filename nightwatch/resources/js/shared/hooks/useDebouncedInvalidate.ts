import type { QueryClient, QueryKey } from '@tanstack/react-query';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef } from 'react';

const DEFAULT_DEBOUNCE_MS = 400;

type Timers = Map<string, ReturnType<typeof setTimeout>>;

function scheduleInvalidate(
    timers: Timers,
    client: QueryClient,
    key: QueryKey,
    delayMs: number,
) {
    const id = JSON.stringify(key);
    const existing = timers.get(id);

    if (existing) {
clearTimeout(existing);
}

    timers.set(
        id,
        setTimeout(() => {
            timers.delete(id);
            client.invalidateQueries({ queryKey: key });
        }, delayMs),
    );
}

/**
 * Returns an invalidate function that collapses rapid calls for the same
 * queryKey into a single refetch. Critical for broadcast bursts where 100+
 * events fire in under a second — without debouncing, every event triggers
 * its own refetch of expensive endpoints like /api/dashboard.
 */
export function useDebouncedInvalidate(delayMs: number = DEFAULT_DEBOUNCE_MS) {
    const queryClient = useQueryClient();
    const timersRef = useRef<Timers>(new Map());

    useEffect(() => {
        const timers = timersRef.current;

        return () => {
            for (const t of timers.values()) {
clearTimeout(t);
}

            timers.clear();
        };
    }, []);

    return useCallback(
        (key: QueryKey) => {
            scheduleInvalidate(timersRef.current, queryClient, key, delayMs);
        },
        [queryClient, delayMs],
    );
}

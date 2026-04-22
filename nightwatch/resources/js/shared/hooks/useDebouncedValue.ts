import { useEffect, useState } from 'react';

/**
 * Returns `value` after it has been stable for `delayMs`. Prevents hot input
 * state (e.g. a search field) from flooding downstream queries on every
 * keystroke.
 */
export function useDebouncedValue<T>(value: T, delayMs: number = 300): T {
    const [debounced, setDebounced] = useState(value);

    useEffect(() => {
        const handle = setTimeout(() => setDebounced(value), delayMs);

        return () => clearTimeout(handle);
    }, [value, delayMs]);

    return debounced;
}

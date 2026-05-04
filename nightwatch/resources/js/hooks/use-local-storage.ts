import { useCallback, useState } from 'react';

/**
 * Tiny typed wrapper around `localStorage` that mirrors useState. Reads
 * lazily on first render so SSR/build-time snapshotting doesn't crash.
 * Falls back to the initial value on read/parse errors so a corrupted
 * stored value can never break a page render.
 */
export function useLocalStorageState<T>(
    key: string,
    initial: T,
): [T, (next: T) => void] {
    const [value, setValue] = useState<T>(() => {
        if (typeof window === 'undefined') {
            return initial;
        }
        try {
            const raw = window.localStorage.getItem(key);
            if (raw === null) {
                return initial;
            }
            return JSON.parse(raw) as T;
        } catch {
            return initial;
        }
    });

    const set = useCallback(
        (next: T) => {
            setValue(next);
            try {
                window.localStorage.setItem(key, JSON.stringify(next));
            } catch {
                // localStorage may be disabled (private mode) or full —
                // we keep in-memory state working either way.
            }
        },
        [key],
    );

    return [value, set];
}

/**
 * Recharts Y-axis helpers for count-style series.
 *
 * Without a domain, Recharts scales the Y axis to the data max, which makes
 * the jump from 0 → 1 look identical to 0 → 1000 — a single tiny event eats
 * the whole chart. These helpers enforce a minimum top so low values render
 * proportionally small, while still leaving headroom for big spikes.
 */

const DEFAULT_MIN_TOP = 5;
const HEADROOM = 1.2;

export function countDomain(minTop: number = DEFAULT_MIN_TOP) {
    return [
        0,
        (dataMax: number) =>
            Math.max(minTop, Math.ceil((dataMax || 0) * HEADROOM)),
    ] as const;
}

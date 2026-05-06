import { router } from '@inertiajs/react';
import { useEffect } from 'react';
import type { AiFixAttemptStatus } from '../types';

/**
 * Slow-tick fallback for when the broadcast channel is unavailable. The
 * primary path is `useAiFixUpdates` (real-time websocket events); this just
 * makes sure a stuck-looking card eventually self-heals if Reverb/Echo is
 * down. Stops as soon as nothing is in flight.
 */
const POLL_INTERVAL_MS = 30_000;

export function useAiFixPolling(statuses: (AiFixAttemptStatus | null)[]) {
    const hasInFlight = statuses.some(
        (status) => status === 'queued' || status === 'running',
    );

    useEffect(() => {
        if (!hasInFlight) {
            return;
        }

        const id = window.setInterval(() => {
            router.reload({ only: ['kanban'] });
        }, POLL_INTERVAL_MS);

        return () => window.clearInterval(id);
    }, [hasInFlight]);
}

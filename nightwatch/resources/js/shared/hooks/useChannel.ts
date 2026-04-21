import { useEffect, useRef, useState } from 'react';
import { echoReady } from '@/shared/echo/client';

type EventHandler = (data: unknown) => void;

type ChannelEvents = Record<string, EventHandler>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EchoInstance = any;

export function usePrivateChannel(
    channelName: string | null,
    events: ChannelEvents,
) {
    const eventsRef = useRef(events);
    eventsRef.current = events;

    const [echoInstance, setEchoInstance] = useState<EchoInstance>(null);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        let cancelled = false;
        echoReady.then((e) => {
            if (!cancelled) setEchoInstance(e);
        });
        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        if (!channelName || !echoInstance) return;

        const channel = echoInstance.private(channelName);

        const eventNames = Object.keys(eventsRef.current);
        for (const eventName of eventNames) {
            channel.listen(eventName, (data: unknown) => {
                eventsRef.current[eventName]?.(data);
            });
        }

        return () => {
            for (const eventName of eventNames) {
                channel.stopListening(eventName);
            }
            echoInstance.leave(`private-${channelName}`);
        };
    }, [channelName, echoInstance]);
}

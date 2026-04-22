 
type EchoInstance = any;

let echo: EchoInstance = null;
let resolveEcho: ((e: EchoInstance) => void) | null = null;

const echoReady: Promise<EchoInstance> = new Promise((resolve) => {
    resolveEcho = resolve;
});

if (typeof window !== 'undefined') {
    Promise.all([import('pusher-js'), import('laravel-echo')]).then(
        ([PusherModule, EchoModule]) => {
            const Pusher = PusherModule.default;
            const EchoClass = EchoModule.default;

            // @ts-expect-error Pusher needs to be on window for Echo
            window.Pusher = Pusher;

            echo = new EchoClass({
                broadcaster: 'reverb',
                key: import.meta.env.VITE_REVERB_APP_KEY,
                wsHost: import.meta.env.VITE_REVERB_HOST,
                wsPort: import.meta.env.VITE_REVERB_PORT ?? 80,
                wssPort: import.meta.env.VITE_REVERB_PORT ?? 443,
                forceTLS:
                    (import.meta.env.VITE_REVERB_SCHEME ?? 'https') ===
                    'https',
                enabledTransports: ['ws', 'wss'],
                authorizer: (channel: { name: string }): any => ({
                    authorize: (
                        socketId: string,
                        callback: (
                            error: Error | null,
                            data: unknown,
                        ) => void,
                    ) => {
                        const match = document.cookie
                            .split('; ')
                            .find((row) => row.startsWith('XSRF-TOKEN='));
                        const token = match
                            ? decodeURIComponent(match.split('=')[1])
                            : '';

                        fetch('/broadcasting/auth', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                Accept: 'application/json',
                                'X-XSRF-TOKEN': token,
                            },
                            credentials: 'same-origin',
                            body: JSON.stringify({
                                socket_id: socketId,
                                channel_name: channel.name,
                            }),
                        })
                            .then((r) => {
                                if (!r.ok) {
throw new Error(`Auth ${r.status}`);
}

                                return r.json();
                            })
                            .then((data) => callback(null, data))
                            .catch((err: Error) => callback(err, null));
                    },
                }),
            });

            resolveEcho!(echo);
        },
    );
}

export { echo, echoReady };

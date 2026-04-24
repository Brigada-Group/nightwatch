import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

type PaddleCheckoutOpenOptions = {
    transactionId: string;
};

type PaddleInstance = {
    Initialize: (options: { token: string }) => void;
    Checkout: {
        open: (options: PaddleCheckoutOpenOptions) => void;
    };
    Environment?: {
        set: (environment: 'sandbox' | 'production') => void;
    };
};

declare global {
    interface Window {
        Paddle?: PaddleInstance;
        __nightwatchPaddleInitialized?: boolean;
    }
}

export function PaddleTransactionCheckout() {
    const hasOpenedCheckout = useRef(false);


    useEffect(() => {

        console.log('PaddleTransactionCheckout');

        if (hasOpenedCheckout.current) {
            return;
        }

        const params = new URLSearchParams(window.location.search);
        const transactionId = params.get('_ptxn');

        console.log('transactionId', transactionId);

        if (!transactionId) {
            return;
        }

        const paddle = window.Paddle;
        const clientToken = String(import.meta.env.VITE_PADDLE_CLIENT_TOKEN ?? '').trim();
        const paddleEnvironment = String(import.meta.env.VITE_PADDLE_ENV ?? 'sandbox').trim().toLowerCase();

        if (!paddle) {
            toast.error('Paddle.js not loaded. Unable to open checkout.');
            return;
        }

        if (!clientToken) {
            toast.error('Missing VITE_PADDLE_CLIENT_TOKEN. Configure it to open Paddle checkout.');
            return;
        }

        try {
            if (!window.__nightwatchPaddleInitialized) {
                if (paddleEnvironment === 'sandbox' && paddle.Environment?.set) {
                    paddle.Environment.set('sandbox');
                }

                paddle.Initialize({ token: clientToken });
                window.__nightwatchPaddleInitialized = true;
            }

            hasOpenedCheckout.current = true;
            paddle.Checkout.open({ transactionId });
        } catch (error) {
            toast.error('Failed to open Paddle checkout.');
            console.error('[Paddle Checkout] open failed', error);
        }
    }, []);

    return null;
}

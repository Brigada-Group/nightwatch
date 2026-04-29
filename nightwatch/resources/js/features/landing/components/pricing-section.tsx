import {
    pricingBillingModes,
    pricingPlans,
    pricingSectionContent,
    type PricingPlan,
} from '@/features/landing/data/landing-content';
import { PricingCard } from '@/features/landing/components/pricing-card';
import type { CheckoutErrorResponse, PaddleWindow, PricingPageProps } from '@/features/landing/types/pricing';
import type { AxiosError } from 'axios';
import { motion } from 'framer-motion';
import { usePage } from '@inertiajs/react';
import { webApi } from '@/shared/api/client';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

function PricingBadge() {
    return (
        <span className="inline-flex items-center gap-1 rounded-full border border-violet-300/30 bg-violet-500/10 px-3 py-1 text-[10px] font-medium text-violet-100">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-300" />
            {pricingSectionContent.badge}
        </span>
    );
}

export function PricingSection() {
    const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
    const paddle = useMemo(() => (window as Window & { Paddle?: PaddleWindow }).Paddle, []);
    const { auth } = usePage<PricingPageProps>().props;
    const currentSubscription = auth?.subscription ?? null;

    const resolvePriceId = (plan: PricingPlan): string => {
        if (plan.name === 'Pro Plan') {
            return String(import.meta.env.VITE_PADDLE_PRO_PRICE_ID ?? plan.priceId ?? '').trim();
        }

        if (plan.name === 'Team Plan') {
            return String(import.meta.env.VITE_PADDLE_TEAM_PRICE_ID ?? plan.priceId ?? '').trim();
        }

        return (plan.priceId ?? '').trim();
    };

    const handleCheckout = async (plan: PricingPlan) => {
        const priceId = resolvePriceId(plan);

        if (!priceId) {
            toast.info('No checkout needed for free plan.');
            return;
        }

        if (!paddle?.Checkout?.open) {
            toast.error('Paddle checkout is not available yet. Refresh and try again.');
            return;
        }

        setLoadingPlan(plan.name);

        try {
            const response = await webApi.post('/billing/subscribe-checkout', {
                price_id: priceId,
            });

            const checkoutOptions = response.data?.checkout;
            if (checkoutOptions && typeof checkoutOptions === 'object') {
                paddle.Checkout.open(checkoutOptions as Record<string, unknown>);
                return;
            }

            toast.error('Checkout options missing from server response.');
        } catch (error) {
            const axiosError = error as AxiosError<CheckoutErrorResponse>;
            const responseData = axiosError.response?.data;
            const paddleDetail = responseData?.paddle_error?.detail;
            const paddleCode = responseData?.paddle_error?.code;
            const apiMessage = paddleDetail ?? responseData?.error ?? responseData?.message;

            toast.error(
                apiMessage
                    ? `${paddleCode ? `[${paddleCode}] ` : ''}${apiMessage}`
                    : 'Failed to create checkout transaction.'
            );
        } finally {
            setLoadingPlan(null);
        }
    };

    return (
        <section className="bg-[#070707] px-4 pb-24 pt-6 sm:px-6 lg:px-8">
            <div className="landing-gradient-border mx-auto w-full max-w-5xl rounded-[30px] border border-zinc-800 bg-[#09090b] px-5 py-10 sm:px-8">
                <div className="text-center">
                    <PricingBadge />
                    <h2 className="mt-4 text-4xl font-medium tracking-tight text-zinc-100 sm:text-5xl">{pricingSectionContent.title}</h2>
                    <p className="mx-auto mt-3 max-w-lg text-xs leading-5 text-zinc-500">{pricingSectionContent.description}</p>
                </div>

                <div className="mt-5 flex justify-center">
                    <div className="inline-flex items-center rounded-full border border-zinc-700 bg-zinc-900/70 p-1">
                        {pricingBillingModes.map((mode, index) => (
                            <button
                                key={mode}
                                type="button"
                                className={`cursor-pointer rounded-full px-3 py-1 text-[11px] font-medium transition ${
                                    index === 0
                                        ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                                        : 'text-zinc-400 hover:text-zinc-200'
                                }`}
                            >
                                {mode}
                            </button>
                        ))}
                    </div>
                </div>

                <p className="mt-2 text-center text-[11px] text-zinc-500">
                    Configure <code>VITE_PADDLE_PRO_PRICE_ID</code> and <code>VITE_PADDLE_TEAM_PRICE_ID</code> in your
                    environment.
                </p>
                {currentSubscription ? (
                    <p className="mt-2 text-center text-xs text-emerald-300">
                        Current subscription: {currentSubscription.type ?? 'default'} ({currentSubscription.status ?? 'active'})
                    </p>
                ) : null}

                <div className="mt-8 grid gap-4 md:grid-cols-3">
                    {pricingPlans.map((plan, index) => (
                        <motion.div
                            key={plan.name}
                            initial={{ opacity: 0, y: 16 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, amount: 0.35 }}
                            transition={{ duration: 0.4, delay: index * 0.07, ease: 'easeOut' }}
                        >
                            <PricingCard
                                plan={plan}
                                onCheckout={handleCheckout}
                                loading={loadingPlan === plan.name}
                            />
                        </motion.div>
                    ))}
                </div>

            </div>
        </section>
    );
}

import type { PricingPlan } from '@/features/landing/data/landing-content';

type PricingCardProps = {
    plan: PricingPlan;
    onCheckout: (plan: PricingPlan) => void;
    loading: boolean;
};

export function PricingCard({ plan, onCheckout, loading }: PricingCardProps) {
    return (
        <article
            className={`landing-gradient-border rounded-2xl border p-4 transition duration-300 hover:-translate-y-1 ${
                plan.highlighted
                    ? 'border-violet-300/45 bg-gradient-to-b from-violet-500/10 to-[#0b0b0e] shadow-[0_18px_40px_rgba(124,58,237,0.22)]'
                    : 'border-zinc-800 bg-[#0a0a0c] hover:border-violet-300/35'
            }`}
        >
            <h3 className="text-lg font-semibold text-zinc-100">{plan.name}</h3>
            <p className="mt-1 min-h-[34px] text-[11px] leading-4 text-zinc-400">{plan.subtitle}</p>

            <div className="mt-4">
                <span className="text-3xl font-semibold tracking-tight text-zinc-100">{plan.price}</span>
                {plan.period ? <span className="ml-1 text-sm text-zinc-400">{plan.period}</span> : null}
            </div>

            <button
                type="button"
                onClick={() => onCheckout(plan)}
                disabled={loading}
                className={`mt-4 w-full cursor-pointer rounded-full px-4 py-2 text-xs font-semibold transition ${
                    plan.highlighted
                        ? 'bg-gradient-to-r from-violet-500 to-indigo-500 text-white hover:brightness-110'
                        : 'border border-zinc-700 bg-zinc-900 text-zinc-100 hover:border-violet-300/45 hover:bg-violet-500/10'
                } ${loading ? 'cursor-not-allowed opacity-60' : ''}`}
            >
                {loading ? 'Processing...' : plan.cta}
            </button>

            <div className="mt-5 border-t border-zinc-800 pt-4">
                <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">{plan.featuresTitle}</p>
                <ul className="mt-3 space-y-2">
                    {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2 text-xs text-zinc-300">
                            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-violet-300" />
                            <span>{feature}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </article>
    );
}

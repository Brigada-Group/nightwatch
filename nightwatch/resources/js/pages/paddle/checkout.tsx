import { Head, Link } from '@inertiajs/react';
import { PaddleTransactionCheckout } from '@/features/landing/components/paddle-transaction-checkout';

export default function PaddleCheckoutPage() {
    return (
        <>
            <Head title="Checkout" />
            <PaddleTransactionCheckout />
            <main className="min-h-screen bg-[#070707] px-4 py-14 text-zinc-100 sm:px-6 lg:px-8">
                <div className="mx-auto w-full max-w-xl rounded-2xl border border-zinc-800 bg-zinc-950/70 p-6 text-center">
                    <h1 className="text-2xl font-semibold tracking-tight">Opening secure checkout...</h1>
                    <p className="mt-2 text-sm text-zinc-400">
                        If checkout does not open automatically, return to pricing and try again.
                    </p>
                    <Link
                        href="/#pricing"
                        className="mt-6 inline-flex rounded-full border border-zinc-700 px-4 py-2 text-xs font-medium text-zinc-200 transition hover:border-violet-300/45 hover:bg-violet-500/10"
                    >
                        Back to Pricing
                    </Link>
                </div>
            </main>
        </>
    );
}

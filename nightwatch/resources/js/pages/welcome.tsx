import { Head, usePage } from '@inertiajs/react';
import { FreeTrialTrapSection } from '@/features/landing/components/free-trial-trap-section';
import { FaqSection } from '@/features/landing/components/faq-section';
import { HomeHeroSection } from '@/features/landing/components/home-hero-section';
import { HowItWorksSection } from '@/features/landing/components/how-it-works-section';
import { LandingFooter } from '@/features/landing/components/landing-footer';
import { PricingSection } from '@/features/landing/components/pricing-section';
import { SetupTimelineSection } from '@/features/landing/components/setup-timeline-section';
import { SubscriptionsTamedSection } from '@/features/landing/components/subscriptions-tamed-section';
import { TestimonialsSection } from '@/features/landing/components/testimonials-section';
import { TrustedMarqueeSection } from '@/features/landing/components/trusted-marquee-section';
import '@fontsource/inter/400.css';
import '@fontsource/inter/600.css';

export default function Welcome({
    canRegister = true,
}: {
    canRegister?: boolean;
}) {
    const { auth } = usePage().props;

    return (
        <>
            <Head title="Welcome">
            </Head>
            <main>
                <HomeHeroSection authenticated={Boolean(auth.user)} canRegister={canRegister} />
                <TrustedMarqueeSection />
                <FreeTrialTrapSection />
                <HowItWorksSection />
                <SubscriptionsTamedSection />
                <SetupTimelineSection />
                <TestimonialsSection />
                <PricingSection />
                <FaqSection />
                <LandingFooter />
            </main>
        </>
    );
}

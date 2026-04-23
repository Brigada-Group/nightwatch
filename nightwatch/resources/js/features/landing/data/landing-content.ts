export const landingNavItems = ['Features', 'How it Works', 'Pricing', 'Blog', 'Contact'];

export const dashboardStats = [
    { label: 'Active incidents', value: '20', tone: 'bg-green-500' },
    { label: 'Pending retries', value: '10', tone: 'bg-yellow-500' },
    { label: 'Requests this hour', value: '8', tone: 'bg-sky-500' },
    { label: 'Running services', value: '12', tone: 'bg-violet-500' },
];

export const dashboardSpendingBars = [18, 26, 22, 34, 46, 78, 52, 38, 28, 42];

export const trustedLogoNames = ['Logipsum', 'NovaStack', 'CoreLabs', 'Skyware', 'Aether', 'Vertex', 'Nexora', 'PulseOps'];

export const freeTrialTrapCards = [
    {
        title: 'Just trying it out',
        description: 'You hand over your card details for a trial and forget to cancel while work gets busy.',
    },
    {
        title: 'The Silent Renewal',
        description: 'No warning email, no push reminder. The trial ends quietly and billing begins.',
    },
    {
        title: 'The Money Drain',
        description: "Weeks later you realize you have paid for a service your team didn't log into once.",
    },
];

export const trialCalendarCells = Array.from({ length: 35 }, (_, day) => day);

export const trialAppRows = ['Notion', 'Spotify', 'Slack'];

export const subscriptionsTamedCards = [
    {
        title: 'Renewals caught',
        description: 'Contracts and tool renewals detected before surprise billing hits.',
        value: '124',
        trend: '+18% this month',
    },
    {
        title: 'Unused seats flagged',
        description: 'Dormant licenses surfaced so teams can clean up and reduce spend.',
        value: '39',
        trend: '-22% waste',
    },
    {
        title: 'At-risk subscriptions',
        description: 'Plans with high cost and low activity highlighted for quick action.',
        value: '12',
        trend: 'priority alerts',
    },
];

export type SetupTimelineCard =
    | {
          kind: 'text';
          title: string;
          description: string;
      }
    | {
          kind: 'visual';
          variant: 'shield' | 'dots' | 'billing';
      };

export type SetupTimelineRow = {
    step: number;
    left: SetupTimelineCard;
    right: SetupTimelineCard;
};

export const setupSectionContent = {
    title: 'Set it up in 60 seconds.',
    description: 'No manual data entry. Just connect once, and Nightwatch starts mapping hidden spend automatically.',
};

export const setupTimelineRows: SetupTimelineRow[] = [
    {
        step: 1,
        left: {
            kind: 'text',
            title: 'Bank-level connection.',
            description: 'Securely connect your billing sources and app tools with read-only access in seconds.',
        },
        right: {
            kind: 'visual',
            variant: 'shield',
        },
    },
    {
        step: 2,
        left: {
            kind: 'visual',
            variant: 'dots',
        },
        right: {
            kind: 'text',
            title: 'We find the hidden leaks.',
            description: 'Duplicate plans, silent renewals, and inactive seats are detected as soon as data flows in.',
        },
    },
    {
        step: 3,
        left: {
            kind: 'text',
            title: 'You take back control.',
            description: 'Approve actions, assign owners, and reclaim budget with one clean workflow.',
        },
        right: {
            kind: 'visual',
            variant: 'billing',
        },
    },
];

export type TestimonialCard = {
    quote: string;
    author: string;
    role: string;
};

export const testimonialsSectionContent = {
    title: 'Join 10,000+ smart users.',
    description: 'Real teams reclaim control over SaaS spending with one simple workflow.',
};

export const testimonialCards: TestimonialCard[] = [
    {
        quote: 'I did not realize we were paying for idle tools every month until Nightwatch flagged it. The one-click cleanup paid for itself in a week.',
        author: 'Spencer L.',
        role: 'Engineering Manager',
    },
    {
        quote: 'I used to keep renewals in a spreadsheet and still missed charges. Now we catch duplicate subscriptions before they hit the card.',
        author: 'Mason T.',
        role: 'Founder',
    },
    {
        quote: 'Finally a dashboard that makes spend visible in one place. We reduced tool waste and recovered budget for product work.',
        author: 'Elena R.',
        role: 'Operations Lead',
    },
];

export type PricingPlan = {
    name: string;
    subtitle: string;
    price: string;
    period: string;
    cta: string;
    priceId?: string;
    highlighted?: boolean;
    featuresTitle: string;
    features: string[];
};

export const pricingSectionContent = {
    badge: 'Our Pricing Plan',
    title: 'Get started for free',
    description: 'Choose a plan that matches your stage. Upgrade any time as your team grows.',
};

export const pricingBillingModes = ['Monthly', 'Yearly', 'Save 20%'];

export const pricingPlans: PricingPlan[] = [
    {
        name: 'Starter',
        subtitle: 'Best for getting visibility across a few subscriptions.',
        price: 'Free Plan',
        period: '',
        cta: 'Download for Windows',
        featuresTitle: 'Get started with',
        features: [
            '1,000 free events',
            'Basic alert engine',
            '5 custom dictionary values',
            '10 language translations',
            'Content optimization tools',
        ],
    },
    {
        name: 'Pro Plan',
        subtitle: 'Built for fast-moving product teams and growing ops.',
        price: '$19.99',
        period: '/month',
        cta: 'Go Pro Plan',
        priceId: 'pri_01kpww5eyymp1xc0d6cmdn6zvj',
        highlighted: true,
        featuresTitle: 'Everything in Starter',
        features: [
            'Unlimited workspaces',
            'Advanced engine',
            '800 custom dictionary values',
            'Tune with custom instructions',
            'Real-time language translation',
        ],
    },
    {
        name: 'Team Plan',
        subtitle: 'For teams that need collaboration and policy controls.',
        price: '$19.99',
        period: '/month',
        cta: 'Get Started',
        priceId: 'pri_01kpww5eyymp1xc0d6cmdn6zvj',
        featuresTitle: 'Everything in Pro',
        features: [
            'Available model controls',
            'Centralized team billing',
            'Team-wide settings',
            'Privacy mode org-wide',
            'Advanced analytics tools',
        ],
    },
];

export const faqSectionContent = {
    title: 'Frequently asked questions',
    description:
        'Everything teams ask before switching. If you need something specific, our team will answer quickly.',
    cta: 'Contact us',
};

export const faqItems = [
    {
        question: 'Is it secure to link my bank account?',
        answer:
            'Yes. Connections are read-only and encrypted in transit and at rest. Nightwatch never gets permission to move or modify funds.',
    },
    {
        question: 'How does the “Risk Score” actually work?',
        answer:
            'It combines renewal timing, seat usage, and spend volatility. Higher scores highlight subscriptions that likely need immediate review.',
    },
    {
        question: 'Do you bill by tracked users?',
        answer:
            'No. Billing is tied to your plan tier and feature limits, not per-seat overages, so costs stay predictable as your team grows.',
    },
    {
        question: 'Can I cancel any Subscription Plan anytime?',
        answer:
            'Absolutely. You can downgrade or cancel from settings with no lock-in. Your workspace remains available through the paid period.',
    },
];

export const footerColumns = [
    {
        title: 'Product',
        links: ['How it Works', 'Pricing', 'Blog', 'Roadmap'],
    },
    {
        title: 'Legal & Trust',
        links: ['Privacy Policy', 'Terms', 'Status', 'Contact Support'],
    },
];

export type HowItWorksStep = {
    id: number;
    title: string;
    description: string;
};

export const howItWorksSectionContent = {
    badge: 'How it works',
    title: 'Set up Nightwatch in minutes.',
    description: 'From package install to live monitoring with just a few guided steps.',
};

export const howItWorksSteps: HowItWorksStep[] = [
    {
        id: 1,
        title: 'Install Guardian package',
        description: 'Install the package inside your Laravel app so events can be captured and sent securely.',
    },
    {
        id: 2,
        title: 'Open Nightwatch',
        description: 'Head to the Nightwatch dashboard and sign in or create your account.',
    },
    {
        id: 3,
        title: 'Create a new project',
        description: 'Click “New Project” and register the application you want to monitor.',
    },
    {
        id: 4,
        title: 'Get project credentials',
        description: 'Copy the generated project id, url, and API token from the project details screen.',
    },
    {
        id: 5,
        title: 'Add credentials to .env',
        description: 'Paste credentials into your project .env file and deploy/restart your app.',
    },
];

export const installCommandBlock = {
    title: 'Terminal',
    lines: ['composer require brigada/guardian'],
};

export const envCommandBlock = {
    title: '.env',
    lines: [
        'GUARDIAN_ENABLED=true',
        'GUARDIAN_PROJECT_ID=your-project-id',
        'GUARDIAN_API_URL=https://nightwatch.your-domain.com/api/ingest',
        'GUARDIAN_API_TOKEN=your-project-api-token',
    ],
};

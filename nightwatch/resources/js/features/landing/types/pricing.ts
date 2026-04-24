export type CheckoutErrorResponse = {
    message?: string;
    error?: string;
    paddle_error?: {
        type?: string | null;
        code?: string | null;
        detail?: string | null;
    };
    checkout?: Record<string, unknown>;
};

export type PaddleWindow = {
    Checkout?: {
        open: (options: Record<string, unknown>) => void;
    };
};

export type BillingSubscription = {
    type?: string;
    status?: string;
    price_ids?: string[];
};

export type PricingPageProps = {
    auth?: {
        subscription?: BillingSubscription | null;
    };
};

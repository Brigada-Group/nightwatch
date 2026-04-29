import { createInertiaApp } from '@inertiajs/react';
import { configureEcho } from '@laravel/echo-react';
import type { ReactNode } from 'react';
import { AppProviders } from '@/app/providers';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { initializeTheme } from '@/hooks/use-appearance';
import AppLayout from '@/layouts/app-layout';
import AuthLayout from '@/layouts/auth-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { appDisplayName } from '@/lib/app-brand';

configureEcho({
    broadcaster: 'reverb',
});
const PlainLayout = ({ children }: { children: ReactNode }) => children;

createInertiaApp({
    title: (title) =>
        title ? `${title} — ${appDisplayName}` : appDisplayName,
    layout: (name) => {
        switch (true) {
            case name === 'welcome':
            case name === 'join/show':
            case name.startsWith('paddle/'):
                return PlainLayout;
            case name.startsWith('auth/'):
            case name === 'teams/create':
                return AuthLayout;
            case name.startsWith('settings/'):
                return [AppLayout, SettingsLayout];
            default:
                return AppLayout;
        }
    },
    strictMode: false,
    withApp(app) {
        return (
            <AppProviders>
                <TooltipProvider delayDuration={0}>
                    {app}
                    <Toaster />
                </TooltipProvider>
            </AppProviders>
        );
    },
    progress: {
        color: '#4B5563',
    },
});

// This will set light / dark mode on load...
initializeTheme();

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';

import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { initializeTheme } from '@/hooks/use-appearance';
import AppLayout from '@/layouts/app-layout';
import AuthLayout from '@/layouts/auth-layout';
import SettingsLayout from '@/layouts/settings/layout';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

window.Pusher = Pusher;

const pusherKey = (window as any).laravelConfig?.pusherKey || import.meta.env.VITE_PUSHER_APP_KEY;
const pusherCluster = (window as any).laravelConfig?.pusherCluster || import.meta.env.VITE_PUSHER_APP_CLUSTER || 'mt1';
const pusherHost = (window as any).laravelConfig?.pusherHost || import.meta.env.VITE_PUSHER_HOST;
const pusherPort = (window as any).laravelConfig?.pusherPort || import.meta.env.VITE_PUSHER_PORT;
const pusherScheme = (window as any).laravelConfig?.pusherScheme || import.meta.env.VITE_PUSHER_SCHEME || 'https';

window.Echo = new Echo({
    broadcaster: 'pusher',
    key: pusherKey,
    cluster: pusherCluster,
    wsHost: pusherHost ? pusherHost : `ws-${pusherCluster}.pusher.com`,
    wsPort: pusherPort ? parseInt(pusherPort) : 80,
    wssPort: pusherPort ? parseInt(pusherPort) : 443,
    forceTLS: pusherScheme === 'https',
    enabledTransports: ['ws', 'wss'],
});

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    title: (title) =>
        title ? `${title} - ${appName}` : appName,

    resolve: (name) =>
        resolvePageComponent(
            `./pages/${name}.tsx`,
            import.meta.glob('./pages/**/*.tsx')
        ).then((page: any) => {
            const component = page.default;

            // attach layouts here (IMPORTANT)
            const layoutProps =
                typeof component.layout === 'object' ? component.layout : {};

            component.layout = (pageElement: React.ReactNode) => {
                const props = { ...layoutProps, children: pageElement };

                switch (true) {
                    case name === 'welcome':
                        return pageElement;

                    case name.startsWith('auth/'):
                        return <AuthLayout {...props} />;

                    case name.startsWith('settings/'):
                        return (
                            <AppLayout {...props}>
                                <SettingsLayout children={pageElement} />
                            </AppLayout>
                        );

                    default:
                        return <AppLayout {...props} />;
                }
            };

            return page;
        }),

    setup({ el, App, props }) {
        createRoot(el).render(
            <TooltipProvider>
                <App {...props} />
                <Toaster />
            </TooltipProvider>
        );
    },

    progress: {
        color: '#4B5563',
    },
});

initializeTheme();
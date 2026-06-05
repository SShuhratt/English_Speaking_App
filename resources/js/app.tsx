import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';

import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { initializeTheme } from '@/hooks/use-appearance';
import AppLayout from '@/layouts/app-layout';
import AuthLayout from '@/layouts/auth-layout';
import SettingsLayout from '@/layouts/settings/layout';

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
import { useEffect, useRef, useState } from 'react';
import { router } from '@inertiajs/react';
import '@/types/telegram.d';

export function useTelegramWebApp() {
    const [isInsideTelegram, setIsInsideTelegram] = useState<boolean>(false);
    const authAttemptedRef = useRef<boolean>(false);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        const webApp = window.Telegram?.WebApp;
        const hasInitData = Boolean(webApp && webApp.initData && webApp.initData.length > 0);

        if (!webApp || !hasInitData) {
            return;
        }

        setIsInsideTelegram(true);

        // Notify Telegram that the Mini App is ready and expand to full available height
        try {
            webApp.ready();
            webApp.expand();
            webApp.enableClosingConfirmation?.();
        } catch {
            // Ignore if running outside supported client
        }

        // Synchronize dark/light theme with Telegram client
        if (webApp.colorScheme === 'dark') {
            document.documentElement.classList.add('dark');
        } else if (webApp.colorScheme === 'light') {
            document.documentElement.classList.remove('dark');
        }

        // Intercept Google Meet and external links to open via Telegram.WebApp.openLink
        // This avoids webview OAuth/audio-video permission blocks and opens native Meet app/browser
        const handleLinkClick = (event: MouseEvent) => {
            const anchor = (event.target as HTMLElement)?.closest('a');
            if (!anchor) {
                return;
            }

            const href = anchor.getAttribute('href');
            if (!href) {
                return;
            }

            const isGoogleMeet = href.includes('meet.google.com');
            const isExternalTarget = anchor.getAttribute('target') === '_blank';

            if (isGoogleMeet || (isExternalTarget && href.startsWith('http'))) {
                event.preventDefault();
                event.stopPropagation();
                webApp.openLink(href);
            }
        };

        document.addEventListener('click', handleLinkClick, true);

        // Telegram Back Button handling
        const handleBackClick = () => {
            window.history.back();
        };

        try {
            const updateBackButton = () => {
                if (!webApp.BackButton) {
                    return;
                }

                const path = window.location.pathname;
                const isRoot = path === '/' || path === '/dashboard' || path === '/tma';

                if (!isRoot && window.history.length > 1) {
                    webApp.BackButton.show?.();
                } else {
                    webApp.BackButton.hide?.();
                }
            };

            updateBackButton();
            webApp.BackButton?.onClick?.(handleBackClick);
        } catch {
            // Ignore BackButton unsupported environments
        }

        // Frictionless 1-Tap Auth / Account Linking via Telegram initData
        const sessionAuthKey = 'convomate_tma_auth_hash';
        let lastAuthedHash: string | null = null;
        try {
            lastAuthedHash = sessionStorage.getItem(sessionAuthKey);
        } catch {
            // Mobile webview private browsing may restrict storage
        }

        if (!authAttemptedRef.current && webApp.initData !== lastAuthedHash) {
            authAttemptedRef.current = true;

            const csrfToken = document
                .querySelector('meta[name="csrf-token"]')
                ?.getAttribute('content') || '';

            fetch('/telegram/auth', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': csrfToken,
                },
                body: JSON.stringify({
                    initData: webApp.initData,
                }),
            })
                .then(async (response) => {
                    if (!response.ok) {
                        return null;
                    }
                    return response.json();
                })
                .then((data) => {
                    if (!data) {
                        return;
                    }

                    try {
                        sessionStorage.setItem(sessionAuthKey, webApp.initData);
                    } catch {
                        // Ignore storage restrictions
                    }

                    const currentPath = window.location.pathname;

                    if (data.status === 'authenticated' || data.status === 'linked') {
                        if (currentPath === '/tma' || currentPath === '/login' || currentPath === '/register' || currentPath === '/') {
                            window.location.href = data.redirect || '/dashboard';
                        }
                    } else if (data.status === 'needs_onboarding' || data.status === 'needs_registration') {
                        if (currentPath !== '/tma') {
                            window.location.href = data.redirect || '/tma';
                        }
                    }
                })
                .catch(() => {
                    // Fail gracefully without blocking web navigation
                });
        }

        return () => {
            document.removeEventListener('click', handleLinkClick, true);
            try {
                webApp.BackButton?.offClick?.(handleBackClick);
            } catch {
                // Ignore cleanup error
            }
        };
    }, []);

    return {
        isInsideTelegram,
        webApp: typeof window !== 'undefined' ? window.Telegram?.WebApp : undefined,
    };
}

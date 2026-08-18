import { Link } from '@inertiajs/react';
import type { PropsWithChildren } from 'react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { cn, toUrl } from '@/lib/utils';
import { edit as editAppearance } from '@/routes/appearance';
import { edit } from '@/routes/profile';
import { edit as editSecurity } from '@/routes/security';
import type { NavItem } from '@/types';
import { useTranslation } from '@/hooks/use-translation';

import { usePage } from '@inertiajs/react';

export default function SettingsLayout({ children }: PropsWithChildren) {
    const { isCurrentOrParentUrl } = useCurrentUrl();
    const { t } = useTranslation();
    const { auth } = usePage<any>().props;

    const isTeacher = auth.user?.role === 'teacher';

    const sidebarNavItems: NavItem[] = [
        {
            title: 'Profile',
            href: edit(),
            icon: null,
        },
        {
            title: 'Security',
            href: editSecurity(),
            icon: null,
        },
        ...(isTeacher
            ? [
                  {
                      title: 'Payouts',
                      href: '#',
                      icon: null,
                  },
              ]
            : [
                  {
                      title: 'Appearance',
                      href: editAppearance(),
                      icon: null,
                  },
              ]),
    ];

    const getTranslatedTitle = (title: string) => {
        const keyMap: Record<string, string> = {
            profile: 'settings.profile',
            security: 'settings.security',
            appearance: 'settings.appearance',
            payouts: 'settings.payouts',
        };
        const key =
            keyMap[title.toLowerCase()] || `settings.${title.toLowerCase()}`;
        return t(key);
    };

    return (
        <div className="mx-auto max-w-6xl space-y-8 px-4 py-8">
            {/* Header Section */}
            <div className="relative overflow-hidden rounded-3xl bg-brand-navy p-8 text-white shadow-lg shadow-brand-navy/10">
                <div className="pointer-events-none absolute -top-20 -right-20 h-44 w-44 rounded-full bg-brand-lightblue/10 blur-xl" />
                <div className="pointer-events-none absolute -bottom-20 -left-20 h-44 w-44 rounded-full bg-brand-yellow/10 blur-xl" />

                <div className="relative z-10 space-y-1.5">
                    <span className="text-[10px] font-black tracking-widest text-brand-yellow uppercase">
                        USER SETTINGS
                    </span>
                    <h1 className="text-3xl font-black tracking-tight text-white">
                        {t('settings.title') || 'Settings'}
                    </h1>
                    <p className="text-sm font-medium text-brand-lightblue/80">
                        {t('settings.subtitle') ||
                            'Manage your account settings and preferences.'}
                    </p>
                </div>
            </div>

            {/* Horizontal Settings Sub-Navigation */}
            <div className="flex scrollbar-none gap-6 overflow-x-auto border-b border-brand-pale-blue/30 whitespace-nowrap">
                {sidebarNavItems.map((item, index) => {
                    const isActive = isCurrentOrParentUrl(item.href);
                    return (
                        <Link
                            key={`${toUrl(item.href)}-${index}`}
                            href={item.href}
                            className={cn(
                                'relative pb-4 text-sm font-bold tracking-wide transition-colors',
                                isActive
                                    ? '-mb-[2px] border-b-2 border-brand-yellow text-brand-navy'
                                    : 'text-brand-navy/50 hover:text-brand-navy',
                            )}
                        >
                            {getTranslatedTitle(item.title)}
                        </Link>
                    );
                })}
            </div>

            {/* Form Content Wrapper */}
            <div className="w-full">{children}</div>
        </div>
    );
}

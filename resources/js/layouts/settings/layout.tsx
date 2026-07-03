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
    {
        title: 'Appearance',
        href: editAppearance(),
        icon: null,
    },
];

export default function SettingsLayout({ children }: PropsWithChildren) {
    const { isCurrentOrParentUrl } = useCurrentUrl();
    const { t } = useTranslation();

    const getTranslatedTitle = (title: string) => {
        const keyMap: Record<string, string> = {
            profile: 'settings.profile',
            security: 'settings.security',
            appearance: 'settings.appearance',
        };
        const key =
            keyMap[title.toLowerCase()] || `settings.${title.toLowerCase()}`;
        return t(key);
    };

    return (
        <div className="px-4 py-8 max-w-6xl mx-auto">
            {/* Header Section */}
            <div className="mb-8">
                <h2 className="text-3xl font-extrabold tracking-tight text-brand-navy mb-2">
                    {t('settings.title') || 'Settings'}
                </h2>
                <p className="text-sm font-medium text-brand-navy/60">
                    {t('settings.subtitle') || 'Manage your professional account settings and preferences.'}
                </p>
            </div>

            {/* Horizontal Settings Sub-Navigation */}
            <div className="flex gap-6 mb-10 border-b border-brand-pale-blue/30 overflow-x-auto whitespace-nowrap scrollbar-none">
                {sidebarNavItems.map((item, index) => {
                    const isActive = isCurrentOrParentUrl(item.href);
                    return (
                        <Link
                            key={`${toUrl(item.href)}-${index}`}
                            href={item.href}
                            className={cn(
                                "pb-4 text-sm font-bold tracking-wide transition-colors relative",
                                isActive
                                    ? "text-brand-navy border-b-2 border-brand-yellow -mb-[2px]"
                                    : "text-brand-navy/50 hover:text-brand-navy"
                            )}
                        >
                            {getTranslatedTitle(item.title)}
                        </Link>
                    );
                })}
            </div>

            {/* Form Content Wrapper */}
            <div className="w-full">
                {children}
            </div>
        </div>
    );
}

import { Link } from '@inertiajs/react';
import type { PropsWithChildren } from 'react';
import { User, Shield, Palette } from 'lucide-react';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { cn, toUrl } from '@/lib/utils';
import { edit as editAppearance } from '@/routes/appearance';
import { edit } from '@/routes/profile';
import { edit as editSecurity } from '@/routes/security';
import type { NavItem } from '@/types';
import { useTranslation } from '@/hooks/use-translation';

const sidebarNavItems: NavItem[] = [
    { title: 'Profile', href: edit(), icon: User },
    { title: 'Security', href: editSecurity(), icon: Shield },
    { title: 'Appearance', href: editAppearance(), icon: Palette },
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
        const key = keyMap[title.toLowerCase()] || `settings.${title.toLowerCase()}`;
        return t(key);
    };

    return (
        <div className="min-h-screen bg-[#f8f9fc] p-4 md:p-8">
            {/* Page header */}
            <div className="mb-6 overflow-hidden rounded-2xl bg-[#061445] px-6 py-7 md:px-10">
                <p className="text-xs font-black tracking-widest text-[#fae18e] uppercase">Account</p>
                <h1 className="mt-1 text-2xl font-black text-white md:text-3xl">{t('settings.title')}</h1>
                <p className="mt-1 text-sm text-white/60">{t('settings.subtitle')}</p>
            </div>

            <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
                {/* Sidebar nav */}
                <aside className="w-full lg:w-56 lg:shrink-0">
                    <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                        <nav className="flex flex-col gap-1" aria-label="Settings">
                            {sidebarNavItems.map((item, index) => {
                                const isActive = isCurrentOrParentUrl(item.href);
                                const Icon = item.icon as React.ComponentType<{ className?: string }>;
                                return (
                                    <Link
                                        key={`${toUrl(item.href)}-${index}`}
                                        href={item.href}
                                        className={cn(
                                            'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition-all',
                                            isActive
                                                ? 'bg-[#061445] text-white'
                                                : 'text-slate-500 hover:bg-slate-100 hover:text-[#061445]',
                                        )}
                                    >
                                        {Icon && <Icon className="h-4 w-4" />}
                                        {getTranslatedTitle(item.title)}
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>
                </aside>

                {/* Main content */}
                <div className="flex-1">
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}

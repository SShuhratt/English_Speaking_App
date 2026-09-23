import { Link } from '@inertiajs/react';
import { Globe, Check } from 'lucide-react';
import AppLogoIcon from '@/components/app-logo-icon';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTranslation } from '@/hooks/use-translation';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    const { locale, setLanguage } = useTranslation();

    return (
        <div className="relative flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
            {/* Top Right Language Switcher */}
            <div className="absolute top-4 right-4 z-50 sm:top-6 sm:right-6">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button
                            type="button"
                            className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-bold text-foreground shadow-xs transition-all hover:bg-muted focus:outline-hidden"
                            aria-label="Select Language"
                        >
                            <Globe className="h-3.5 w-3.5 text-brand-navy dark:text-sky-400" />
                            <span className="font-extrabold uppercase">{locale}</span>
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        align="end"
                        className="z-[70] min-w-[140px] rounded-2xl border border-border bg-popover p-1.5 shadow-xl"
                    >
                        <DropdownMenuItem
                            onClick={() => setLanguage('en')}
                            className="flex cursor-pointer items-center justify-between rounded-xl px-3 py-1.5 text-xs font-bold"
                        >
                            <span>English (EN)</span>
                            {locale === 'en' && (
                                <Check className="h-3.5 w-3.5 text-brand-navy dark:text-sky-400" />
                            )}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => setLanguage('uz')}
                            className="flex cursor-pointer items-center justify-between rounded-xl px-3 py-1.5 text-xs font-bold"
                        >
                            <span>O'zbek (UZ)</span>
                            {locale === 'uz' && (
                                <Check className="h-3.5 w-3.5 text-brand-navy dark:text-sky-400" />
                            )}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => setLanguage('ru')}
                            className="flex cursor-pointer items-center justify-between rounded-xl px-3 py-1.5 text-xs font-bold"
                        >
                            <span>Русский (RU)</span>
                            {locale === 'ru' && (
                                <Check className="h-3.5 w-3.5 text-brand-navy dark:text-sky-400" />
                            )}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <div className="w-full max-w-sm">
                <div className="flex flex-col gap-8">
                    <div className="flex flex-col items-center gap-4">
                        <Link
                            href={home()}
                            className="flex flex-col items-center gap-2.5 font-medium"
                        >
                            <AppLogoIcon className="h-12 w-12 border-2 border-brand-navy/10 transition-transform hover:scale-105" />
                            <span className="text-xl font-black tracking-tight text-brand-navy">
                                Convo
                                <span className="text-brand-yellow">Mate</span>
                            </span>
                        </Link>

                        <div className="space-y-2 text-center">
                            <h1 className="text-xl font-medium">{title}</h1>
                            <p className="text-center text-sm text-muted-foreground">
                                {description}
                            </p>
                        </div>
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
}

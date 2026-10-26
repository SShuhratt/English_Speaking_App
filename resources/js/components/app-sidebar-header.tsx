import { Breadcrumbs } from '@/components/breadcrumbs';
import { SidebarTrigger } from '@/components/ui/sidebar';
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types';
import { useTranslation } from '@/hooks/use-translation';
import { useAppearance } from '@/hooks/use-appearance';
import { Button } from '@/components/ui/button';
import { Globe, Moon, Sun } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function AppSidebarHeader({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItemType[];
}) {
    const { locale, setLanguage, t } = useTranslation();
    const { resolvedAppearance, updateAppearance } = useAppearance();

    const toggleTheme = () => {
        updateAppearance(resolvedAppearance === 'dark' ? 'light' : 'dark');
    };

    return (
        <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between border-b border-sidebar-border/50 bg-background/95 px-6 backdrop-blur transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 supports-[backdrop-filter]:bg-background/60 md:px-4">
            <div className="flex items-center gap-2">
                <SidebarTrigger className="-ml-1" />
                <Breadcrumbs breadcrumbs={breadcrumbs} />
            </div>

            <div className="flex items-center gap-2">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleTheme}
                    className="group flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg p-0 text-muted-foreground hover:bg-accent hover:text-[#061445]"
                    title={
                        resolvedAppearance === 'dark'
                            ? t('appearance.light')
                            : t('appearance.dark')
                    }
                    aria-label={
                        resolvedAppearance === 'dark'
                            ? t('appearance.light')
                            : t('appearance.dark')
                    }
                >
                    {resolvedAppearance === 'dark' ? (
                        <Sun className="h-4 w-4 text-brand-yellow transition-all duration-200 hover:rotate-45 group-hover:text-[#061445]" />
                    ) : (
                        <Moon className="h-4 w-4 text-muted-foreground transition-all duration-200 hover:-rotate-12 group-hover:text-[#061445]" />
                    )}
                </Button>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="flex h-9 items-center gap-2 rounded-lg px-3 font-medium"
                        >
                            <Globe className="h-4 w-4 text-muted-foreground" />
                            <span className="text-xs font-semibold uppercase">
                                {locale}
                            </span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-xl">
                        <DropdownMenuItem
                            onClick={() => setLanguage('en')}
                            className="flex items-center justify-between rounded-lg"
                        >
                            <span className="text-sm">English</span>
                            {locale === 'en' && (
                                <span className="h-1.5 w-1.5 rounded-full bg-brand-brown" />
                            )}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => setLanguage('uz')}
                            className="flex items-center justify-between rounded-lg"
                        >
                            <span className="text-sm">O'zbek</span>
                            {locale === 'uz' && (
                                <span className="h-1.5 w-1.5 rounded-full bg-brand-brown" />
                            )}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => setLanguage('ru')}
                            className="flex items-center justify-between rounded-lg"
                        >
                            <span className="text-sm">Русский</span>
                            {locale === 'ru' && (
                                <span className="h-1.5 w-1.5 rounded-full bg-brand-brown" />
                            )}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}

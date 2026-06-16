import { Breadcrumbs } from '@/components/breadcrumbs';
import { SidebarTrigger } from '@/components/ui/sidebar';
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types';
import { useTranslation } from '@/hooks/use-translation';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';
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
    const { locale, setLanguage } = useTranslation();

    return (
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-sidebar-border/50 px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:px-4">
            <div className="flex items-center gap-2">
                <SidebarTrigger className="-ml-1" />
                <Breadcrumbs breadcrumbs={breadcrumbs} />
            </div>

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="rounded-lg flex items-center gap-2 font-medium h-9 px-3">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <span className="uppercase text-xs font-semibold">{locale}</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-xl">
                    <DropdownMenuItem onClick={() => setLanguage('en')} className="rounded-lg flex items-center justify-between">
                        <span className="text-sm">English</span>
                        {locale === 'en' && <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" />}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setLanguage('uz')} className="rounded-lg flex items-center justify-between">
                        <span className="text-sm">O'zbek</span>
                        {locale === 'uz' && <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" />}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setLanguage('ru')} className="rounded-lg flex items-center justify-between">
                        <span className="text-sm">Русский</span>
                        {locale === 'ru' && <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" />}
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </header>
    );
}

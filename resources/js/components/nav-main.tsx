import { Link } from '@inertiajs/react';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import type { NavItem } from '@/types';

export function NavMain({ items = [] }: { items: NavItem[] }) {
    const { isCurrentUrl } = useCurrentUrl();

    return (
        <SidebarGroup className="px-2 py-0">
            <SidebarGroupLabel className="text-slate-400 uppercase text-xs font-semibold px-2 py-1 mb-1">
                Platform
            </SidebarGroupLabel>
            <SidebarMenu className="space-y-1">
                {items.map((item) => {
                    const active = isCurrentUrl(item.href);
                    return (
                        <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton
                                asChild
                                isActive={active}
                                tooltip={{ children: item.title }}
                                className={`group/item flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm transition-colors ${
                                    active
                                        ? 'bg-white/10 text-white font-medium'
                                        : 'text-slate-300 hover:bg-white/5 hover:text-white'
                                }`}
                            >
                                <Link
                                    href={item.href}
                                    prefetch
                                    className="flex w-full items-center justify-between"
                                >
                                    <div className="flex items-center gap-3">
                                        {item.icon && (
                                            <item.icon
                                                className={`h-4 w-4 shrink-0 transition-colors ${
                                                    active
                                                        ? 'text-blue-400'
                                                        : 'text-slate-400 group-hover/item:text-blue-400 group-hover:text-blue-400'
                                                }`}
                                            />
                                        )}
                                        <span>{item.title}</span>
                                    </div>
                                    {item.badge !== undefined && item.badge > 0 && (
                                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-bold text-destructive-foreground">
                                            {item.badge}
                                        </span>
                                    )}
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    );
                })}
            </SidebarMenu>
        </SidebarGroup>
    );
}

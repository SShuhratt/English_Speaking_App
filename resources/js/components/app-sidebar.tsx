import { Link, usePage } from '@inertiajs/react';
import { BookOpen, Calendar, Clock, LayoutGrid, MessageSquare, Users, Video } from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import type { NavItem, Auth } from '@/types';

const getNavItems = (role: string): NavItem[] => {
    const baseItems: NavItem[] = [
        {
            title: 'Dashboard',
            href: '/dashboard',
            icon: LayoutGrid,
        },
    ];

    if (role === 'teacher') {
        return [
            ...baseItems,
            { title: 'My Schedule', href: '/teacher/schedule', icon: Calendar },
            { title: 'Availability', href: '/teacher/availability', icon: Clock },
            { title: 'My Sessions', href: '/teacher/sessions', icon: Video },
            { title: 'Pupil Feedback', href: '/teacher/feedback', icon: MessageSquare },
        ];
    }

    if (role === 'admin') {
        return [
            ...baseItems,
            { title: 'Users', href: '/admin/users', icon: Users },
            { title: 'All Sessions', href: '/admin/sessions', icon: Video },
        ];
    }

    // Default to pupil
    return [
        ...baseItems,
        { title: 'Find Teachers', href: '/pupil/teachers', icon: Users },
        { title: 'My Bookings', href: '/pupil/bookings', icon: Calendar },
        { title: 'Past Sessions', href: '/pupil/sessions', icon: Video },
        { title: 'My Progress', href: '/pupil/progress', icon: BookOpen },
    ];
};

export function AppSidebar() {
    const { auth } = usePage<{ auth: Auth }>().props;
    const role = (auth.user?.role as string) || 'pupil';

    const mainNavItems = getNavItems(role);

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/dashboard" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}

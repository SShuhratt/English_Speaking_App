import { Link, usePage } from '@inertiajs/react';
import {
    BookOpen,
    Calendar,
    Clock,
    LayoutGrid,
    MessageSquare,
    Users,
    Video,
    Bell,
    Mic,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { useTranslation } from '@/hooks/use-translation';
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

export function AppSidebar() {
    const { auth } = usePage<any>().props;
    const { t } = useTranslation();
    const role = (auth.user?.role as string) || 'pupil';
    const pendingCount = auth.pending_requests_count || 0;

    const baseItems: NavItem[] = [
        {
            title: t('nav.dashboard'),
            href: '/dashboard',
            icon: LayoutGrid,
        },
        {
            title: t('nav.start_speaking'),
            href: '/speaking',
            icon: Mic,
        },
    ];

    let mainNavItems: NavItem[] = [];

    if (role === 'teacher') {
        mainNavItems = [
            ...baseItems,
            {
                title: t('nav.booking_requests'),
                href: '/teacher/appointments',
                icon: Bell,
                badge: pendingCount,
            },
            {
                title: t('nav.my_schedule'),
                href: '/teacher/schedule',
                icon: Calendar,
            },
            {
                title: t('nav.availability'),
                href: '/teacher/availability',
                icon: Clock,
            },
            {
                title: t('nav.my_sessions'),
                href: '/teacher/sessions',
                icon: Video,
            },
            {
                title: t('nav.pupil_feedback'),
                href: '/teacher/feedback',
                icon: MessageSquare,
            },
        ];
    } else if (role === 'admin') {
        mainNavItems = [
            ...baseItems,
            { title: t('nav.users'), href: '/admin/users', icon: Users },
            {
                title: t('nav.all_sessions'),
                href: '/admin/sessions',
                icon: Video,
            },
        ];
    } else {
        // Default to pupil
        mainNavItems = [
            ...baseItems,
            {
                title: t('nav.find_teachers'),
                href: '/pupil/teachers',
                icon: Users,
            },
            {
                title: t('nav.my_bookings'),
                href: '/pupil/bookings',
                icon: Calendar,
            },
            {
                title: t('nav.past_sessions'),
                href: '/pupil/sessions',
                icon: Video,
            },
            {
                title: t('nav.my_progress'),
                href: '/pupil/progress',
                icon: BookOpen,
            },
        ];
    }

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

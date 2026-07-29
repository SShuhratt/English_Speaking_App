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
    CreditCard,
    HelpCircle,
    GraduationCap,
    UserCheck,
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
} from '@/components/ui/sidebar';
import type { NavItem } from '@/types';

export function AppSidebar() {
    const { auth } = usePage<any>().props;
    const { t } = useTranslation();
    const role = (auth.user?.role as string) || 'pupil';
    const pendingCount = auth.pending_requests_count || 0;
    const pendingVerificationsCount = auth.pending_verifications_count || 0;
    const unreadSupportCount = auth.unread_support_count || 0;

    const baseItems: NavItem[] = [
        {
            title: t('nav.dashboard'),
            href: role === 'admin' ? '/admin/dashboard' : '/dashboard',
            icon: LayoutGrid,
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
            {
                title: t('nav.teachers_directory') || 'Teachers Directory',
                href: '/teacher/teachers',
                icon: GraduationCap,
            },
            {
                title: 'Convomate Support',
                href: '/support',
                icon: HelpCircle,
                badge: unreadSupportCount,
            },
        ];
    } else if (role === 'admin') {
        mainNavItems = [
            {
                title: 'Payment Confirmations',
                href: '/admin/dashboard',
                icon: CreditCard,
                badge: pendingVerificationsCount,
            },
            {
                title: 'Teachers',
                href: '/admin/teachers',
                icon: GraduationCap,
            },
            {
                title: 'Pupils',
                href: '/admin/pupils',
                icon: Users,
            },
            {
                title: 'Convomate Support',
                href: '/admin/support',
                icon: HelpCircle,
                badge: unreadSupportCount,
            },
        ];
    } else {
        // Default to pupil
        mainNavItems = [
            ...baseItems,
            {
                title: t('nav.start_speaking'),
                href: '/speaking',
                icon: Mic,
            },
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
            {
                title: 'Convomate Support',
                href: '/support',
                icon: HelpCircle,
                badge: unreadSupportCount,
            },
        ];
    }

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader className="p-3 group-data-[collapsible=icon]:p-1 group-data-[collapsible=icon]:py-3">
                <Link href={role === 'admin' ? '/admin/dashboard' : '/dashboard'} prefetch className="flex items-center">
                    <AppLogo />
                </Link>
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

import { Link } from '@inertiajs/react';
import { Fragment } from 'react';
import { useTranslation } from '@/hooks/use-translation';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types';

export function Breadcrumbs({
    breadcrumbs,
}: {
    breadcrumbs: BreadcrumbItemType[];
}) {
    const { t } = useTranslation();

    const getTranslatedTitle = (title: string) => {
        const keyMap: Record<string, string> = {
            'dashboard': 'nav.dashboard',
            'find teachers': 'nav.find_teachers',
            'my bookings': 'nav.my_bookings',
            'past sessions': 'nav.past_sessions',
            'my progress': 'nav.my_progress',
            'booking requests': 'nav.booking_requests',
            'my schedule': 'nav.my_schedule',
            'availability': 'nav.availability',
            'my sessions': 'nav.my_sessions',
            'pupil feedback': 'nav.pupil_feedback',
            'profile': 'nav.profile',
            'settings': 'nav.settings'
        };

        const key = keyMap[title.toLowerCase()] || `nav.${title.toLowerCase().replace(/\s+/g, '_')}`;
        const translated = t(key);
        return translated !== key ? translated : title;
    };

    return (
        <>
            {breadcrumbs.length > 0 && (
                <Breadcrumb>
                    <BreadcrumbList>
                        {breadcrumbs.map((item, index) => {
                            const isLast = index === breadcrumbs.length - 1;
                            const displayTitle = getTranslatedTitle(item.title);

                            return (
                                <Fragment key={index}>
                                    <BreadcrumbItem>
                                        {isLast ? (
                                            <BreadcrumbPage>
                                                {displayTitle}
                                            </BreadcrumbPage>
                                        ) : (
                                            <BreadcrumbLink asChild>
                                                <Link href={item.href}>
                                                    {displayTitle}
                                                </Link>
                                            </BreadcrumbLink>
                                        )}
                                    </BreadcrumbItem>
                                    {!isLast && <BreadcrumbSeparator />}
                                </Fragment>
                            );
                        })}
                    </BreadcrumbList>
                </Breadcrumb>
            )}
        </>
    );
}

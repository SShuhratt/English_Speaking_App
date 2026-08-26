import React from 'react';
import { usePage } from '@inertiajs/react';
import { Calendar, ExternalLink } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';

interface Props {
    user?: any;
    className?: string;
}

export default function GoogleCalendarWarningBanner({ user: propUser, className = '' }: Props) {
    const pageProps = usePage<any>().props;
    const user = propUser || pageProps?.auth?.user;
    const { t } = useTranslation();

    if (!user || user.role !== 'teacher' || user.google_connected) {
        return null;
    }

    return (
        <div
            className={`flex flex-col items-center justify-between gap-4 rounded-2xl border border-rose-200 bg-rose-50/80 p-5 shadow-sm md:flex-row ${className}`}
        >
            <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
                    <Calendar className="h-5 w-5" />
                </div>
                <div>
                    <h4 className="font-bold text-rose-900">
                        {t('dashboard.google_not_connected') || 'Google Calendar Not Connected'}
                    </h4>
                    <p className="mt-0.5 text-xs text-rose-700">
                        {t('dashboard.google_not_connected_desc') ||
                            'Connect your Google account to automatically generate Google Meet links for your sessions.'}
                    </p>
                </div>
            </div>
            <a
                href="/auth/google?calendar=1"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-xs font-bold whitespace-nowrap text-white shadow-sm transition-colors hover:bg-rose-700 active:scale-95"
            >
                <span>{t('dashboard.connect_google') || 'Connect Google Calendar'}</span>
                <ExternalLink className="h-3.5 w-3.5" />
            </a>
        </div>
    );
}

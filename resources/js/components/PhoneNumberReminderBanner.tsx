import React from 'react';
import { Link } from '@inertiajs/react';
import { Phone, ArrowRight } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';

interface PhoneNumberReminderBannerProps {
    user: any;
}

export default function PhoneNumberReminderBanner({ user }: PhoneNumberReminderBannerProps) {
    const { t } = useTranslation();

    const hasPhoneNumber = Boolean(
        (user?.phone_number && String(user.phone_number).trim() !== '') ||
        (user?.teacher_profile?.phone_number && String(user.teacher_profile.phone_number).trim() !== '') ||
        (user?.pupil_profile?.phone_number && String(user.pupil_profile.phone_number).trim() !== '')
    );

    if (hasPhoneNumber) {
        return null;
    }

    return (
        <div className="relative overflow-hidden rounded-3xl border border-amber-200/90 bg-gradient-to-r from-amber-50 via-white to-orange-50/60 p-5 shadow-sm transition-all duration-200 sm:p-6 mb-6">
            <div className="pointer-events-none absolute -top-12 -right-12 h-32 w-32 rounded-full bg-amber-200/30 blur-2xl" />
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-md shadow-amber-300/50">
                        <Phone className="h-6 w-6" />
                    </div>
                    <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base font-bold text-gray-900">
                                {t('dashboard.phone_reminder_title') || 'Add Your Phone Number'}
                            </h3>
                            <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-100/90 px-2.5 py-0.5 text-xs font-bold text-amber-800">
                                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                                {t('dashboard.phone_required_badge') || 'Action Required'}
                            </span>
                        </div>
                        <p className="max-w-2xl text-xs leading-relaxed text-gray-600 sm:text-sm">
                            {t('dashboard.phone_reminder_desc') ||
                                'Please add your phone number to receive lesson reminders and important updates from your teachers or pupils.'}
                        </p>
                    </div>
                </div>

                <div className="flex shrink-0 items-center">
                    <Link
                        href="/settings/profile#phone"
                        className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-amber-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-amber-400/20 transition-all hover:bg-amber-700 hover:shadow-lg active:scale-95 sm:text-sm"
                    >
                        <Phone className="h-4 w-4" />
                        <span>{t('dashboard.add_phone_btn') || 'Add Phone Number'}</span>
                        <ArrowRight className="h-3.5 w-3.5 opacity-80" />
                    </Link>
                </div>
            </div>
        </div>
    );
}

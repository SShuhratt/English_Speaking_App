import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Link, usePage } from '@inertiajs/react';
import { useTranslation } from '@/hooks/use-translation';

interface TeacherProps {
    teacher: {
        id: string;
        full_name: string;
        avatar?: string;
        is_new?: boolean;
        next_slot?: {
            start_at: string;
            end_at: string;
        } | null;
        teacher_profile?: {
            headline?: string;
            overall_level?: string;
            speaking_band?: string | number;
            experience_years?: number;
            rating_cache?: number;
            labels?: string[];
            hourly_rate?: number;
            price?: number;
            is_verified?: boolean;
        };
    };
}

export default function TeacherCard({ teacher }: TeacherProps) {
    const { t } = useTranslation();
    const { auth } = usePage<any>().props;
    const isTeacher = auth?.user?.role === 'teacher';

    const cardHref = isTeacher
        ? `/teacher/teachers/${teacher.id}`
        : `/pupil/teachers/${teacher.id}`;

    const initials = teacher.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase();

    const labels = teacher.teacher_profile?.labels || [];

    const formatNextSlot = (nextSlot?: { start_at: string } | null) => {
        if (!nextSlot?.start_at)
            return t('teachers.no_slots') || 'Next slot: available soon';
        const start = new Date(nextSlot.start_at);
        const now = new Date();
        const todayStr = now.toDateString();

        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toDateString();

        const timeStr = start.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        });

        if (start.toDateString() === todayStr) {
            return `Next slot: today ${timeStr}`;
        } else if (start.toDateString() === tomorrowStr) {
            return `Next slot: tomorrow ${timeStr}`;
        } else {
            const dayName = start.toLocaleDateString([], {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
            });
            return `Next slot: ${dayName} ${timeStr}`;
        }
    };

    const certsArray = React.useMemo(() => {
        const raw = (teacher.teacher_profile as any)?.certificates;
        if (!raw) return [];
        try {
            return typeof raw === 'string'
                ? JSON.parse(raw)
                : Array.isArray(raw)
                  ? raw
                  : [];
        } catch (e) {
            return [];
        }
    }, [(teacher.teacher_profile as any)?.certificates]);

    const primaryCert = certsArray[0];
    const overallScore = primaryCert?.overall || primaryCert?.speaking || '';
    const certType =
        primaryCert?.type === 'other' && primaryCert?.custom_type_name
            ? primaryCert.custom_type_name
            : primaryCert?.type
              ? String(primaryCert.type).toUpperCase()
              : 'IELTS';

    const bandText =
        certsArray.length > 0 && overallScore
            ? `${certType} ${overallScore} verified`
            : certsArray.length > 0 && teacher.teacher_profile?.overall_level
              ? `${teacher.teacher_profile.overall_level} verified`
              : 'Verified Tutor';

    const headlineText =
        teacher.teacher_profile?.headline ||
        'Speaking confidence · new on ConvoMate';

    return (
        <Link
            href={cardHref}
            className="group flex h-full flex-col justify-between rounded-3xl border border-[#E6E9F2] bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#1E2A5A]/30 hover:shadow-lg"
        >
            <div>
                {/* Header Profile Section */}
                <div className="flex items-center gap-3.5">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#F7DE8B] text-sm font-bold text-[#1E2A5A] shadow-sm transition-transform duration-300 group-hover:scale-105">
                        {teacher.avatar ? (
                            <img
                                src={teacher.avatar}
                                className="h-full w-full object-cover"
                                alt="avatar"
                            />
                        ) : (
                            initials
                        )}
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-[#1E2A5A] transition-colors group-hover:text-[#061445]">
                            {teacher.full_name}
                        </h3>
                        <div className="mt-0.5 flex items-center gap-1 text-xs font-semibold text-[#1D9E75]">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>{bandText}</span>
                        </div>
                    </div>
                </div>

                {/* Subtitle / Headline */}
                <p className="mt-3.5 text-xs font-medium text-muted-foreground">
                    {headlineText}
                </p>

                {/* Tags / Labels */}
                <div className="mt-3 flex flex-wrap gap-1.5">
                    {teacher.teacher_profile?.is_verified && (
                        <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-bold text-emerald-800">
                            Verified Teacher
                        </span>
                    )}
                    {teacher.is_new && (
                        <span className="inline-flex items-center rounded-full bg-[#D0E4FF] px-3 py-1 text-[11px] font-bold text-[#1E2A5A]">
                            New Teacher
                        </span>
                    )}
                    <span className="inline-flex items-center rounded-full bg-[#F7DE8B] px-3 py-1 text-[11px] font-bold text-[#1E2A5A]">
                        {t('teachers.freestyle_talk')}
                    </span>
                    {labels.slice(0, 2).map((label) => {
                        const cleanKey = label.toLowerCase().trim();
                        const labelText = t(`labels.${cleanKey}`);
                        return (
                            <span
                                key={label}
                                className="inline-flex items-center rounded-full bg-secondary/80 px-2.5 py-1 text-[11px] font-semibold text-muted-foreground"
                            >
                                {labelText}
                            </span>
                        );
                    })}
                </div>
            </div>

            {/* Divider & Footer */}
            <div className="mt-5 border-t border-[#E6E9F2] pt-4">
                <div className="flex items-end justify-between">
                    <div>
                        <div className="text-sm font-extrabold text-[#1E2A5A]">
                            {teacher.teacher_profile?.price
                                ? `${Number(teacher.teacher_profile.price).toLocaleString('ru-RU').replace(/,/g, ' ')} so'm`
                                : "0 so'm"}{' '}
                            <span className="text-xs font-normal text-muted-foreground">
                                / hour
                            </span>
                        </div>
                        <div className="mt-0.5 text-xs font-semibold text-[#1D9E75]">
                            {formatNextSlot(teacher.next_slot)}
                        </div>
                    </div>

                    <div className="inline-flex items-center justify-center rounded-full bg-[#1E2A5A] px-5 py-2 text-xs font-bold text-white shadow-sm transition-transform duration-200 group-hover:scale-105 group-hover:bg-[#061445]">
                        {isTeacher
                            ? t('teachers.view') || 'View'
                            : t('teachers.book') || 'Book'}
                    </div>
                </div>
            </div>
        </Link>
    );
}

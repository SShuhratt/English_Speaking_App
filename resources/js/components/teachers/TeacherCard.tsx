import React from 'react';
import { Star, Clock, ChevronRight } from 'lucide-react';
import { Link } from '@inertiajs/react';
import { useTranslation } from '@/hooks/use-translation';

interface TeacherProps {
    teacher: {
        id: string;
        full_name: string;
        teacher_profile?: {
            overall_level: string;
            speaking_band?: string | number;
            experience_years: number;
            rating_cache: number;
        };
    };
}

export default function TeacherCard({ teacher }: TeacherProps) {
    const { t } = useTranslation();
    const initials = teacher.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase();

    return (
        <div className="group rounded-2xl border border-border bg-card p-6 transition-all hover:border-indigo-500/30 hover:shadow-lg">
            <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-lg font-bold text-white shadow-lg shrink-0">
                    {initials}
                </div>
                <div>
                    <h3 className="font-semibold text-foreground">{teacher.full_name}</h3>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-700/10 dark:bg-indigo-950/40 dark:text-indigo-400">
                            {teacher.teacher_profile?.overall_level || t('teachers.certified')}
                        </span>
                        {teacher.teacher_profile?.speaking_band && (
                            <span className="inline-flex items-center rounded-md bg-purple-50 px-2 py-1 text-xs font-semibold text-purple-700 ring-1 ring-inset ring-purple-700/10 dark:bg-purple-950/40 dark:text-purple-400">
                                {t('teachers.speaking', { band: teacher.teacher_profile.speaking_band })}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div className="mt-5 flex items-center justify-between border-t border-border pt-5 text-sm">
                <div className="flex items-center gap-1.5">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    <span className="font-semibold">{teacher.teacher_profile?.rating_cache || '5.0'}</span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{t('teachers.years_experience', { count: teacher.teacher_profile?.experience_years || 0 })}</span>
                </div>
            </div>

            <Link
                href={`/pupil/booking?teacher_id=${teacher.id}`}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white transition-all hover:bg-indigo-700"
            >
                {t('teachers.book_session')} <ChevronRight className="h-4 w-4" />
            </Link>
        </div>
    );
}

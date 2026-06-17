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
            labels?: string[];
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

    const labels = teacher.teacher_profile?.labels || [];

    return (
        <div className="group rounded-3xl border border-border bg-card p-6 transition-all duration-300 hover:border-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1 flex flex-col justify-between h-full">
            <div>
                {/* Header Profile Section */}
                <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-indigo-600 text-lg font-bold text-white shadow-lg shadow-indigo-500/10 shrink-0 group-hover:scale-105 transition-transform duration-300">
                        {initials}
                    </div>
                    <div>
                        <h3 className="font-bold text-foreground text-base group-hover:text-indigo-500 transition-colors">{teacher.full_name}</h3>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                            <span className="inline-flex items-center rounded-lg bg-indigo-50/50 dark:bg-indigo-950/30 px-2 py-0.5 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 border border-indigo-150/20">
                                {teacher.teacher_profile?.overall_level || t('teachers.certified')}
                            </span>
                            {teacher.teacher_profile?.speaking_band && (
                                <span className="inline-flex items-center rounded-lg bg-purple-50/50 dark:bg-purple-950/30 px-2 py-0.5 text-[10px] font-bold text-purple-600 dark:text-purple-400 border border-purple-150/20">
                                    {t('teachers.speaking', { band: teacher.teacher_profile.speaking_band })}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Translatable Labels Section */}
                {labels.length > 0 && (
                    <div className="mt-5 flex flex-wrap gap-1.5">
                        {labels.map((label) => (
                            <span 
                                key={label}
                                className="inline-flex items-center rounded-lg bg-secondary/50 dark:bg-accent/40 px-2.5 py-1 text-[11px] font-semibold text-muted-foreground border border-border/40"
                            >
                                {t(`labels.${label}`)}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            <div>
                {/* Stats Section */}
                <div className="mt-6 flex items-center justify-between border-t border-border/60 pt-4 text-xs font-semibold">
                    <div className="flex items-center gap-1.5">
                        <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                        <span className="text-foreground">{teacher.teacher_profile?.rating_cache || '5.0'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{t('teachers.years_experience', { count: teacher.teacher_profile?.experience_years || 0 })}</span>
                    </div>
                </div>

                {/* View Profile Button */}
                <Link
                    href={`/pupil/teachers/${teacher.id}`}
                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-3 text-xs font-bold text-white shadow-md shadow-indigo-500/10 hover:shadow-lg hover:shadow-indigo-500/20 hover:bg-indigo-700 transition-all duration-300 cursor-pointer"
                >
                    {t('teachers.view_profile')} <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
            </div>
        </div>
    );
}

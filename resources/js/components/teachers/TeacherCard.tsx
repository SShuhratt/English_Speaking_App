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
        <div className="group flex h-full flex-col justify-between rounded-3xl border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-brand-brown/30 hover:shadow-xl hover:shadow-brand-brown/5">
            <div>
                {/* Header Profile Section */}
                <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-brown text-lg font-bold text-white shadow-lg shadow-brand-brown/10 transition-transform duration-300 group-hover:scale-105">
                        {initials}
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-foreground transition-colors group-hover:text-brand-brown">
                            {teacher.full_name}
                        </h3>
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                            <span className="inline-flex items-center rounded-lg border border-brand-brown/20 bg-brand-lightblue px-2 py-0.5 text-[10px] font-bold text-brand-brown">
                                {teacher.teacher_profile?.overall_level ||
                                    t('teachers.certified')}
                            </span>
                            {teacher.teacher_profile?.speaking_band && (
                                <span className="inline-flex items-center rounded-lg border border-brand-orange/20 bg-brand-yellow/50 px-2 py-0.5 text-[10px] font-bold text-brand-orange">
                                    {t('teachers.speaking', {
                                        band: teacher.teacher_profile
                                            .speaking_band,
                                    })}
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
                                className="inline-flex items-center rounded-lg border border-border/40 bg-secondary/50 px-2.5 py-1 text-[11px] font-semibold text-muted-foreground"
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
                        <span className="text-foreground">
                            {teacher.teacher_profile?.rating_cache || '5.0'}
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        <span>
                            {t('teachers.years_experience', {
                                count:
                                    teacher.teacher_profile?.experience_years ||
                                    0,
                            })}
                        </span>
                    </div>
                </div>

                {/* View Profile Button */}
                <Link
                    href={`/pupil/teachers/${teacher.id}`}
                    className="mt-5 flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-brand-button hover:bg-brand-button-hover py-3 text-xs font-bold text-brand-brown shadow-md shadow-brand-button/10 transition-all duration-300 hover:shadow-lg"
                >
                    {t('teachers.view_profile')}{' '}
                    <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
            </div>
        </div>
    );
}

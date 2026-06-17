import React from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import { useTranslation } from '@/hooks/use-translation';
import { Star, Clock, User, Calendar, Award, Briefcase, ChevronRight, MessageCircle } from 'lucide-react';

interface Feedback {
    id: string;
    rating: number;
    comment: string;
    created_at: string;
    author?: {
        full_name: string;
    };
}

interface Teacher {
    id: string;
    full_name: string;
    teacher_profile?: {
        overall_level: string;
        speaking_band?: string | number;
        experience_years: number;
        workplace?: string;
        age?: number;
        certificates?: string[];
        rating_cache: number;
        labels?: string[];
    };
    feedbacks?: Feedback[];
}

interface Props {
    teacher: Teacher;
}

export default function TeacherProfile({ teacher }: Props) {
    const { t } = useTranslation();

    const initials = teacher.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase();

    const experience = teacher.teacher_profile?.experience_years || 0;
    const rating = teacher.teacher_profile?.rating_cache || 5.0;

    return (
        <AppLayout breadcrumbs={[
            { title: t('teachers.browse'), href: '/pupil/teachers' },
            { title: teacher.full_name, href: `/pupil/teachers/${teacher.id}` }
        ]}>
            <Head title={`${teacher.full_name} - ${t('teachers.profile_title')}`} />

            <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8">
                {/* ── Top Header Card ── */}
                <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-6 md:p-8 shadow-sm transition-all duration-350">
                    {/* Background decorative gradient */}
                    <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
                    <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />

                    <div className="flex flex-col md:flex-row items-center md:items-start gap-8 relative z-10">
                        {/* Avatar */}
                        <div className="flex h-24 w-24 md:h-28 md:w-28 items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-500 via-purple-500 to-indigo-600 text-3xl font-black text-white shadow-xl shadow-indigo-500/20 shrink-0">
                            {initials}
                        </div>

                        {/* Details */}
                        <div className="flex-1 text-center md:text-left space-y-4">
                            <div>
                                <h1 className="text-3xl font-black tracking-tight text-foreground">{teacher.full_name}</h1>
                                
                                <div className="flex flex-wrap justify-center md:justify-start items-center gap-1.5 mt-2.5">
                                    <span className="inline-flex items-center rounded-lg bg-indigo-50/50 dark:bg-indigo-950/30 px-2.5 py-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 border border-indigo-150/20">
                                        {teacher.teacher_profile?.overall_level || t('teachers.certified')}
                                    </span>
                                    {teacher.teacher_profile?.speaking_band && (
                                        <span className="inline-flex items-center rounded-lg bg-purple-50/50 dark:bg-purple-950/30 px-2.5 py-1 text-[11px] font-bold text-purple-600 dark:text-purple-400 border border-purple-150/20">
                                            {t('teachers.speaking', { band: teacher.teacher_profile.speaking_band })}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center justify-center md:justify-start gap-6 pt-4 border-t border-dashed border-border/80">
                                <div className="flex items-center gap-2">
                                    <Star className="h-5 w-5 fill-amber-500 text-amber-500" />
                                    <span className="font-bold text-foreground text-lg">{rating.toFixed(1)}</span>
                                    <span className="text-muted-foreground text-xs font-semibold">/ 5.0 rating</span>
                                </div>
                                <div className="h-4 w-px bg-border" />
                                <div className="flex items-center gap-2">
                                    <Clock className="h-5 w-5 text-indigo-500" />
                                    <span className="font-bold text-foreground text-sm">{t('teachers.years_experience', { count: experience })}</span>
                                </div>
                            </div>
                        </div>

                        {/* CTA Book Now */}
                        <div className="w-full md:w-auto self-stretch md:self-center shrink-0">
                            <Link
                                href={`/pupil/booking?teacher_id=${teacher.id}`}
                                className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 px-8 py-4 text-base font-bold text-white transition-all shadow-lg shadow-indigo-500/20 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                            >
                                {t('teachers.book_now')} <ChevronRight className="h-5 w-5" />
                            </Link>
                        </div>
                    </div>
                </div>

                {/* ── Details Grid ── */}
                <div className="grid gap-8 md:grid-cols-3">
                    {/* Left Column: About & Focus */}
                    <div className="space-y-6">
                        {/* Teaching Focus Labels */}
                        {teacher.teacher_profile?.labels && teacher.teacher_profile.labels.length > 0 && (
                            <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
                                <h2 className="text-base font-bold mb-4 flex items-center gap-2 border-b border-border/60 pb-3">
                                    <Award className="h-4.5 w-4.5 text-indigo-500" />
                                    {t('labels.title') || 'Teaching Focus'}
                                </h2>
                                <div className="flex flex-wrap gap-2">
                                    {teacher.teacher_profile.labels.map((lbl) => (
                                        <span 
                                            key={lbl} 
                                            className="inline-flex items-center rounded-xl bg-indigo-500/5 px-3 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 border border-indigo-500/10"
                                        >
                                            {t(`labels.${lbl}`)}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Profile Details */}
                        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
                            <h2 className="text-base font-bold mb-4 flex items-center gap-2 border-b border-border/60 pb-3">
                                <User className="h-4.5 w-4.5 text-indigo-500" />
                                {t('settings.profile')}
                            </h2>

                            <div className="space-y-4 text-sm font-semibold">
                                {teacher.teacher_profile?.workplace && (
                                    <div className="flex flex-col gap-1">
                                        <span className="text-muted-foreground text-[10px] uppercase tracking-wider font-bold">{t('teachers.workplace')}</span>
                                        <span className="text-foreground flex items-center gap-2 mt-0.5">
                                            <Briefcase className="h-4 w-4 text-indigo-500/80 shrink-0" />
                                            {teacher.teacher_profile.workplace}
                                        </span>
                                    </div>
                                )}
                                {teacher.teacher_profile?.age && (
                                    <div className="flex flex-col gap-1">
                                        <span className="text-muted-foreground text-[10px] uppercase tracking-wider font-bold">{t('teachers.age')}</span>
                                        <span className="text-foreground flex items-center gap-2 mt-0.5">
                                            <Calendar className="h-4 w-4 text-indigo-500/80 shrink-0" />
                                            {teacher.teacher_profile.age} years old
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Certificates */}
                        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
                            <h2 className="text-base font-bold mb-4 flex items-center gap-2 border-b border-border/60 pb-3">
                                <Award className="h-4.5 w-4.5 text-indigo-500" />
                                {t('teachers.certificates')}
                            </h2>

                            {teacher.teacher_profile?.certificates && teacher.teacher_profile.certificates.length > 0 ? (
                                <ul className="space-y-2 text-xs font-semibold">
                                    {teacher.teacher_profile.certificates.map((cert, index) => (
                                        <li key={index} className="flex items-center gap-2.5 p-3 rounded-2xl bg-muted/30 border border-border/50 text-foreground">
                                            <Award className="h-4 w-4 text-amber-500 shrink-0" />
                                            <span className="truncate">{cert}</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-xs font-medium text-muted-foreground">{t('teachers.no_certificates')}</p>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Feedback List */}
                    <div className="md:col-span-2 space-y-6">
                        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
                            <h2 className="text-base font-bold mb-6 flex items-center gap-2 border-b border-border/60 pb-4">
                                <MessageCircle className="h-5 w-5 text-indigo-500" />
                                {t('teachers.feedback_title')}
                            </h2>

                            {teacher.feedbacks && teacher.feedbacks.length > 0 ? (
                                <div className="space-y-4">
                                    {teacher.feedbacks.map((fb) => (
                                        <div key={fb.id} className="rounded-2xl border border-border/65 bg-card p-5 transition-shadow duration-300 hover:shadow-md">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 text-indigo-600 dark:text-indigo-400 flex justify-center items-center font-bold text-xs">
                                                        {fb.author?.full_name?.substring(0, 2).toUpperCase() || 'P'}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-sm text-foreground">{fb.author?.full_name || 'Pupil'}</h4>
                                                        <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">
                                                            {new Date(fb.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1 bg-amber-500/5 text-amber-600 px-2.5 py-1 rounded-lg text-xs font-bold border border-amber-500/10">
                                                    <Star className="h-3 w-3 fill-amber-500 text-amber-500" /> {fb.rating}/10
                                                </div>
                                            </div>
                                            <p className="text-sm text-muted-foreground leading-relaxed italic font-medium">
                                                "{fb.comment}"
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 border border-dashed rounded-3xl bg-muted/10">
                                    <p className="text-muted-foreground text-sm font-medium">{t('teachers.no_feedback')}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

import React from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import { useTranslation } from '@/hooks/use-translation';
import { Star, Clock, User, Calendar, Award, Briefcase, ChevronRight } from 'lucide-react';

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

            <div className="p-6 md:p-8 max-w-5xl mx-auto">
                {/* ── Top Header Card ── */}
                <div className="relative overflow-hidden rounded-3xl border bg-card p-6 md:p-8 shadow-md transition-all mb-8">
                    {/* Background decorative gradient */}
                    <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
                    <div className="absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />

                    <div className="flex flex-col md:flex-row items-center md:items-start gap-6 relative z-10">
                        {/* Avatar */}
                        <div className="flex h-24 w-24 md:h-28 md:w-28 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 text-3xl font-extrabold text-white shadow-xl shadow-indigo-500/20 shrink-0">
                            {initials}
                        </div>

                        {/* Details */}
                        <div className="flex-1 text-center md:text-left">
                            <h1 className="text-3xl font-bold tracking-tight text-foreground">{teacher.full_name}</h1>
                            
                            <div className="flex flex-wrap justify-center md:justify-start items-center gap-2 mt-3">
                                <span className="inline-flex items-center rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-700/10 dark:bg-indigo-950/40 dark:text-indigo-400">
                                    {teacher.teacher_profile?.overall_level || t('teachers.certified')}
                                </span>
                                {teacher.teacher_profile?.speaking_band && (
                                    <span className="inline-flex items-center rounded-md bg-purple-50 px-2.5 py-1 text-xs font-semibold text-purple-700 ring-1 ring-inset ring-purple-700/10 dark:bg-purple-950/40 dark:text-purple-400">
                                        {t('teachers.speaking', { band: teacher.teacher_profile.speaking_band })}
                                    </span>
                                )}
                                {teacher.teacher_profile?.labels && teacher.teacher_profile.labels.map((lbl) => (
                                    <span key={lbl} className="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-800 dark:text-slate-200 border dark:border-slate-700">
                                        {t(`labels.${lbl}`)}
                                    </span>
                                ))}
                            </div>

                            <div className="flex items-center justify-center md:justify-start gap-6 mt-5 text-sm text-muted-foreground border-t pt-4 border-dashed">
                                <div className="flex items-center gap-1.5">
                                    <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                                    <span className="font-bold text-foreground text-base">{rating.toFixed(1)}</span>
                                    <span>/ 5.0</span>
                                </div>
                                <div className="h-4 w-px bg-muted-foreground/30" />
                                <div className="flex items-center gap-1.5">
                                    <Clock className="h-5 w-5 text-indigo-500" />
                                    <span className="font-semibold text-foreground">{t('teachers.years_experience', { count: experience })}</span>
                                </div>
                            </div>
                        </div>

                        {/* CTA Button Box */}
                        <div className="w-full md:w-auto self-stretch md:self-center shrink-0">
                            <Link
                                href={`/pupil/booking?teacher_id=${teacher.id}`}
                                className="flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 px-8 py-4 text-base font-bold text-white transition-all shadow-lg shadow-indigo-500/20 hover:scale-[1.02] active:scale-[0.98]"
                            >
                                {t('teachers.book_now')} <ChevronRight className="h-5 w-5" />
                            </Link>
                        </div>
                    </div>
                </div>

                {/* ── Details Grid ── */}
                <div className="grid gap-8 md:grid-cols-3">
                    {/* Left Panel: Profile Details */}
                    <div className="space-y-6">
                        <div className="rounded-2xl border bg-card p-6 shadow-sm">
                            <h2 className="text-lg font-bold mb-4 border-b pb-2 flex items-center gap-2">
                                <User className="h-4 w-4 text-indigo-500" />
                                {t('settings.profile')}
                            </h2>

                            <div className="space-y-4 text-sm">
                                {teacher.teacher_profile?.workplace && (
                                    <div className="flex flex-col gap-1">
                                        <span className="text-muted-foreground text-xs">{t('teachers.workplace')}</span>
                                        <span className="font-semibold text-foreground flex items-center gap-2 mt-0.5">
                                            <Briefcase className="h-4 w-4 text-muted-foreground shrink-0" />
                                            {teacher.teacher_profile.workplace}
                                        </span>
                                    </div>
                                )}
                                {teacher.teacher_profile?.age && (
                                    <div className="flex flex-col gap-1">
                                        <span className="text-muted-foreground text-xs">{t('teachers.age')}</span>
                                        <span className="font-semibold text-foreground flex items-center gap-2 mt-0.5">
                                            <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                                            {teacher.teacher_profile.age}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Certificates */}
                        <div className="rounded-2xl border bg-card p-6 shadow-sm">
                            <h2 className="text-lg font-bold mb-4 border-b pb-2 flex items-center gap-2">
                                <Award className="h-4 w-4 text-indigo-500" />
                                {t('teachers.certificates')}
                            </h2>

                            {teacher.teacher_profile?.certificates && teacher.teacher_profile.certificates.length > 0 ? (
                                <ul className="space-y-2 text-sm">
                                    {teacher.teacher_profile.certificates.map((cert, index) => (
                                        <li key={index} className="flex items-center gap-2 p-2 rounded-xl bg-muted/40 border text-foreground font-medium">
                                            <Award className="h-4 w-4 text-amber-500 shrink-0" />
                                            <span className="truncate">{cert}</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-muted-foreground">{t('teachers.no_certificates')}</p>
                            )}
                        </div>
                    </div>

                    {/* Right Panel: Feedbacks */}
                    <div className="md:col-span-2 space-y-6">
                        <div className="rounded-2xl border bg-card p-6 shadow-sm">
                            <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                                <Star className="h-5 w-5 fill-indigo-500 text-indigo-500" />
                                {t('teachers.feedback_title')}
                            </h2>

                            {teacher.feedbacks && teacher.feedbacks.length > 0 ? (
                                <div className="space-y-4">
                                    {teacher.feedbacks.map((fb) => (
                                        <div key={fb.id} className="rounded-2xl border bg-card p-5 shadow-sm hover:shadow-md transition-shadow">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-200 text-indigo-700 dark:from-indigo-900/50 dark:to-indigo-800/50 dark:text-indigo-300 flex justify-center items-center font-bold text-xs">
                                                        {fb.author?.full_name?.substring(0, 2).toUpperCase() || 'P'}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-semibold text-sm">{fb.author?.full_name || 'Pupil'}</h4>
                                                        <p className="text-[10px] text-muted-foreground">
                                                            {new Date(fb.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 px-2 py-0.5 rounded-full text-xs font-semibold">
                                                    <Star className="h-3 w-3 fill-amber-500 text-amber-500" /> {fb.rating}/10
                                                </div>
                                            </div>
                                            <p className="text-sm text-muted-foreground leading-relaxed italic">
                                                "{fb.comment}"
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 border rounded-2xl bg-muted/10 border-dashed">
                                    <p className="text-muted-foreground text-sm">{t('teachers.no_feedback')}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

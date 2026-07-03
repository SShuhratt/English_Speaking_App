import React from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { TrendingUp, Award, BookOpen, Clock, Sparkles } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';

interface Props {
    progress: {
        total_sessions: number;
        completed_sessions: number;
        learning_path: string;
        average_rating: number;
    };
}

export default function Progress({ progress }: Props) {
    const { t } = useTranslation();

    const percent =
        progress.total_sessions > 0
            ? Math.round(
                  (progress.completed_sessions / progress.total_sessions) * 100,
              )
            : 0;

    return (
        <>
            <Head title={t('progress.title')} />
            <div className="mx-auto max-w-5xl space-y-8 p-6 md:p-8">
                {/* Header Section */}
                <div className="flex flex-col justify-between gap-4 rounded-3xl border border-brand-brown/10 bg-gradient-to-r from-brand-yellow/30 to-transparent p-6 md:flex-row md:items-center">
                    <div className="space-y-1">
                        <h1 className="text-brand-brown text-3xl font-black tracking-tight">
                            {t('progress.title')}
                        </h1>
                        <p className="text-sm font-medium text-muted-foreground">
                            {t('progress.desc')}
                        </p>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    {/* Path Card */}
                    <div className="group rounded-3xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:border-brand-brown/30 hover:shadow-md">
                        <div className="mb-4 flex items-center gap-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-lightblue text-brand-brown">
                                <BookOpen className="h-5 w-5" />
                            </div>
                            <span className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                                {t('progress.path')}
                            </span>
                        </div>
                        <h4 className="truncate text-lg font-bold text-foreground">
                            {t(progress.learning_path) || progress.learning_path}
                        </h4>
                    </div>

                    {/* Sessions Card */}
                    <div className="group rounded-3xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:border-brand-yellow/50 hover:shadow-md">
                        <div className="mb-4 flex items-center gap-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-yellow/30 text-brand-orange">
                                <Clock className="h-5 w-5" />
                            </div>
                            <span className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                                {t('progress.sessions')}
                            </span>
                        </div>
                        <h4 className="text-xl font-black text-foreground">
                            {progress.completed_sessions}{' '}
                            <span className="text-xs font-bold text-muted-foreground">
                                {t('progress.lessons_count', { count: progress.total_sessions })}
                            </span>
                        </h4>
                    </div>

                    {/* Rating Card */}
                    <div className="group rounded-3xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:border-emerald-500/30 hover:shadow-md hover:shadow-emerald-500/5">
                        <div className="mb-4 flex items-center gap-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600">
                                <TrendingUp className="h-5 w-5" />
                            </div>
                            <span className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                                {t('progress.rating')}
                            </span>
                        </div>
                        <h4 className="text-xl font-black text-foreground">
                            {progress.average_rating}{' '}
                            <span className="text-xs font-bold text-muted-foreground">
                                {t('progress.rating_count')}
                            </span>
                        </h4>
                    </div>

                    {/* Certificates Card */}
                    <div className="group rounded-3xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:border-amber-500/30 hover:shadow-md hover:shadow-amber-500/5">
                        <div className="mb-4 flex items-center gap-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600">
                                <Award className="h-5 w-5" />
                            </div>
                            <span className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                                {t('progress.certificates')}
                            </span>
                        </div>
                        <h4 className="text-xl font-black text-foreground">
                            {t('progress.earned', { count: 0 })}
                        </h4>
                    </div>
                </div>

                {/* Progress bar visual container */}
                {progress.total_sessions > 0 && (
                    <div className="rounded-3xl border border-border bg-card p-6 shadow-sm md:p-8">
                        <div className="mb-4 flex items-center justify-between">
                            <span className="text-sm font-bold text-foreground">
                                {t('progress.completion_title')}
                            </span>
                             <span className="text-sm font-bold text-brand-brown">
                                {percent}%
                            </span>
                        </div>
                        <div className="h-3 w-full overflow-hidden rounded-full border border-border/30 bg-secondary">
                            <div
                                 className="h-full rounded-full bg-brand-brown transition-all duration-500"
                                style={{ width: `${percent}%` }}
                            />
                        </div>
                        <p className="mt-3 text-xs font-semibold text-muted-foreground">
                            {t('progress.completion_desc', { completed: progress.completed_sessions, total: progress.total_sessions })}
                        </p>
                    </div>
                )}

                {/* Keep practicing card */}
                <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-8 text-center shadow-sm">
                    <div className="pointer-events-none absolute -top-20 -right-20 h-44 w-44 rounded-full bg-brand-brown/5 blur-2xl" />
                    <div className="pointer-events-none absolute -bottom-20 -left-20 h-44 w-44 rounded-full bg-brand-yellow/5 blur-2xl" />

                    <div className="relative z-10 space-y-4">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-lightblue text-brand-brown">
                            <Sparkles className="h-7 w-7 animate-pulse" />
                        </div>
                        <h3 className="text-xl font-black text-foreground">
                            {t('progress.keep_practicing')}
                        </h3>
                        <p className="mx-auto max-w-md text-sm leading-relaxed font-semibold text-muted-foreground">
                            {t('progress.keep_practicing_desc')}
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}

Progress.layout = {
    breadcrumbs: [{ title: 'my progress', href: '/pupil/progress' }],
};

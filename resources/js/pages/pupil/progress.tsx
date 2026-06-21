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
                <div className="flex flex-col justify-between gap-4 rounded-3xl border border-indigo-100 bg-gradient-to-r from-indigo-50/40 via-purple-50/20 to-transparent p-6 md:flex-row md:items-center dark:border-indigo-950/20 dark:from-indigo-950/5 dark:via-purple-950/20">
                    <div className="space-y-1">
                        <h1 className="bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 bg-clip-text text-3xl font-black tracking-tight text-transparent">
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
                    <div className="group rounded-3xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:border-indigo-500/30 hover:shadow-md hover:shadow-indigo-500/5">
                        <div className="mb-4 flex items-center gap-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                                <BookOpen className="h-5 w-5" />
                            </div>
                            <span className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                                {t('progress.path')}
                            </span>
                        </div>
                        <h4 className="truncate text-lg font-bold text-foreground">
                            {progress.learning_path}
                        </h4>
                    </div>

                    {/* Sessions Card */}
                    <div className="group rounded-3xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:border-purple-500/30 hover:shadow-md hover:shadow-purple-500/5">
                        <div className="mb-4 flex items-center gap-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                                <Clock className="h-5 w-5" />
                            </div>
                            <span className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                                {t('progress.sessions')}
                            </span>
                        </div>
                        <h4 className="text-xl font-black text-foreground">
                            {progress.completed_sessions}{' '}
                            <span className="text-xs font-bold text-muted-foreground">
                                / {progress.total_sessions} lessons
                            </span>
                        </h4>
                    </div>

                    {/* Rating Card */}
                    <div className="group rounded-3xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:border-emerald-500/30 hover:shadow-md hover:shadow-emerald-500/5">
                        <div className="mb-4 flex items-center gap-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                <TrendingUp className="h-5 w-5" />
                            </div>
                            <span className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                                {t('progress.rating')}
                            </span>
                        </div>
                        <h4 className="text-xl font-black text-foreground">
                            {progress.average_rating}{' '}
                            <span className="text-xs font-bold text-muted-foreground">
                                / 5.0 rating
                            </span>
                        </h4>
                    </div>

                    {/* Certificates Card */}
                    <div className="group rounded-3xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:border-amber-500/30 hover:shadow-md hover:shadow-amber-500/5">
                        <div className="mb-4 flex items-center gap-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
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
                                Learning Journey Completion
                            </span>
                            <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                                {percent}%
                            </span>
                        </div>
                        <div className="h-3 w-full overflow-hidden rounded-full border border-border/30 bg-secondary dark:bg-accent/40">
                            <div
                                className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 transition-all duration-500"
                                style={{ width: `${percent}%` }}
                            />
                        </div>
                        <p className="mt-3 text-xs font-semibold text-muted-foreground">
                            Completed {progress.completed_sessions} out of{' '}
                            {progress.total_sessions} scheduled lessons on
                            SpeakFlow.
                        </p>
                    </div>
                )}

                {/* Keep practicing card */}
                <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-8 text-center shadow-sm">
                    <div className="pointer-events-none absolute -top-20 -right-20 h-44 w-44 rounded-full bg-indigo-500/5 blur-2xl" />
                    <div className="pointer-events-none absolute -bottom-20 -left-20 h-44 w-44 rounded-full bg-purple-500/5 blur-2xl" />

                    <div className="relative z-10 space-y-4">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-500">
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

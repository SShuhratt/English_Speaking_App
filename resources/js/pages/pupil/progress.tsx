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

    const percent = progress.total_sessions > 0 
        ? Math.round((progress.completed_sessions / progress.total_sessions) * 100) 
        : 0;

    return (
        <AppLayout breadcrumbs={[{ title: t('progress.title'), href: '/pupil/progress' }]}>
            <Head title={t('progress.title')} />
            <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl border border-indigo-100 bg-gradient-to-r from-indigo-50/40 via-purple-50/20 to-transparent dark:border-indigo-950/20 dark:from-indigo-950/5 dark:via-purple-950/20">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 bg-clip-text text-transparent">
                            {t('progress.title')}
                        </h1>
                        <p className="text-muted-foreground font-medium text-sm">{t('progress.desc')}</p>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    {/* Path Card */}
                    <div className="group rounded-3xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:border-indigo-500/30 hover:shadow-md hover:shadow-indigo-500/5">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                                <BookOpen className="h-5 w-5" />
                            </div>
                            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('progress.path')}</span>
                        </div>
                        <h4 className="text-lg font-bold text-foreground truncate">{progress.learning_path}</h4>
                    </div>

                    {/* Sessions Card */}
                    <div className="group rounded-3xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:border-purple-500/30 hover:shadow-md hover:shadow-purple-500/5">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                                <Clock className="h-5 w-5" />
                            </div>
                            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('progress.sessions')}</span>
                        </div>
                        <h4 className="text-xl font-black text-foreground">{progress.completed_sessions} <span className="text-xs text-muted-foreground font-bold">/ {progress.total_sessions} lessons</span></h4>
                    </div>

                    {/* Rating Card */}
                    <div className="group rounded-3xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:border-emerald-500/30 hover:shadow-md hover:shadow-emerald-500/5">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                <TrendingUp className="h-5 w-5" />
                            </div>
                            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('progress.rating')}</span>
                        </div>
                        <h4 className="text-xl font-black text-foreground">{progress.average_rating} <span className="text-xs text-muted-foreground font-bold">/ 5.0 rating</span></h4>
                    </div>

                    {/* Certificates Card */}
                    <div className="group rounded-3xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:border-amber-500/30 hover:shadow-md hover:shadow-amber-500/5">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                <Award className="h-5 w-5" />
                            </div>
                            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('progress.certificates')}</span>
                        </div>
                        <h4 className="text-xl font-black text-foreground">{t('progress.earned', { count: 0 })}</h4>
                    </div>
                </div>

                {/* Progress bar visual container */}
                {progress.total_sessions > 0 && (
                    <div className="rounded-3xl border border-border bg-card p-6 md:p-8 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-sm font-bold text-foreground">Learning Journey Completion</span>
                            <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{percent}%</span>
                        </div>
                        <div className="w-full bg-secondary dark:bg-accent/40 rounded-full h-3 overflow-hidden border border-border/30">
                            <div 
                                className="bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 h-full rounded-full transition-all duration-500" 
                                style={{ width: `${percent}%` }}
                            />
                        </div>
                        <p className="text-xs text-muted-foreground font-semibold mt-3">Completed {progress.completed_sessions} out of {progress.total_sessions} scheduled lessons on SpeakFlow.</p>
                    </div>
                )}

                {/* Keep practicing card */}
                <div className="rounded-3xl border border-border bg-card p-8 shadow-sm text-center relative overflow-hidden">
                    <div className="absolute -top-20 -right-20 h-44 w-44 rounded-full bg-indigo-500/5 blur-2xl pointer-events-none" />
                    <div className="absolute -bottom-20 -left-20 h-44 w-44 rounded-full bg-purple-500/5 blur-2xl pointer-events-none" />
                    
                    <div className="relative z-10 space-y-4">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-500">
                            <Sparkles className="h-7 w-7 animate-pulse" />
                        </div>
                        <h3 className="text-xl font-black text-foreground">{t('progress.keep_practicing')}</h3>
                        <p className="text-muted-foreground text-sm font-semibold max-w-md mx-auto leading-relaxed">
                            {t('progress.keep_practicing_desc')}
                        </p>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

import React from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { MessageSquare, User, Star, Calendar, Clock, ArrowRight } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';
import { Badge } from '@/components/ui/badge';

interface Props {
    feedbacks: {
        data: any[];
    };
}

export default function Feedback({ feedbacks }: Props) {
    const { t } = useTranslation();

    return (
        <AppLayout breadcrumbs={[{ title: t('teacher.feedback_title'), href: '/teacher/feedback' }]}>
            <Head title={t('teacher.feedback_title')} />
            <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl border border-indigo-100 bg-gradient-to-r from-indigo-50/40 via-purple-50/20 to-transparent dark:border-indigo-950/20 dark:from-indigo-950/5 dark:via-purple-950/20">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 bg-clip-text text-transparent">
                            {t('teacher.feedback_title')}
                        </h1>
                        <p className="text-muted-foreground font-medium text-sm">{t('teacher.feedback_desc')}</p>
                    </div>
                </div>

                {/* Feedback List */}
                <div className="grid gap-6">
                    {feedbacks.data.length > 0 ? (
                        feedbacks.data.map((fb) => {
                            const isTeacherAuthor = fb.author_id === fb.teacher_id || fb.author?.role === 'teacher';
                            const authorName = fb.author?.full_name || (isTeacherAuthor ? t('teacher.feedback_role_teacher') : fb.pupil?.full_name) || t('teacher.feedback_anonymous');
                            const targetPupilName = fb.pupil?.full_name || fb.conversation?.pupil?.full_name;

                            // Session formatting
                            const sessionDate = fb.conversation?.started_at ? new Date(fb.conversation.started_at) : null;
                            const sessionEndDate = fb.conversation?.ended_at ? new Date(fb.conversation.ended_at) : null;

                            return (
                                <div key={fb.id} className="group rounded-3xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-4 mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 group-hover:scale-105 transition-transform">
                                                <User className="h-5.5 w-5.5" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <h4 className="font-bold text-foreground text-sm">{authorName}</h4>
                                                    <Badge variant={isTeacherAuthor ? 'default' : 'secondary'} className="text-[10px] py-0.5 px-2 font-bold uppercase tracking-wider rounded-lg">
                                                        {isTeacherAuthor ? t('teacher.feedback_role_teacher') : t('teacher.feedback_role_pupil')}
                                                    </Badge>
                                                </div>
                                                <p className="text-[11px] text-muted-foreground font-semibold mt-0.5">
                                                    {t('teacher.feedback_author')}: {isTeacherAuthor ? t('teacher.feedback_role_teacher') : t('teacher.feedback_role_pupil')}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-1.5 text-amber-500 bg-amber-500/5 border border-amber-500/10 px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm">
                                                <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                                                <span>{fb.rating}</span>
                                            </div>
                                            <span className="text-xs text-muted-foreground font-semibold">
                                                {new Date(fb.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Content & Context Details */}
                                    <div className="space-y-4">
                                        {/* Targets & Action */}
                                        {isTeacherAuthor && targetPupilName && (
                                            <div className="bg-muted/30 rounded-2xl p-3 text-xs text-muted-foreground flex items-center gap-2 border border-border/40 font-semibold">
                                                <span className="text-muted-foreground">{t('teacher.feedback_target')}:</span>
                                                <span className="bg-card px-2.5 py-1 rounded-xl border border-border/80 font-bold text-foreground">{targetPupilName}</span>
                                            </div>
                                        )}

                                        {/* Session Info */}
                                        {sessionDate && (
                                            <div className="bg-muted/30 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs border border-border/40 font-semibold">
                                                <div className="flex items-center gap-2 text-muted-foreground">
                                                    <Calendar className="h-4 w-4 text-indigo-500 shrink-0" />
                                                    <span className="text-foreground">{t('teacher.feedback_session_info')}:</span>
                                                    <span>{sessionDate.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-muted-foreground">
                                                    <Clock className="h-4 w-4 text-indigo-500 shrink-0" />
                                                    <span>
                                                        {sessionDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        {sessionEndDate && (
                                                            <>
                                                                <ArrowRight className="inline-block h-3 w-3 mx-1 text-muted-foreground" />
                                                                {sessionEndDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </>
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                        )}

                                        <div className="pt-2">
                                            <p className="text-sm leading-relaxed italic text-muted-foreground pl-4 border-l-2 border-indigo-500/35 font-medium">
                                                "{fb.comment}"
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="rounded-3xl border border-dashed border-border bg-card p-16 text-center text-muted-foreground">
                            <MessageSquare className="mx-auto h-10 w-10 text-muted-foreground/45 mb-4 animate-pulse" />
                            <p className="font-bold text-base text-foreground mb-1">{t('teacher.no_feedback')}</p>
                            <p className="text-sm text-muted-foreground">Feedback from students will appear here once submitted.</p>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}

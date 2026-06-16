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
        <AppLayout>
            <Head title={t('teacher.feedback_title')} />
            <div className="p-6 md:p-8 max-w-5xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">{t('teacher.feedback_title')}</h1>
                    <p className="text-muted-foreground mt-2">{t('teacher.feedback_desc')}</p>
                </div>

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
                                <div key={fb.id} className="rounded-2xl border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4 mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
                                                <User className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <h4 className="font-semibold text-foreground">{authorName}</h4>
                                                    <Badge variant={isTeacherAuthor ? 'default' : 'secondary'} className="text-[10px] py-0.5 px-2">
                                                        {isTeacherAuthor ? t('teacher.feedback_role_teacher') : t('teacher.feedback_role_pupil')}
                                                    </Badge>
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-0.5">
                                                    {t('teacher.feedback_author')}: {isTeacherAuthor ? t('teacher.feedback_role_teacher') : t('teacher.feedback_role_pupil')}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-1 text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-full text-sm font-bold">
                                                <Star className="h-4 w-4 fill-amber-500" />
                                                <span>{fb.rating}</span>
                                            </div>
                                            <span className="text-xs text-muted-foreground">
                                                {new Date(fb.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Content & Context Details */}
                                    <div className="space-y-4">
                                        {/* Targets & Action */}
                                        {isTeacherAuthor && targetPupilName && (
                                            <div className="bg-muted/30 rounded-lg p-3 text-xs text-muted-foreground flex items-center gap-2">
                                                <span className="font-semibold text-foreground">{t('teacher.feedback_target')}:</span>
                                                <span className="bg-background px-2 py-0.5 rounded border font-medium text-foreground">{targetPupilName}</span>
                                            </div>
                                        )}

                                        {/* Session Info */}
                                        {sessionDate && (
                                            <div className="bg-muted/40 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs border border-border/40">
                                                <div className="flex items-center gap-2 text-muted-foreground">
                                                    <Calendar className="h-4 w-4 text-indigo-500 shrink-0" />
                                                    <span className="font-semibold text-foreground">{t('teacher.feedback_session_info')}:</span>
                                                    <span>{sessionDate.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-muted-foreground">
                                                    <Clock className="h-4 w-4 text-indigo-500 shrink-0" />
                                                    <span>
                                                        {sessionDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        {sessionEndDate && (
                                                            <>
                                                                <ArrowRight className="inline-block h-3 w-3 mx-1" />
                                                                {sessionEndDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </>
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                        )}

                                        <div className="pt-2">
                                            <p className="text-sm leading-relaxed italic text-muted-foreground pl-4 border-l-2 border-indigo-500/30">
                                                "{fb.comment}"
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="text-center py-20 border rounded-2xl bg-muted/10 border-dashed">
                            <MessageSquare className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                            <p className="text-muted-foreground">{t('teacher.no_feedback')}</p>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}

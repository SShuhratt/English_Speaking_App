import React from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import {
    MessageSquare,
    User,
    Star,
    Calendar,
    Clock,
    ArrowRight,
} from 'lucide-react';
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
        <>
            <Head title={t('teacher.feedback_title')} />
            <div className="mx-auto max-w-5xl space-y-8 p-6 md:p-8">
                {/* Header Section */}
                <div className="relative overflow-hidden rounded-3xl bg-brand-navy p-8 text-white shadow-lg shadow-brand-navy/10">
                    <div className="pointer-events-none absolute -top-20 -right-20 h-44 w-44 rounded-full bg-brand-lightblue/10 blur-xl" />
                    <div className="pointer-events-none absolute -bottom-20 -left-20 h-44 w-44 rounded-full bg-brand-yellow/10 blur-xl" />
                    
                    <div className="relative z-10 space-y-1.5">
                        <span className="text-[10px] font-black uppercase tracking-widest text-brand-yellow">
                            FEEDBACK MANAGEMENT
                        </span>
                        <h1 className="text-3xl font-black tracking-tight text-white">
                            {t('teacher.feedback_title')}
                        </h1>
                        <p className="text-sm font-medium text-brand-lightblue/80">
                            {t('teacher.feedback_desc')}
                        </p>
                    </div>
                </div>

                {/* Feedback List */}
                <div className="grid gap-6">
                    {feedbacks.data.length > 0 ? (
                        feedbacks.data.map((fb) => {
                            const isTeacherAuthor =
                                fb.author_id === fb.teacher_id ||
                                fb.author?.role === 'teacher';
                            const authorName =
                                fb.author?.full_name ||
                                (isTeacherAuthor
                                    ? t('teacher.feedback_role_teacher')
                                    : fb.pupil?.full_name) ||
                                t('teacher.feedback_anonymous');
                            const targetPupilName =
                                fb.pupil?.full_name ||
                                fb.conversation?.pupil?.full_name;

                            // Session formatting
                            const sessionDate = fb.conversation?.started_at
                                ? new Date(fb.conversation.started_at)
                                : null;
                            const sessionEndDate = fb.conversation?.ended_at
                                ? new Date(fb.conversation.ended_at)
                                : null;

                            return (
                                <div
                                    key={fb.id}
                                    className="group rounded-3xl border border-border bg-card p-6 shadow-sm transition-shadow duration-300 hover:shadow-md"
                                >
                                    <div className="mb-4 flex flex-col justify-between gap-4 border-b border-border/60 pb-4 md:flex-row md:items-center">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-lightblue text-brand-brown transition-transform group-hover:scale-105">
                                                <User className="h-5.5 w-5.5" />
                                            </div>
                                            <div>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <h4 className="text-sm font-bold text-foreground">
                                                        {authorName}
                                                    </h4>
                                                    <Badge
                                                        variant={
                                                            isTeacherAuthor
                                                                ? 'default'
                                                                : 'secondary'
                                                        }
                                                        className="rounded-lg px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase"
                                                    >
                                                        {isTeacherAuthor
                                                            ? t(
                                                                  'teacher.feedback_role_teacher',
                                                              )
                                                            : t(
                                                                  'teacher.feedback_role_pupil',
                                                              )}
                                                    </Badge>
                                                </div>
                                                <p className="mt-0.5 text-[11px] font-semibold text-muted-foreground">
                                                    {t(
                                                        'teacher.feedback_author',
                                                    )}
                                                    :{' '}
                                                    {isTeacherAuthor
                                                        ? t(
                                                              'teacher.feedback_role_teacher',
                                                          )
                                                        : t(
                                                              'teacher.feedback_role_pupil',
                                                          )}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-1.5 rounded-xl border border-amber-500/10 bg-amber-500/5 px-3 py-1.5 text-xs font-bold text-amber-500 shadow-sm">
                                                <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                                                <span>{fb.rating}</span>
                                            </div>
                                            <span className="text-xs font-semibold text-muted-foreground">
                                                {new Date(
                                                    fb.created_at,
                                                ).toLocaleDateString([], {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric',
                                                })}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Content & Context Details */}
                                    <div className="space-y-4">
                                        {/* Targets & Action */}
                                        {isTeacherAuthor && targetPupilName && (
                                            <div className="flex items-center gap-2 rounded-2xl border border-border/40 bg-muted/30 p-3 text-xs font-semibold text-muted-foreground">
                                                <span className="text-muted-foreground">
                                                    {t(
                                                        'teacher.feedback_target',
                                                    )}
                                                    :
                                                </span>
                                                <span className="rounded-xl border border-border/80 bg-card px-2.5 py-1 font-bold text-foreground">
                                                    {targetPupilName}
                                                </span>
                                            </div>
                                        )}

                                        {/* Session Info */}
                                        {sessionDate && (
                                            <div className="flex flex-col justify-between gap-3 rounded-2xl border border-border/40 bg-muted/30 p-4 text-xs font-semibold sm:flex-row sm:items-center">
                                                <div className="flex items-center gap-2 text-muted-foreground">
                                                    <Calendar className="h-4 w-4 shrink-0 text-brand-brown" />
                                                    <span className="text-foreground">
                                                        {t(
                                                            'teacher.feedback_session_info',
                                                        )}
                                                        :
                                                    </span>
                                                    <span>
                                                        {sessionDate.toLocaleDateString(
                                                            [],
                                                            {
                                                                weekday:
                                                                    'short',
                                                                month: 'short',
                                                                day: 'numeric',
                                                                year: 'numeric',
                                                            },
                                                        )}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 text-muted-foreground">
                                                    <Clock className="h-4 w-4 shrink-0 text-brand-brown" />
                                                    <span>
                                                        {sessionDate.toLocaleTimeString(
                                                            [],
                                                            {
                                                                hour: '2-digit',
                                                                minute: '2-digit',
                                                            },
                                                        )}
                                                        {sessionEndDate && (
                                                            <>
                                                                <ArrowRight className="mx-1 inline-block h-3 w-3 text-muted-foreground" />
                                                                {sessionEndDate.toLocaleTimeString(
                                                                    [],
                                                                    {
                                                                        hour: '2-digit',
                                                                        minute: '2-digit',
                                                                    },
                                                                )}
                                                            </>
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                        )}

                                        <div className="pt-2">
                                            <p className="border-l-2 border-brand-brown/30 pl-4 text-sm leading-relaxed font-medium text-muted-foreground italic">
                                                "{fb.comment}"
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="rounded-3xl border border-dashed border-border bg-card p-16 text-center text-muted-foreground">
                            <MessageSquare className="mx-auto mb-4 h-10 w-10 animate-pulse text-muted-foreground/45" />
                            <p className="mb-1 text-base font-bold text-foreground">
                                {t('teacher.no_feedback')}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                {t('teacher.feedback_empty_desc')}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

Feedback.layout = {
    breadcrumbs: [{ title: 'pupil feedback', href: '/teacher/feedback' }],
};

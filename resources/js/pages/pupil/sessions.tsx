import React, { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, useForm, usePage, router, Link } from '@inertiajs/react';
import {
    Video,
    User,
    Calendar,
    Clock,
    Star,
    MessageSquare,
    Trash2,
    Sparkles,
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/use-translation';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface Props {
    sessions: {
        data: any[];
    };
}

export default function Sessions({ sessions }: Props) {
    const { auth } = usePage().props as any;
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [selectedApt, setSelectedApt] = useState<any>(null);

    const { data, setData, post, processing, errors, reset, clearErrors } =
        useForm({
            appointment_id: '',
            rating_score: '10',
            comment_text: '',
        });

    const handleOpenFeedbackModal = (apt: any) => {
        setData({
            appointment_id: apt.id,
            rating_score: '10',
            comment_text: '',
        });
        clearErrors();
        setSelectedApt(apt);
        setIsOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm(t('bookings.delete_confirm'))) return;
        try {
            await axios.delete(`/appointments/${id}`);
            toast.success(t('bookings.delete_success'));
            router.reload();
        } catch (error: any) {
            toast.error(
                error.response?.data?.message || t('bookings.delete_error'),
            );
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/feedback', {
            onSuccess: () => {
                setIsOpen(false);
                reset();
            },
        });
    };

    return (
        <>
            <Head title={t('sessions.past_title')} />
            <div className="mx-auto max-w-5xl space-y-8 p-6 md:p-8">
                {/* Header Section */}
                <div className="relative overflow-hidden rounded-3xl bg-brand-navy p-8 text-white shadow-lg shadow-brand-navy/10">
                    <div className="pointer-events-none absolute -top-20 -right-20 h-44 w-44 rounded-full bg-brand-lightblue/10 blur-xl" />
                    <div className="pointer-events-none absolute -bottom-20 -left-20 h-44 w-44 rounded-full bg-brand-yellow/10 blur-xl" />

                    <div className="relative z-10 space-y-1.5">
                        <span className="text-[10px] font-black tracking-widest text-brand-yellow uppercase">
                            SESSION HISTORY
                        </span>
                        <h1 className="text-3xl font-black tracking-tight text-white">
                            {t('sessions.past_title')}
                        </h1>
                        <p className="text-sm font-medium text-brand-lightblue/80">
                            {t('sessions.past_desc')}
                        </p>
                    </div>
                </div>

                {/* Session Cards */}
                <div className="grid gap-5">
                    {sessions.data.length > 0 ? (
                        sessions.data.map((apt) => {
                            const pupilFeedback = apt.feedbacks?.find(
                                (fb: any) => fb.author_id === auth.user.id,
                            );
                            const teacherFeedback = apt.feedbacks?.find(
                                (fb: any) => fb.author_id === apt.teacher_id,
                            );
                            return (
                                <div
                                    key={apt.id}
                                    className="group flex flex-col gap-5 rounded-3xl border border-border bg-card p-6 shadow-sm transition-shadow duration-300 hover:shadow-md"
                                >
                                    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                                        <div className="flex items-center gap-4">
                                            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-brand-lightblue text-brand-brown transition-transform group-hover:scale-105">
                                                {apt.teacher?.avatar ? (
                                                    <img
                                                        src={apt.teacher.avatar}
                                                        className="h-full w-full object-cover"
                                                        alt="avatar"
                                                    />
                                                ) : (
                                                    <User className="h-6 w-6" />
                                                )}
                                            </div>
                                            <div>
                                                <h4 className="text-base font-bold text-foreground">
                                                    {apt.teacher ? (
                                                        <Link
                                                            href={`/profile/${apt.teacher.id}`}
                                                            className="hover:underline"
                                                        >
                                                            {
                                                                apt.teacher
                                                                    .full_name
                                                            }
                                                        </Link>
                                                    ) : (
                                                        'Teacher'
                                                    )}
                                                </h4>
                                                <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs font-semibold text-muted-foreground">
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="h-3.5 w-3.5 text-brand-brown" />
                                                        {new Date(
                                                            apt.start_at,
                                                        ).toLocaleDateString(
                                                            [],
                                                            {
                                                                month: 'short',
                                                                day: 'numeric',
                                                                year: 'numeric',
                                                            },
                                                        )}
                                                    </span>
                                                    <div className="hidden h-2 w-px bg-border sm:block" />
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="h-3.5 w-3.5 text-brand-brown" />
                                                        {new Date(
                                                            apt.start_at,
                                                        ).toLocaleTimeString(
                                                            [],
                                                            {
                                                                hour: '2-digit',
                                                                minute: '2-digit',
                                                            },
                                                        )}{' '}
                                                        -{' '}
                                                        {new Date(
                                                            apt.end_at,
                                                        ).toLocaleTimeString(
                                                            [],
                                                            {
                                                                hour: '2-digit',
                                                                minute: '2-digit',
                                                            },
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2.5 self-end md:self-auto">
                                            {!pupilFeedback ? (
                                                <button
                                                    onClick={() =>
                                                        handleOpenFeedbackModal(
                                                            apt,
                                                        )
                                                    }
                                                    className="flex cursor-pointer items-center gap-2 rounded-xl border border-brand-brown/10 bg-brand-lightblue px-4 py-2.5 text-xs font-bold text-brand-brown transition-all"
                                                >
                                                    <Star className="h-3.5 w-3.5 fill-current" />{' '}
                                                    {t(
                                                        'sessions.leave_feedback',
                                                    )}
                                                </button>
                                            ) : (
                                                <span className="rounded-xl border border-emerald-500/10 bg-emerald-500/5 px-3 py-1.5 text-[10px] font-bold tracking-wide text-emerald-600 uppercase">
                                                    {t(
                                                        'sessions.feedback_left',
                                                    )}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {pupilFeedback && (
                                        <div className="mt-1 rounded-2xl border border-dashed border-border/80 bg-muted/30 p-4 text-sm">
                                            <div className="mb-2 flex items-center gap-1.5 font-bold text-amber-500">
                                                <Star className="h-4 w-4 fill-current" />
                                                <span>
                                                    {pupilFeedback.rating}/10
                                                </span>
                                                <span className="ml-auto text-[11px] font-semibold text-muted-foreground">
                                                    {t('sessions.your_review')}
                                                </span>
                                            </div>
                                            <p className="font-medium text-muted-foreground italic">
                                                "{pupilFeedback.comment}"
                                            </p>
                                        </div>
                                    )}

                                    {teacherFeedback && (
                                        <div className="mt-1 rounded-2xl border border-dashed border-border/80 bg-brand-lightblue/20 p-4 text-sm">
                                            <div className="mb-2 flex items-center gap-1.5 font-bold text-brand-navy">
                                                <MessageSquare className="h-4 w-4 text-brand-brown" />
                                                <span>
                                                    {t(
                                                        'sessions.teacher_feedback',
                                                    )}
                                                </span>
                                            </div>
                                            <p className="font-medium text-muted-foreground italic">
                                                "{teacherFeedback.comment}"
                                            </p>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    ) : (
                        <div className="rounded-3xl border border-dashed border-border bg-card p-16 text-center text-muted-foreground">
                            <Clock className="mx-auto mb-4 h-10 w-10 animate-pulse text-muted-foreground/45" />
                            <p className="mb-1 text-base font-bold text-foreground">
                                {t('sessions.none')}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                {t('sessions.empty_desc')}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black tracking-tight">
                            {t('sessions.leave_feedback')}
                        </DialogTitle>
                        <DialogDescription className="text-sm font-medium text-muted-foreground">
                            {t('sessions.dialog_desc', {
                                name:
                                    selectedApt?.teacher?.full_name ||
                                    'Teacher',
                            })}
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="mt-4 space-y-6">
                        <div className="space-y-2.5">
                            <label className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                                {t('sessions.rating_label', {
                                    score: data.rating_score,
                                })}
                            </label>
                            <div className="mt-1.5 grid grid-cols-5 gap-2">
                                {Array.from(
                                    { length: 10 },
                                    (_, i) => i + 1,
                                ).map((val) => (
                                    <button
                                        key={val}
                                        type="button"
                                        onClick={() =>
                                            setData(
                                                'rating_score',
                                                val.toString(),
                                            )
                                        }
                                        className={`cursor-pointer rounded-xl border py-2.5 text-xs font-bold transition-all duration-200 ${
                                            data.rating_score === val.toString()
                                                ? 'border-transparent bg-brand-brown text-white shadow-md shadow-brand-brown/10'
                                                : 'border-border bg-card text-muted-foreground hover:bg-muted'
                                        }`}
                                    >
                                        {val}
                                    </button>
                                ))}
                            </div>
                            {errors.rating_score && (
                                <p className="text-xs font-bold text-destructive">
                                    {errors.rating_score}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2.5">
                            <label className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                                {t('sessions.comments_label')}
                            </label>
                            <textarea
                                value={data.comment_text}
                                onChange={(e) =>
                                    setData('comment_text', e.target.value)
                                }
                                placeholder={t('sessions.comments_placeholder')}
                                className="min-h-[120px] w-full resize-none rounded-2xl border border-border bg-background p-3 text-sm font-medium transition-all focus:ring-2 focus:ring-brand-button focus:outline-none"
                                required
                            />
                            {errors.comment_text && (
                                <p className="text-xs font-bold text-destructive">
                                    {errors.comment_text}
                                </p>
                            )}
                        </div>

                        <DialogFooter className="gap-2 border-t border-border/55 pt-2 sm:gap-0">
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="cursor-pointer rounded-xl border border-border px-4 py-2.5 text-xs font-bold transition-all hover:bg-muted"
                            >
                                {t('dashboard.cancel_button')}
                            </button>
                            <button
                                type="submit"
                                disabled={processing}
                                className="cursor-pointer rounded-xl bg-brand-button px-5 py-2.5 text-xs font-bold text-brand-brown shadow-md shadow-brand-button/10 transition-all hover:bg-brand-button-hover disabled:opacity-50"
                            >
                                {processing
                                    ? t('sessions.submitting')
                                    : t('sessions.submit_btn')}
                            </button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}

Sessions.layout = {
    breadcrumbs: [{ title: 'past sessions', href: '/pupil/sessions' }],
};

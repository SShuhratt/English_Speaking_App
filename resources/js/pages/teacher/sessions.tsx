import React, { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, useForm, usePage, router, Link } from '@inertiajs/react';
import { User, Calendar, Clock, MessageSquare, Trash2 } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { useTranslation } from '@/hooks/use-translation';

interface Props {
    appointments: {
        data: any[];
    };
}

export default function Sessions({ appointments }: Props) {
    const { auth } = usePage().props as any;
    const [isOpen, setIsOpen] = useState(false);
    const [selectedApt, setSelectedApt] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'all' | 'upcoming' | 'completed'>('all');
    const { t } = useTranslation();

    const now = new Date();
    const filteredAppointments = (appointments.data || []).filter((apt) => {
        const isPast = new Date(apt.end_at) < now;
        const isFuture = new Date(apt.start_at) >= now;
        if (activeTab === 'upcoming') return apt.status === 'confirmed' && isFuture;
        if (activeTab === 'completed') return isPast || apt.status === 'completed';
        return true;
    });

    const upcomingCount = (appointments.data || []).filter((a) => a.status === 'confirmed' && new Date(a.start_at) >= now).length;
    const completedCount = (appointments.data || []).filter((a) => new Date(a.end_at) < now || a.status === 'completed').length;

    const { data, setData, post, processing, errors, reset, clearErrors } =
        useForm({
            appointment_id: '',
            comment_text: '',
        });

    const handleOpenFeedbackModal = (apt: any) => {
        setData({
            appointment_id: apt.id,
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
            <Head title={t('teacher.sessions_title')} />
            <div className="mx-auto max-w-5xl space-y-8 p-6 md:p-8">
                {/* Header Section */}
                <div className="relative overflow-hidden rounded-3xl bg-brand-navy p-8 text-white shadow-lg shadow-brand-navy/10">
                    <div className="pointer-events-none absolute -top-20 -right-20 h-44 w-44 rounded-full bg-brand-lightblue/10 blur-xl" />
                    <div className="pointer-events-none absolute -bottom-20 -left-20 h-44 w-44 rounded-full bg-brand-yellow/10 blur-xl" />
                    
                    <div className="relative z-10 space-y-1.5">
                        <span className="text-[10px] font-black uppercase tracking-widest text-brand-yellow">
                            SESSION HISTORY
                        </span>
                        <h1 className="text-3xl font-black tracking-tight text-white">
                            {t('teacher.sessions_title')}
                        </h1>
                        <p className="text-sm font-medium text-brand-lightblue/80">
                            {t('teacher.sessions_desc')}
                        </p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex flex-wrap gap-2 rounded-2xl border border-border bg-card p-1.5 shadow-sm">
                    <button
                        onClick={() => setActiveTab('all')}
                        className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-all ${
                            activeTab === 'all'
                                ? 'bg-[#061445] text-white shadow-sm'
                                : 'text-muted-foreground hover:bg-muted'
                        }`}
                    >
                        All
                        <span className={`flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-black ${
                            activeTab === 'all' ? 'bg-white/20 text-white' : 'bg-muted text-foreground'
                        }`}>
                            {appointments.data?.length || 0}
                        </span>
                    </button>
                    <button
                        onClick={() => setActiveTab('upcoming')}
                        className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-all ${
                            activeTab === 'upcoming'
                                ? 'bg-[#061445] text-white shadow-sm'
                                : 'text-muted-foreground hover:bg-muted'
                        }`}
                    >
                        Upcoming
                        {upcomingCount > 0 && (
                            <span className={`flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-black ${
                                activeTab === 'upcoming' ? 'bg-white/20 text-white' : 'bg-muted text-foreground'
                            }`}>
                                {upcomingCount}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('completed')}
                        className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-all ${
                            activeTab === 'completed'
                                ? 'bg-[#061445] text-white shadow-sm'
                                : 'text-muted-foreground hover:bg-muted'
                        }`}
                    >
                        Completed
                        {completedCount > 0 && (
                            <span className={`flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-black ${
                                activeTab === 'completed' ? 'bg-white/20 text-white' : 'bg-muted text-foreground'
                            }`}>
                                {completedCount}
                            </span>
                        )}
                    </button>
                </div>

                {/* Main Session List */}
                <div className="grid gap-5">
                    {filteredAppointments.length > 0 ? (
                        filteredAppointments.map((apt) => {
                            const teacherFeedback = apt.feedbacks?.find(
                                (fb: any) => fb.author_id === auth.user.id,
                            );
                            const isPast = new Date(apt.end_at) < new Date();
                            return (
                                <div
                                    key={apt.id}
                                    className="group flex flex-col gap-5 rounded-3xl border border-border bg-card p-6 shadow-sm transition-shadow duration-300 hover:shadow-md"
                                >
                                    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                                        <div className="flex items-center gap-4">
                                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-lightblue text-brand-brown transition-transform group-hover:scale-105 overflow-hidden">
                                                {apt.pupil?.avatar ? (
                                                    <img src={apt.pupil.avatar} className="h-full w-full object-cover" alt="avatar" />
                                                ) : (
                                                    <User className="h-6 w-6" />
                                                )}
                                            </div>
                                            <div>
                                                <h4 className="text-base font-bold text-foreground">
                                                    {apt.pupil ? (
                                                        <Link href={`/profile/${apt.pupil.id}`} className="hover:underline">
                                                            {apt.pupil.full_name}
                                                        </Link>
                                                    ) : (
                                                        'Student'
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
                                            <span
                                                className={`rounded-xl border px-3 py-1 text-[10px] font-extrabold tracking-wider uppercase ${
                                                    apt.status === 'confirmed'
                                                        ? 'border-emerald-200/50 bg-emerald-50 text-emerald-700'
                                                        : (apt.status === 'pending' || apt.status === 'accepted')
                                                          ? 'border-amber-200/50 bg-amber-50 text-amber-700'
                                                          : 'border-transparent bg-muted text-muted-foreground'
                                                }`}
                                            >
                                                {apt.status === 'accepted' ? 'Accepted (Verifying...)' : t(`bookings.status_${apt.status}`)}
                                            </span>

                                            {apt.status === 'confirmed' && (
                                                <>
                                                    {!teacherFeedback ? (
                                                        <button
                                                            onClick={() =>
                                                                handleOpenFeedbackModal(
                                                                    apt,
                                                                )
                                                            }
                                                            className="flex cursor-pointer items-center gap-2 rounded-xl border border-brand-brown/10 bg-brand-lightblue px-4 py-2.5 text-xs font-bold text-brand-brown transition-all"
                                                        >
                                                            <MessageSquare className="h-3.5 w-3.5" />{' '}
                                                            {t(
                                                                'teacher.sessions_leave_feedback',
                                                            )}
                                                        </button>
                                                    ) : (
                                                        <span className="rounded-xl border border-emerald-500/10 bg-emerald-500/5 px-3 py-1.5 text-[10px] font-bold tracking-wide text-emerald-600 uppercase">
                                                            {t(
                                                                'teacher.sessions_feedback_left',
                                                            )}
                                                        </span>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {teacherFeedback && (
                                        <div className="mt-1 rounded-2xl border border-dashed border-border/80 bg-muted/30 p-4 text-sm font-semibold">
                                            <div className="mb-2 flex items-center gap-1.5 text-brand-brown">
                                                <MessageSquare className="h-4 w-4" />
                                                <span>
                                                    {t(
                                                        'teacher.sessions_your_feedback',
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
                                {t('teacher.sessions_none')}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                {t('teacher.sessions_empty_desc')}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black tracking-tight">
                            {t('teacher.sessions_dialog_title')}
                        </DialogTitle>
                        <DialogDescription className="text-sm font-medium text-muted-foreground">
                            {t('teacher.sessions_dialog_desc', {
                                name: selectedApt?.pupil?.full_name,
                            })}
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="mt-4 space-y-6">
                        <div className="space-y-2.5">
                            <label className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                                {t('teacher.sessions_feedback_notes')}
                            </label>
                            <textarea
                                value={data.comment_text}
                                onChange={(e) =>
                                    setData('comment_text', e.target.value)
                                }
                                placeholder={t(
                                    'teacher.sessions_feedback_placeholder',
                                )}
                                className="min-h-[150px] w-full resize-none rounded-2xl border border-border bg-background p-3 text-sm font-medium transition-all focus:ring-2 focus:ring-brand-button focus:outline-none"
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
                                className="cursor-pointer rounded-xl bg-brand-button hover:bg-brand-button-hover px-5 py-2.5 text-xs font-bold text-brand-brown shadow-md shadow-brand-button/10 transition-all disabled:opacity-50"
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
    breadcrumbs: [{ title: 'my sessions', href: '/teacher/sessions' }],
};

import React, { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, useForm, usePage, router, Link } from '@inertiajs/react';
import {
    User,
    Calendar,
    Clock,
    MessageSquare,
    Trash2,
    Sparkles,
    Check,
    Info,
} from 'lucide-react';
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
    const [activeTab, setActiveTab] = useState<
        'all' | 'upcoming' | 'completed'
    >('all');
    const { t } = useTranslation();

    const now = new Date();
    const allItems = appointments.data || [];

    const filteredAppointments = allItems.filter((apt) => {
        const isPast = new Date(apt.end_at) < now;
        const isFuture = new Date(apt.start_at) >= now;
        if (activeTab === 'upcoming')
            return apt.status === 'confirmed' && isFuture;
        if (activeTab === 'completed')
            return isPast || apt.status === 'completed';
        return true;
    });

    const upcomingCount = allItems.filter(
        (a) => a.status === 'confirmed' && new Date(a.start_at) >= now,
    ).length;
    const completedCount = allItems.filter(
        (a) => new Date(a.end_at) < now || a.status === 'completed',
    ).length;
    const trialsThisWeek = allItems.filter((a) => {
        if (!a.is_trial) return false;
        const start = new Date(a.start_at);
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(now.getDate() - 7);
        return start >= sevenDaysAgo;
    }).length;

    const latestTrial = allItems.find(
        (a) =>
            a.is_trial &&
            new Date(a.start_at) >= now &&
            a.status === 'confirmed',
    );
    const [toastDismissed, setToastDismissed] = useState(false);

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

    const handleStartSession = async (apt: any) => {
        try {
            const res = await axios.post(
                `/teacher/appointments/${apt.id}/start`,
            );
            if (res.data.google_meet_link) {
                window.open(res.data.google_meet_link, '_blank');
            } else {
                toast.success('Session started');
            }
        } catch (err: any) {
            toast.error(
                err.response?.data?.message || 'Could not start session',
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
            <Head title="SESSION MANAGEMENT — My Lessons · ConvoMate" />

            <div
                className="mx-auto max-w-6xl space-y-8 p-6 md:p-8"
                style={{ fontFamily: "'Schibsted Grotesk', sans-serif" }}
            >
                {/* Header Section */}
                <div className="relative overflow-hidden rounded-3xl bg-[#1E2A5A] p-8 text-white shadow-xl">
                    <div className="pointer-events-none absolute -top-20 -right-20 h-44 w-44 rounded-full bg-[#F0CE5F]/10 blur-2xl" />

                    <div className="relative z-10 space-y-2">
                        <span className="text-[11px] font-black tracking-widest text-[#F7DE8B] uppercase">
                            SESSION MANAGEMENT
                        </span>
                        <h1
                            className="text-3xl font-extrabold tracking-tight text-white md:text-4xl"
                            style={{
                                fontFamily: "'Bricolage Grotesque', sans-serif",
                            }}
                        >
                            My Lessons
                        </h1>
                        <p className="max-w-2xl text-sm font-medium text-[#A9C6E8]/90">
                            Every lesson here is already booked and paid.
                            Nothing needs your approval — just show up and
                            teach.
                        </p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex flex-wrap gap-2 rounded-2xl border border-[#E8E6DE] bg-white p-1.5 shadow-sm">
                    <button
                        onClick={() => setActiveTab('all')}
                        className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                            activeTab === 'all'
                                ? 'bg-[#1E2A5A] text-white shadow-sm'
                                : 'text-[#6B7394] hover:bg-[#EEF4FB]'
                        }`}
                    >
                        All
                        <span
                            className={`flex h-4 min-w-4 items-center justify-center rounded-full px-1.5 text-[10px] font-black ${
                                activeTab === 'all'
                                    ? 'bg-white/20 text-white'
                                    : 'bg-[#EEF4FB] text-[#1E2A5A]'
                            }`}
                        >
                            {allItems.length}
                        </span>
                    </button>
                    <button
                        onClick={() => setActiveTab('upcoming')}
                        className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                            activeTab === 'upcoming'
                                ? 'bg-[#1E2A5A] text-white shadow-sm'
                                : 'text-[#6B7394] hover:bg-[#EEF4FB]'
                        }`}
                    >
                        Upcoming
                        {upcomingCount > 0 && (
                            <span
                                className={`flex h-4 min-w-4 items-center justify-center rounded-full px-1.5 text-[10px] font-black ${
                                    activeTab === 'upcoming'
                                        ? 'bg-white/20 text-white'
                                        : 'bg-[#EEF4FB] text-[#1E2A5A]'
                                }`}
                            >
                                {upcomingCount}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('completed')}
                        className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                            activeTab === 'completed'
                                ? 'bg-[#1E2A5A] text-white shadow-sm'
                                : 'text-[#6B7394] hover:bg-[#EEF4FB]'
                        }`}
                    >
                        Completed
                        {completedCount > 0 && (
                            <span
                                className={`flex h-4 min-w-4 items-center justify-center rounded-full px-1.5 text-[10px] font-black ${
                                    activeTab === 'completed'
                                        ? 'bg-white/20 text-white'
                                        : 'bg-[#EEF4FB] text-[#1E2A5A]'
                                }`}
                            >
                                {completedCount}
                            </span>
                        )}
                    </button>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                    {/* Left List (2 cols) */}
                    <div className="space-y-4 lg:col-span-2">
                        {filteredAppointments.length > 0 ? (
                            filteredAppointments.map((apt) => {
                                const isTrial = apt.is_trial;
                                const pupilName =
                                    apt.pupil?.full_name || 'Student';
                                const teacherFeedback = apt.feedbacks?.find(
                                    (fb: any) => fb.author_id === auth.user.id,
                                );
                                const formattedDate = new Date(
                                    apt.start_at,
                                ).toLocaleDateString('en-US', {
                                    weekday: 'short',
                                    day: 'numeric',
                                    month: 'short',
                                });
                                const formattedTimeStr = `${new Date(apt.start_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })} – ${new Date(apt.end_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}`;
                                const durationMinutes =
                                    apt.start_at && apt.end_at
                                        ? Math.max(
                                              1,
                                              Math.round(
                                                  (new Date(
                                                      apt.end_at,
                                                  ).getTime() -
                                                      new Date(
                                                          apt.start_at,
                                                      ).getTime()) /
                                                      60000,
                                              ),
                                          )
                                        : apt.duration_minutes || 30;
                                const rawPrice =
                                    apt.price !== undefined &&
                                    apt.price !== null
                                        ? Number(apt.price)
                                        : 0;
                                const formattedPriceStr =
                                    rawPrice
                                        .toLocaleString('ru-RU')
                                        .replace(/,/g, ' ') + ' UZS';

                                return (
                                    <div
                                        key={apt.id}
                                        className={`relative rounded-3xl border-2 p-6 transition-all ${
                                            isTrial
                                                ? 'border-[#F7DE8B] bg-[#FBEDBD]/60 shadow-sm'
                                                : 'border-[#E8E6DE] bg-white shadow-sm'
                                        }`}
                                    >
                                        <div className="mb-3 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                                            <div className="flex flex-wrap items-center gap-2">
                                                {isTrial ? (
                                                    <span className="rounded-full bg-[#1E2A5A] px-3 py-1 text-[10px] font-extrabold tracking-wider text-[#F7DE8B] uppercase">
                                                        Trial ·{' '}
                                                        {durationMinutes} min
                                                    </span>
                                                ) : (
                                                    <span className="rounded-full border border-[#A9C6E8] bg-[#E4EEF9] px-3 py-1 text-[10px] font-extrabold tracking-wider text-[#1E2A5A] uppercase">
                                                        Lesson ·{' '}
                                                        {durationMinutes} min
                                                    </span>
                                                )}
                                                {apt.status === 'confirmed' ? (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-[#DDF2E6] px-2.5 py-0.5 text-[10.5px] font-bold text-[#1E7A4D]">
                                                        <Check className="h-3 w-3" />{' '}
                                                        PAID
                                                    </span>
                                                ) : apt.status ===
                                                  'accepted' ? (
                                                    <span className="inline-flex items-center gap-1 rounded-full border border-[#F7DE8B] bg-[#FFF9E5] px-2.5 py-0.5 text-[10.5px] font-bold text-[#8A6A12]">
                                                        STATUS ACCEPTED ·
                                                        AWAITING PAYMENT
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-[10.5px] font-bold text-muted-foreground uppercase">
                                                        {apt.status}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="text-xs font-semibold text-[#6B7394]">
                                                {formattedDate} ·{' '}
                                                {formattedTimeStr}
                                            </div>
                                        </div>

                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <h3
                                                    className="text-lg font-extrabold text-[#22284A]"
                                                    style={{
                                                        fontFamily:
                                                            "'Bricolage Grotesque', sans-serif",
                                                    }}
                                                >
                                                    {pupilName}
                                                </h3>
                                                {isTrial && (
                                                    <p className="mt-0.5 text-xs font-semibold text-[#8A6A12]">
                                                        — new student, first
                                                        session with you
                                                    </p>
                                                )}
                                                <div className="mt-2 flex items-center gap-2 text-xs text-[#6B7394]">
                                                    <strong className="font-bold text-[#1E2A5A]">
                                                        {formattedPriceStr}
                                                    </strong>
                                                    <span>
                                                        ·{' '}
                                                        {isTrial
                                                            ? '⅓ of your rate'
                                                            : 'your full rate'}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex flex-col gap-2 sm:flex-row">
                                                {apt.status === 'confirmed' && (
                                                    <button
                                                        onClick={() =>
                                                            handleStartSession(
                                                                apt,
                                                            )
                                                        }
                                                        className="rounded-full bg-[#1E2A5A] px-4 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-[#1E2A5A]/90"
                                                    >
                                                        Join lesson
                                                    </button>
                                                )}

                                                {apt.status === 'confirmed' &&
                                                    !teacherFeedback && (
                                                        <button
                                                            onClick={() =>
                                                                handleOpenFeedbackModal(
                                                                    apt,
                                                                )
                                                            }
                                                            className="rounded-full border border-[#1E2A5A]/20 px-3.5 py-2 text-xs font-bold text-[#1E2A5A] transition-all hover:bg-[#EEF4FB]"
                                                        >
                                                            Feedback
                                                        </button>
                                                    )}
                                            </div>
                                        </div>

                                        {teacherFeedback && (
                                            <div className="mt-3 rounded-2xl border border-[#E8E6DE] bg-white/80 p-3 text-xs text-[#6B7394]">
                                                <b className="text-[#1E2A5A]">
                                                    Your feedback:
                                                </b>{' '}
                                                "{teacherFeedback.comment}"
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        ) : (
                            <div className="rounded-3xl border border-dashed border-[#E8E6DE] bg-white p-12 text-center text-[#6B7394]">
                                <Clock className="mx-auto mb-3 h-10 w-10 text-[#6B7394]/40" />
                                <p className="text-base font-bold text-[#22284A]">
                                    No lessons found
                                </p>
                                <p className="mt-1 text-xs text-[#6B7394]">
                                    Unpaid bookings never appear here — a lesson
                                    exists only after the student has paid.
                                </p>
                            </div>
                        )}

                        <p className="pt-2 text-center text-xs text-[#6B7394]">
                            ✦ Unpaid bookings never appear here — a lesson
                            exists only after the student has paid.
                        </p>
                    </div>

                    {/* Right Sidebar */}
                    <div className="space-y-6">
                        {/* Quick Stats Card */}
                        <div className="rounded-3xl border border-[#E8E6DE] bg-white p-6 shadow-sm">
                            <div className="mb-4 text-[11px] font-extrabold tracking-wider text-[#6B7394] uppercase">
                                QUICK STATS
                            </div>
                            <div className="space-y-3.5 text-sm">
                                <div className="flex items-center justify-between border-b border-[#E8E6DE] pb-3">
                                    <span className="font-medium text-[#6B7394]">
                                        Trials this week
                                    </span>
                                    <span
                                        className="text-base font-extrabold text-[#1E2A5A]"
                                        style={{
                                            fontFamily:
                                                "'Bricolage Grotesque', sans-serif",
                                        }}
                                    >
                                        {trialsThisWeek}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between border-b border-[#E8E6DE] pb-3">
                                    <span className="font-medium text-[#6B7394]">
                                        Upcoming
                                    </span>
                                    <span
                                        className="text-base font-extrabold text-[#1E2A5A]"
                                        style={{
                                            fontFamily:
                                                "'Bricolage Grotesque', sans-serif",
                                        }}
                                    >
                                        {upcomingCount}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="font-medium text-[#6B7394]">
                                        Completed
                                    </span>
                                    <span
                                        className="text-base font-extrabold text-[#1E2A5A]"
                                        style={{
                                            fontFamily:
                                                "'Bricolage Grotesque', sans-serif",
                                        }}
                                    >
                                        {completedCount}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Marketplace Tip Card */}
                        <div className="border-1.5 rounded-3xl border-[#F7DE8B] bg-[#FBEDBD]/70 p-6 shadow-sm">
                            <div className="mb-2 flex items-center gap-1.5 text-[11px] font-black tracking-wider text-[#8A6A12] uppercase">
                                <Sparkles className="h-4 w-4 text-[#8A6A12]" />{' '}
                                MARKETPLACE TIP
                            </div>
                            <p className="text-xs leading-relaxed font-medium text-[#5C4500]">
                                A trial is your audition. Assess the student's
                                level, name 2–3 concrete things to work on, and
                                propose a weekly plan — that's how trials become
                                regular students.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Floating Notification Toast for Trial Booking */}
                {latestTrial && !toastDismissed && (
                    <div className="fixed right-6 bottom-6 z-50 max-w-sm animate-in rounded-2xl border border-white/10 bg-[#1E2A5A] p-4 text-white shadow-2xl duration-300 fade-in slide-in-from-bottom-4">
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2 text-xs font-extrabold tracking-wider text-[#F7DE8B] uppercase">
                                <Sparkles className="h-4 w-4" /> New trial
                                lesson
                            </div>
                            <button
                                onClick={() => setToastDismissed(true)}
                                className="text-xs font-bold text-white/60 hover:text-white"
                            >
                                ✕
                            </button>
                        </div>
                        <p className="mt-1.5 text-xs leading-snug text-white/90">
                            <b>{latestTrial.pupil?.full_name}</b> booked a trial
                            ·{' '}
                            {new Date(latestTrial.start_at).toLocaleTimeString(
                                [],
                                {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    hour12: false,
                                },
                            )}{' '}
                            ·{' '}
                            {(latestTrial.price || 23000)
                                .toLocaleString('ru-RU')
                                .replace(/,/g, ' ')}{' '}
                            UZS, already paid. Tip: assess level and propose a
                            plan.
                        </p>
                    </div>
                )}
            </div>

            {/* Feedback Dialog */}
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl">
                    <DialogHeader>
                        <DialogTitle
                            className="text-xl font-black tracking-tight"
                            style={{
                                fontFamily: "'Bricolage Grotesque', sans-serif",
                            }}
                        >
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
                                className="min-h-[150px] w-full resize-none rounded-2xl border border-border bg-background p-3 text-sm font-medium transition-all focus:ring-2 focus:ring-[#1E2A5A] focus:outline-none"
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
                                className="cursor-pointer rounded-xl bg-[#1E2A5A] px-5 py-2.5 text-xs font-bold text-white shadow-md transition-all hover:bg-[#1E2A5A]/90 disabled:opacity-50"
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

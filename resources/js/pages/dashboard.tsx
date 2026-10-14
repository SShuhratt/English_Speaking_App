import { Head, usePage, Link, router } from '@inertiajs/react';
import {
    Calendar,
    Clock,
    Video,
    Star,
    Mic,
    Play,
    TrendingUp,
    CheckCircle2,
    Users,
    ChevronRight,
    Bell,
    Sparkles,
    CreditCard,
    Copy,
    Check,
    ExternalLink,
    ShieldAlert,
    X,
    Send,
    Loader2,
    Award,
    Package,
} from 'lucide-react';
import { dashboard } from '@/routes';
import type { Auth } from '@/types';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/use-translation';
import { formatDuration, formatSpeakingTime } from '@/lib/duration';
import AppLayout from '@/layouts/app-layout';
import GoogleCalendarWarningBanner from '@/components/teachers/GoogleCalendarWarningBanner';
import PhoneNumberReminderBanner from '@/components/PhoneNumberReminderBanner';
import PaymentModal from '@/components/PaymentModal';

function PupilMeetingButton({
    apt,
    handleJoin,
}: {
    apt: any;
    handleJoin: (apt: any) => void;
}) {
    const [currentTime, setCurrentTime] = useState(new Date());
    const { t } = useTranslation();

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const start = new Date(apt.start_at);
    const hasStartedTime = currentTime >= start;
    const isTeacherStarted = Boolean(apt.meeting_started);
    const hasMeetLink = Boolean(apt.google_meet_link);

    // If teacher has started the meeting early, pupil can join immediately!
    if (isTeacherStarted) {
        return (
            <button
                onClick={() => handleJoin(apt)}
                className="flex cursor-pointer items-center gap-2 rounded-full bg-[#061445] dark:bg-brand-yellow dark:text-[#061445] px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-[#061445]/10 transition-all hover:-translate-y-0.5 hover:shadow-lg"
            >
                <Video className="h-3.5 w-3.5" /> {t('meeting.join')}
            </button>
        );
    }

    // Strict to exact starting time: until currentTime >= start, show Scheduled!
    if (!hasStartedTime) {
        return (
            <button
                disabled
                className="flex cursor-not-allowed items-center gap-2 rounded-full border border-brand-lightblue/50 bg-brand-lightblue/35 dark:border-border dark:bg-muted/40 px-4 py-2.5 text-xs font-semibold text-brand-brown/80 dark:text-muted-foreground"
            >
                <Clock className="h-3.5 w-3.5" /> {t('meeting.scheduled')}
            </button>
        );
    }

    // Exact time has arrived: if meeting link or meeting started, pupil can join!
    if (hasMeetLink || isTeacherStarted) {
        return (
            <button
                onClick={() => handleJoin(apt)}
                className="flex cursor-pointer items-center gap-2 rounded-full bg-[#061445] dark:bg-brand-yellow dark:text-[#061445] px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-[#061445]/10 transition-all hover:-translate-y-0.5 hover:shadow-lg"
            >
                <Video className="h-3.5 w-3.5" /> {t('meeting.join')}
            </button>
        );
    }

    return (
        <button
            disabled
            title={t('meeting.not_ready')}
            className="flex cursor-not-allowed items-center gap-2 rounded-full border border-amber-300/40 bg-amber-50/80 dark:bg-amber-950/20 px-4 py-2.5 text-xs font-semibold text-amber-700 dark:text-amber-300 transition-all select-none"
        >
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse inline-block" />
            <span>{t('meeting.waiting_teacher')}</span>
        </button>
    );
}

function TeacherMeetingButton({
    apt,
    handleStart,
    startingAptId,
}: {
    apt: any;
    handleStart: (apt: any) => void;
    startingAptId: string | null;
}) {
    const [currentTime, setCurrentTime] = useState(new Date());
    const { t } = useTranslation();

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const start = new Date(apt.start_at);
    const hasStartedTime = currentTime >= start;

    if (!hasStartedTime) {
        return (
            <button
                disabled
                className="flex cursor-not-allowed items-center gap-2 rounded-full border border-brand-lightblue/50 bg-brand-lightblue/35 px-4 py-2.5 text-xs font-semibold text-brand-brown/80"
            >
                <Clock className="h-3.5 w-3.5" /> {t('meeting.scheduled')}
            </button>
        );
    }

    return (
        <button
            disabled={startingAptId === apt.id}
            onClick={() => handleStart(apt)}
            className="flex cursor-pointer items-center gap-2 rounded-full bg-[#061445] px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-[#061445]/10 transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50"
        >
            <Video className="h-3.5 w-3.5" />
            {startingAptId === apt.id
                ? t('meeting.starting')
                : t('meeting.start')}
        </button>
    );
}

function PupilDashboard({
    user,
    appointments = [],
    stats = {},
    recentFeedback = null,
    activePackages = [],
}: {
    user: any;
    appointments?: any[];
    stats?: any;
    recentFeedback?: any;
    activePackages?: any[];
}) {
    const { t, locale } = useTranslation();
    const [paymentBooking, setPaymentBooking] = useState<any | null>(null);
    const [isConnectingTelegram, setIsConnectingTelegram] = useState(false);

    const handleConnectTelegram = async () => {
        setIsConnectingTelegram(true);
        try {
            const response = await fetch('/settings/telegram/deep-link', {
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });
            const data = await response.json();
            if (data.deep_link) {
                window.open(data.deep_link, '_blank');
            } else {
                router.visit('/settings/profile#telegram');
            }
        } catch (error) {
            console.error('Failed to get Telegram deep link:', error);
            router.visit('/settings/profile#telegram');
        } finally {
            setIsConnectingTelegram(false);
        }
    };

    useEffect(() => {
        if (!user) return;

        const channel = window.Echo.private(`pupil.${user.id}`);

        channel.listen('.booking.updated', (e: any) => {
            if (e?.appointment?.meeting_started) {
                toast.info(t('meeting.teacher_started', 'Your teacher has started the lesson! You can join now.'));
            }
            router.reload({ only: ['appointments'] });
        });
        channel.listen('.ConversationApproved', (e: any) => {
            toast.info(
                t('dashboard.booking_approved_toast', 'Your session has been approved!')
            );
            router.reload({ only: ['appointments'] });
        });

        // Background polling fallback every 4 seconds for upcoming or active sessions
        const pollTimer = setInterval(() => {
            const hasActiveOrUpcomingSession = appointments?.some((b: any) => {
                if (b.status !== 'confirmed') return false;
                if (b.meeting_started) return false;
                const startTime = new Date(b.start_at).getTime();
                const now = Date.now();
                return startTime - now < 15 * 60 * 1000 && now - startTime < 60 * 60 * 1000;
            });

            if (hasActiveOrUpcomingSession) {
                router.reload({ only: ['appointments'] });
            }
        }, 4000);

        return () => {
            clearInterval(pollTimer);
            channel.stopListening('.booking.updated');
            channel.stopListening('.ConversationApproved');
        };
    }, [user?.id, appointments]);

    const handleCancel = async (id: string) => {
        const reason = prompt(
            t('dashboard.cancel_reason_prompt') ||
                'Please enter the reason for cancellation (minimum 3 characters):',
        );
        if (reason === null) {
            return;
        }
        const trimmedReason = reason.trim();
        if (trimmedReason.length < 3) {
            toast.error(
                t('dashboard.cancel_reason_min_length') ||
                    'Cancellation reason must be at least 3 characters.',
            );
            return;
        }
        try {
            await axios.delete(`/bookings/${id}`, {
                data: { reason: trimmedReason },
            });
            toast.success(t('dashboard.cancel_success'));
            router.reload();
        } catch (error: any) {
            toast.error(
                error.response?.data?.message || t('dashboard.cancel_error'),
            );
        }
    };

    const handleJoin = async (apt: any) => {
        try {
            const response = await axios.post(
                `/pupil/appointments/${apt.id}/join`,
            );
            if (response.data.google_meet_link) {
                window.open(response.data.google_meet_link, '_blank');
            } else {
                toast.error(t('meeting.not_ready') || 'Meeting link is not available yet.');
            }
        } catch (error: any) {
            toast.error(
                error.response?.data?.message || t('meeting.not_ready'),
            );
        }
    };

    return (
        <div className="flex h-full flex-1 flex-col gap-8 p-4 md:p-8">
            {/* Header / Welcome Back Banner */}
            <div className="relative flex flex-col justify-between gap-6 overflow-hidden rounded-3xl bg-brand-navy p-6 text-white shadow-xl shadow-brand-navy/10 md:p-8 dark:border dark:border-white/10 dark:bg-gradient-to-r dark:from-[#091334] dark:to-[#0d1b3e]">
                <div className="pointer-events-none absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/10 blur-2xl"></div>
                <div className="pointer-events-none absolute right-1/4 -bottom-10 h-32 w-32 rounded-full bg-brand-pale-blue/20 blur-xl"></div>

                <div className="z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
                    <div className="flex items-center space-x-4 md:space-x-6">
                        <div className="relative">
                            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border-2 border-white/40 bg-white/20 text-3xl font-bold shadow-inner backdrop-blur-md md:h-20 md:w-20">
                                {user.avatar ? (
                                    <img
                                        src={user.avatar}
                                        className="h-full w-full object-cover"
                                        alt="avatar"
                                    />
                                ) : (
                                    <span>👤</span>
                                )}
                            </div>
                        </div>
                        <div>
                            <h1 className="text-2xl font-extrabold tracking-tight md:text-3xl">
                                {t('dashboard.welcome_back', {
                                    name: user.full_name || user.name,
                                })}{' '}
                                👋
                            </h1>
                            <p className="mt-1 text-sm font-medium text-brand-yellow/80 opacity-90 md:text-base">
                                {t('dashboard.learning_journey_desc')}
                            </p>
                        </div>
                    </div>

                    <Link
                        href="/pupil/teachers"
                        className="group z-10 flex shrink-0 items-center justify-center space-x-2 rounded-full bg-white px-6 py-3.5 font-bold text-[#061445] shadow-md transition-all duration-200 hover:scale-[1.02] hover:bg-[#F7DE8B] hover:text-[#061445] hover:shadow-lg active:scale-[0.98] dark:bg-brand-yellow dark:text-[#061445] dark:hover:bg-[#f0d070]"
                    >
                        <Calendar className="h-4 w-4 text-[#061445] transition-transform group-hover:rotate-12 dark:text-[#061445]" />
                        <span className="text-[#061445] dark:text-[#061445]">{t('dashboard.book_now')}</span>
                    </Link>
                </div>
            </div>

            {/* Phone Number Reminder Banner */}
            <PhoneNumberReminderBanner user={user} />

            {/* Telegram Bot Connection Reminder */}
            {!user?.telegram_chat_id && (
                <div className="relative overflow-hidden rounded-3xl border border-sky-200/90 bg-gradient-to-r from-sky-50 via-white to-blue-50/60 p-5 shadow-sm transition-all duration-200 sm:p-6 dark:border-sky-500/20 dark:from-[#091334] dark:via-[#0d1b3e] dark:to-[#091334]">
                    <div className="pointer-events-none absolute -top-12 -right-12 h-32 w-32 rounded-full bg-sky-200/30 blur-2xl dark:bg-sky-500/10"></div>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-start gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#2AABEE] text-white shadow-md shadow-sky-300/50 dark:shadow-none">
                                <Send className="h-6 w-6" />
                            </div>
                            <div className="space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <h3 className="text-base font-bold text-gray-900 dark:text-white">
                                        {t('dashboard.telegram_reminder_title')}
                                    </h3>
                                    <span className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-100/90 px-2.5 py-0.5 text-xs font-bold text-sky-800 dark:border-sky-500/30 dark:bg-sky-950/60 dark:text-sky-300">
                                        <span className="h-1.5 w-1.5 rounded-full bg-sky-500 animate-pulse" />
                                        {t('dashboard.telegram_recommended_badge')}
                                    </span>
                                </div>
                                <p className="max-w-2xl text-xs leading-relaxed text-gray-600 dark:text-slate-300 sm:text-sm">
                                    {t('dashboard.telegram_reminder_desc')}
                                </p>
                            </div>
                        </div>

                        <div className="flex shrink-0 flex-wrap items-center gap-2 sm:gap-3">
                            <button
                                type="button"
                                onClick={handleConnectTelegram}
                                disabled={isConnectingTelegram}
                                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[#2AABEE] px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-sky-400/20 transition-all hover:bg-[#229ED9] hover:shadow-lg active:scale-95 disabled:opacity-50 sm:text-sm"
                            >
                                {isConnectingTelegram ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Send className="h-4 w-4" />
                                )}
                                <span>{t('dashboard.connect_telegram_btn')}</span>
                                <ExternalLink className="h-3.5 w-3.5 opacity-80" />
                            </button>
                            <Link
                                href="/settings/profile#telegram"
                                className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-2xl border border-gray-200 bg-white px-3.5 py-2.5 text-xs font-bold text-gray-700 shadow-sm transition-all hover:bg-gray-50 active:scale-95 dark:border-white/10 dark:bg-card dark:text-white dark:hover:bg-white/5 sm:text-sm"
                            >
                                <span>{t('dashboard.telegram_settings_btn')}</span>
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            {/* Stats Cards Grid */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                {/* Jami gapirish vaqti */}
                <div className="group shadow-ambient hover:shadow-ambient-md relative overflow-hidden rounded-3xl bg-white p-6 transition duration-200 dark:border dark:border-white/10 dark:bg-card">
                    <div className="absolute top-0 left-0 h-full w-2 bg-emerald-500"></div>
                    <div className="flex items-start justify-between">
                        <div className="space-y-2">
                            <p className="text-sm font-semibold tracking-wider text-[#45464f] uppercase dark:text-slate-400">
                                {t('dashboard.speaking_sessions') ||
                                    'TOTAL SPEAKING SESSIONS'}
                            </p>
                            <div className="flex items-baseline space-x-2">
                                <span className="text-4xl font-extrabold tracking-tight text-[#1b1b1f] dark:text-white">
                                    {stats.speaking_sessions || 0}
                                </span>
                                <span className="text-sm font-semibold text-[#45464f] dark:text-slate-400">
                                    {t('dashboard.sessions_unit') || 'sessions'}
                                </span>
                            </div>
                        </div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-500 transition duration-200 group-hover:scale-110 dark:bg-emerald-950/50 dark:text-emerald-400">
                            <Clock className="h-5 w-5" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center space-x-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                        <TrendingUp className="h-3.5 w-3.5" />
                        <span>{t('dashboard.practice_perfect')}</span>
                    </div>
                </div>

                {/* Kelgusi darslar */}
                <div className="group shadow-ambient hover:shadow-ambient-md relative overflow-hidden rounded-3xl bg-white p-6 transition duration-200 dark:border dark:border-white/10 dark:bg-card">
                    <div className="absolute top-0 left-0 h-full w-2 bg-[#061445] dark:bg-brand-yellow"></div>
                    <div className="flex items-start justify-between">
                        <div className="space-y-2">
                            <p className="text-sm font-semibold tracking-wider text-[#45464f] uppercase dark:text-slate-400">
                                {t('dashboard.upcoming_sessions')}
                            </p>
                            <div className="flex items-baseline space-x-2">
                                <span className="text-4xl font-extrabold tracking-tight text-[#1b1b1f] dark:text-white">
                                    {stats.upcoming_sessions || 0}
                                </span>
                                <span className="text-sm font-semibold text-[#45464f] dark:text-slate-400">
                                    {t('dashboard.sessions_unit')}
                                </span>
                            </div>
                        </div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#d0e4ff] text-[#061445] transition duration-200 group-hover:scale-110 dark:bg-brand-yellow/15 dark:text-brand-yellow">
                            <Calendar className="h-5 w-5" />
                        </div>
                    </div>
                    <div className="mt-4 text-xs font-medium text-[#45464f] dark:text-slate-400">
                        {t('dashboard.book_more')}
                    </div>
                </div>

                {/* O'rtacha baho */}
                <div className="group shadow-ambient hover:shadow-ambient-md relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-50/60 to-orange-50/40 p-6 transition duration-200 dark:border dark:border-amber-500/20 dark:from-[#1b1508] dark:to-[#161208]">
                    <div className="absolute top-0 left-0 h-full w-2 bg-amber-500"></div>
                    <div className="flex items-start justify-between">
                        <div className="space-y-2">
                            <p className="text-sm font-semibold tracking-wider text-amber-800/80 uppercase dark:text-amber-300/90">
                                {t('dashboard.avg_rating')}
                            </p>
                            <div className="flex items-baseline space-x-1">
                                <span className="text-4xl font-extrabold tracking-tight text-amber-600 dark:text-amber-400">
                                    {stats.average_rating || '5.0'}
                                </span>
                                <span className="text-xl font-medium text-slate-400 dark:text-slate-500">
                                    /10
                                </span>
                            </div>
                        </div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500 text-white shadow-md shadow-amber-200 transition duration-200 group-hover:scale-110 dark:shadow-none">
                            <Star className="h-5 w-5 fill-current text-white" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center space-x-1.5 text-xs font-bold text-amber-700 dark:text-amber-300">
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>{t('dashboard.rating_desc')}</span>
                    </div>
                </div>
            </div>

            {/* Active Packs & Upcoming Sessions Sections */}
            {(() => {
                const activePacksSection = activePackages && activePackages.length > 0 ? (
                    <div className="shadow-ambient rounded-3xl bg-white p-6 md:p-8 dark:border dark:border-white/10 dark:bg-card">
                        <div className="mb-6 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                            <div>
                                <h2 className="flex items-center space-x-2 text-lg font-bold tracking-tight text-[#1b1b1f] dark:text-white">
                                    <span className="inline-block h-5 w-2.5 rounded-sm bg-emerald-600"></span>
                                    <span>{t('packages.active_packs_title') || 'Active Conversation Packs'}</span>
                                </h2>
                                <p className="mt-1 text-xs text-[#6B7394] dark:text-slate-400">
                                    {t('packages.total_available_balance') || 'Total Available Balance'}:{' '}
                                    <span className="font-bold text-emerald-700 dark:text-emerald-400">
                                        {formatDuration(
                                            activePackages.reduce((acc: number, p: any) => acc + (p.remaining_minutes || 0), 0),
                                            locale
                                        )}
                                    </span>
                                </p>
                            </div>
                            <span className="inline-flex items-center gap-1.5 self-start rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200 dark:border-emerald-500/30 dark:bg-emerald-950/60 dark:text-emerald-300">
                                <Package className="h-3.5 w-3.5" />
                                {activePackages.length === 1
                                    ? t('packages.hour_remaining_across_packs', {
                                          hours: formatDuration(activePackages[0].remaining_minutes, locale),
                                          count: 1,
                                      }) || `${formatDuration(activePackages[0].remaining_minutes, locale)} left`
                                    : `${activePackages.length} active packs`}
                            </span>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {activePackages.map((pack: any) => {
                                const teacher = pack.teacher;
                                const teacherName = teacher?.full_name || 'Teacher';
                                const packHoursTotal = Math.round((pack.total_minutes || 0) / 60);
                                const packHoursLeft = formatDuration(pack.remaining_minutes, locale);
                                const percentLeft = pack.total_minutes > 0
                                    ? Math.min(100, Math.max(0, Math.round((pack.remaining_minutes / pack.total_minutes) * 100)))
                                    : 0;

                                return (
                                    <div
                                        key={pack.id}
                                        className="flex flex-col justify-between rounded-2xl border border-emerald-100 bg-[#FAFBFD] p-4 transition-all hover:border-emerald-300 hover:bg-white hover:shadow-md dark:border-white/10 dark:bg-[#070e24] dark:hover:border-emerald-500/30 dark:hover:bg-[#0a1638]"
                                    >
                                        <div>
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-emerald-100 text-emerald-700 font-bold dark:bg-emerald-950 dark:text-emerald-300">
                                                    {teacher?.avatar ? (
                                                        <img
                                                            src={teacher.avatar}
                                                            alt={teacherName}
                                                            className="h-full w-full object-cover"
                                                        />
                                                    ) : (
                                                        teacherName.charAt(0)
                                                    )}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <h4 className="truncate text-sm font-bold text-[#1E2A5A] dark:text-white">
                                                        {teacherName}
                                                    </h4>
                                                    <p className="truncate text-xs font-medium text-[#6B7394] dark:text-slate-400">
                                                        {pack.package_title}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="mt-4 space-y-1.5">
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="font-semibold text-emerald-900 dark:text-emerald-300">
                                                        {packHoursLeft} left
                                                    </span>
                                                    <span className="text-[11px] text-[#6B7394] dark:text-slate-400">
                                                        of {packHoursTotal}h total
                                                    </span>
                                                </div>
                                                <div className="h-2 w-full overflow-hidden rounded-full bg-emerald-100 dark:bg-emerald-950">
                                                    <div
                                                        className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                                                        style={{ width: `${percentLeft}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-4 pt-3 border-t border-emerald-50 dark:border-white/10">
                                            <Link
                                                href={`/pupil/teachers/${pack.teacher_id}`}
                                                className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white shadow-xs transition-all hover:bg-emerald-700 active:scale-98"
                                            >
                                                <span>{t('packages.book_with_teacher', { name: teacherName }) || `Book with ${teacherName}`}</span>
                                                <ChevronRight className="h-3.5 w-3.5" />
                                            </Link>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ) : null;

                const upcomingSessionsSection = (
                    <div className="shadow-ambient rounded-3xl bg-white p-6 md:p-10 dark:border dark:border-white/10 dark:bg-card">
                        <h2 className="mb-6 flex items-center space-x-2 text-lg font-bold tracking-tight text-[#1b1b1f] dark:text-white">
                            <span className="inline-block h-5 w-2.5 rounded-sm bg-[#061445] dark:bg-brand-yellow"></span>
                            <span>{t('dashboard.upcoming_sessions')}</span>
                        </h2>

                        {appointments.length > 0 ? (
                            <div className="flex flex-col gap-5">
                                {appointments.map((apt) => (
                                    <div
                                        key={apt.id}
                                        className="group hover:shadow-ambient-md overflow-hidden rounded-3xl border border-[#c6c5d0]/35 bg-white shadow-sm transition-all duration-300 hover:border-[#061445]/20 dark:border-white/10 dark:bg-[#070e24] dark:hover:border-white/20"
                                    >
                                        <div className="flex flex-col justify-between gap-4 border-b border-[#c6c5d0]/35 p-6 sm:flex-row sm:items-center dark:border-white/10">
                                            <div className="flex items-center gap-4">
                                                {apt.teacher ? (
                                                    <Link
                                                        href={`/profile/${apt.teacher.id}`}
                                                        className="shrink-0"
                                                    >
                                                        <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-[#d0e4ff] text-[#061445] transition-transform group-hover:scale-105 dark:bg-brand-yellow/15 dark:text-brand-yellow">
                                                            {apt.teacher?.avatar ? (
                                                                <img
                                                                    src={
                                                                        apt.teacher
                                                                            .avatar
                                                                    }
                                                                    className="h-full w-full object-cover"
                                                                    alt="avatar"
                                                                />
                                                            ) : (
                                                                <Mic className="h-6 w-6" />
                                                            )}
                                                        </div>
                                                    </Link>
                                                ) : (
                                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#d0e4ff] text-[#061445] dark:bg-brand-yellow/15 dark:text-brand-yellow">
                                                        <Mic className="h-6 w-6" />
                                                    </div>
                                                )}
                                                <div>
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <h4 className="text-base font-bold text-[#1b1b1f] dark:text-white">
                                                            {t(
                                                                'dashboard.speaking_practice',
                                                            )}
                                                        </h4>
                                                        {apt.status === 'accepted' && (
                                                            <span className="rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-[10px] font-black tracking-wider text-amber-800 uppercase dark:border-amber-500/30 dark:bg-amber-950/60 dark:text-amber-300">
                                                                {t('bookings.status_accepted')}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm font-medium text-[#45464f] dark:text-muted-foreground">
                                                        {(() => {
                                                            const textWithPlaceholder =
                                                                t(
                                                                    'dashboard.with_teacher',
                                                                    {
                                                                        name: '__NAME__',
                                                                    },
                                                                );
                                                            const parts =
                                                                textWithPlaceholder.split(
                                                                    '__NAME__',
                                                                );
                                                            const teacherLink =
                                                                apt.teacher ? (
                                                                    <Link
                                                                        href={`/profile/${apt.teacher.id}`}
                                                                        className="font-bold text-[#061445] dark:text-brand-yellow hover:underline"
                                                                    >
                                                                        {
                                                                            apt
                                                                                .teacher
                                                                                .full_name
                                                                        }
                                                                    </Link>
                                                                ) : null;

                                                            return (
                                                                <>
                                                                    {parts[0]}
                                                                    {teacherLink}
                                                                    {parts[1] ||
                                                                        ''}
                                                                </>
                                                            );
                                                        })()}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex flex-col sm:text-right">
                                                <span className="font-bold text-[#061445] dark:text-white">
                                                    {new Date(
                                                        apt.start_at,
                                                    ).toLocaleDateString(locale, {
                                                        month: 'long',
                                                        day: 'numeric',
                                                        year: 'numeric',
                                                    })}
                                                </span>
                                                <span className="mt-0.5 text-xs font-semibold text-[#45464f] dark:text-slate-400">
                                                    {new Date(
                                                        apt.start_at,
                                                    ).toLocaleTimeString(locale, {
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}{' '}
                                                    -{' '}
                                                    {new Date(
                                                        apt.end_at,
                                                    ).toLocaleTimeString(locale, {
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-end gap-3 bg-brand-lightblue/20 px-6 py-4 dark:bg-white/5">
                                            {apt.status === 'accepted' ? (
                                                <>
                                                    <span className="mr-auto text-xs font-bold text-amber-800 dark:text-amber-300">
                                                        {t('dashboard.awaiting_payment_desc') ||
                                                            'Awaiting payment & admin confirmation'}
                                                    </span>
                                                    <button
                                                        onClick={() =>
                                                            setPaymentBooking(apt)
                                                        }
                                                        className="flex animate-pulse cursor-pointer items-center gap-2 rounded-full bg-brand-button px-4 py-2.5 text-xs font-bold text-brand-brown shadow-md shadow-brand-button/20 transition-all hover:-translate-y-0.5 hover:bg-brand-button-hover dark:bg-brand-yellow dark:text-[#061445]"
                                                    >
                                                        💳{' '}
                                                        {t('booking.pay_now') ||
                                                            'Pay Now'}
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            handleCancel(apt.id)
                                                        }
                                                        className="cursor-pointer rounded-full border border-destructive/20 px-4 py-2.5 text-xs font-bold text-destructive transition-all hover:bg-destructive hover:text-white"
                                                    >
                                                        {t('dashboard.cancel_button')}
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button
                                                        onClick={() =>
                                                            handleCancel(apt.id)
                                                        }
                                                        className="cursor-pointer rounded-full border border-destructive/20 px-4 py-2.5 text-xs font-bold text-destructive transition-all hover:bg-destructive hover:text-white"
                                                    >
                                                        {t('dashboard.cancel_button')}
                                                    </button>
                                                    <PupilMeetingButton
                                                        apt={apt}
                                                        handleJoin={handleJoin}
                                                    />
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="mx-auto flex max-w-md flex-col items-center space-y-5 px-4 py-8 text-center">
                                <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-[#d0e4ff] text-4xl shadow-inner dark:bg-white/10">
                                    🎙️
                                    <div className="absolute -right-1 -bottom-1 flex h-8 w-8 animate-bounce items-center justify-center rounded-full bg-amber-400 text-sm shadow-sm">
                                        ✨
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <h3 className="text-xl font-bold text-[#1b1b1f] dark:text-white">
                                        {t('dashboard.no_upcoming')}
                                    </h3>
                                    <p className="text-sm leading-relaxed text-[#45464f] dark:text-slate-400">
                                        {t('dashboard.no_upcoming_sub')}
                                    </p>
                                </div>

                                <Link
                                    href="/pupil/teachers"
                                    className="block rounded-full bg-[#061445] px-6 py-3 text-center font-bold text-white shadow-md shadow-[#061445]/10 transition-all duration-150 hover:scale-[1.01] hover:bg-[#061445]/90 active:scale-[0.99] dark:bg-brand-yellow dark:text-[#061445] dark:hover:bg-brand-yellow/90"
                                >
                                    {t('dashboard.book_now')}
                                </Link>
                            </div>
                        )}
                    </div>
                );

                return (
                    <>
                        {activePacksSection}
                        {upcomingSessionsSection}
                    </>
                );
            })()}

            {/* Payment Modal */}
            <PaymentModal
                isOpen={!!paymentBooking}
                onClose={() => setPaymentBooking(null)}
                appointmentId={paymentBooking?.id}
                itemTitle={paymentBooking?.title || t('overview.single_session') || 'Speaking Session'}
                amount={paymentBooking?.price || paymentBooking?.hourly_rate}
                teacherName={paymentBooking?.teacher?.full_name || paymentBooking?.teacher?.name}
                pupilId={user.short_id || user.id.substring(0, 8).toUpperCase()}
                pupilName={user.full_name}
            />
        </div>
    );
}

function TeacherDashboard({
    user,
    appointments = [],
    stats = {},
}: {
    user: any;
    appointments?: any[];
    stats?: any;
}) {
    const [startingAptId, setStartingAptId] = useState<string | null>(null);
    const { auth } = usePage<any>().props;
    const { t, locale } = useTranslation();
    const pendingCount = auth.pending_requests_count || 0;

    useEffect(() => {
        if (!user) return;

        const channel = window.Echo.private(`teacher.${user.id}`);

        channel.listen('.booking.updated', (e: any) => {
            router.reload();
        });
        channel.listen('.ConversationBooked', (e: any) => {
            toast.info(
                t('dashboard.new_booking_toast') ||
                    `A new session has been booked!`,
            );
            router.reload();
        });

        return () => {
            channel.stopListening('.booking.updated');
            channel.stopListening('.ConversationBooked');
        };
    }, [user.id]);

    const handleCancel = async (id: string) => {
        const reason = prompt(
            t('dashboard.cancel_reason_prompt') ||
                'Please enter the reason for cancellation (minimum 3 characters):',
        );
        if (reason === null) {
            return;
        }
        const trimmedReason = reason.trim();
        if (trimmedReason.length < 3) {
            toast.error(
                t('dashboard.cancel_reason_min_length') ||
                    'Cancellation reason must be at least 3 characters.',
            );
            return;
        }
        try {
            await axios.delete(`/bookings/${id}`, {
                data: { reason: trimmedReason },
            });
            toast.success(t('dashboard.cancel_conversation_success'));
            router.reload();
        } catch (error: any) {
            toast.error(
                error.response?.data?.message ||
                    t('dashboard.cancel_conversation_error'),
            );
        }
    };

    const handleStart = async (apt: any) => {
        setStartingAptId(apt.id);
        try {
            const response = await axios.post(
                `/teacher/appointments/${apt.id}/start`,
            );
            toast.success(t('dashboard.start_conversation_success'));
            if (response.data.google_meet_link) {
                window.open(response.data.google_meet_link, '_blank');
            }
            router.reload({ only: ['appointments', 'stats'] });
        } catch (error: any) {
            if (error.response?.data?.requires_google_calendar) {
                toast.error(
                    error.response.data.message ||
                        'Google Calendar connection required to generate Google Meet links.',
                    {
                        action: {
                            label: t('dashboard.connect_google') || 'Connect Google',
                            onClick: () => {
                                window.location.href = '/auth/google?calendar=1';
                            },
                        },
                        duration: 10000,
                    },
                );
            } else {
                toast.error(
                    error.response?.data?.message ||
                        t('dashboard.start_conversation_error'),
                );
            }
        } finally {
            setStartingAptId(null);
        }
    };

    return (
        <div className="flex h-full flex-1 flex-col gap-8 p-4 md:p-8">
            {/* Header Banner */}
            <div className="relative flex flex-col justify-between gap-6 overflow-hidden rounded-3xl bg-brand-navy p-6 text-white shadow-xl shadow-brand-navy/10 md:p-8 lg:flex-row lg:items-center dark:border dark:border-white/10 dark:bg-gradient-to-r dark:from-[#091334] dark:to-[#0d1b3e]">
                <div className="pointer-events-none absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-white/10 blur-2xl"></div>
                <div className="pointer-events-none absolute -top-12 right-1/3 h-36 w-36 rounded-full bg-[#fae18e]/10 blur-xl"></div>

                <div className="z-10 flex items-center space-x-4 md:space-x-6">
                    <div className="relative">
                        <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border-2 border-[#fae18e] bg-white/10 text-2xl shadow-inner backdrop-blur-md md:h-20 md:w-20 md:text-3xl">
                            {user.avatar ? (
                                <img
                                    src={user.avatar}
                                    className="h-full w-full object-cover"
                                    alt="avatar"
                                />
                            ) : (
                                <span>👨‍🏫</span>
                            )}
                        </div>
                        <span className="absolute -right-1 -bottom-1 rounded-full bg-[#fae18e] px-2 py-0.5 text-[10px] font-bold text-[#061445] shadow-sm">
                            PRO
                        </span>
                    </div>
                    <div>
                        <span className="rounded-full bg-white/20 px-2.5 py-1 text-xs font-semibold tracking-wider text-white uppercase backdrop-blur-sm">
                            {t('dashboard.teacher_title')}
                        </span>
                        <h1 className="mt-2 text-2xl font-extrabold tracking-tight md:text-3xl">
                            {t('dashboard.welcome_back', {
                                name: user.full_name || user.name,
                            })}{' '}
                            🌟
                        </h1>
                        <p className="mt-1 text-sm font-medium text-brand-yellow/80 opacity-90 md:text-base">
                            {t('dashboard.teacher_subtitle')}
                        </p>
                    </div>
                </div>

                <div className="z-10 flex shrink-0 flex-wrap items-center gap-3">
                    <Link
                        href="/teacher/appointments"
                        className="relative flex items-center space-x-2 rounded-full border border-white/20 bg-white/10 px-5 py-3 font-semibold text-white backdrop-blur-sm transition-all duration-200 hover:bg-white/20 active:scale-[0.98]"
                    >
                        <Calendar className="h-4 w-4" />
                        <span>{t('nav.booking_requests')}</span>
                        {pendingCount > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 animate-pulse items-center justify-center rounded-full border border-white bg-rose-500 text-[10px] font-extrabold text-white shadow-sm">
                                {pendingCount}
                            </span>
                        )}
                    </Link>
                    <Link
                        href="/teacher/availability"
                        className="group flex items-center space-x-2 rounded-full bg-white px-5 py-3 font-bold text-[#061445] shadow-md transition-all duration-200 hover:scale-[1.02] hover:bg-brand-yellow/10 active:scale-[0.98] dark:bg-brand-yellow dark:text-[#061445] dark:hover:bg-[#f0d070]"
                    >
                        <Clock className="h-4 w-4 transition-transform group-hover:rotate-45" />
                        <span>{t('dashboard.manage_availability')}</span>
                    </Link>
                </div>
            </div>

            {/* Google Meet status warning */}
            <GoogleCalendarWarningBanner user={user} />

            {/* Phone Number Reminder Banner */}
            <PhoneNumberReminderBanner user={user} />

            {/* Stats grid */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {/* Bugungi darslar */}
                <div className="group shadow-ambient hover:shadow-ambient-md relative overflow-hidden rounded-3xl bg-white p-6 transition duration-200 dark:border dark:border-white/10 dark:bg-card">
                    <div className="absolute top-0 left-0 h-full w-2 bg-[#061445] dark:bg-brand-yellow"></div>
                    <div className="flex items-start justify-between">
                        <div className="space-y-2">
                            <p className="text-sm font-semibold tracking-wider text-[#45464f] uppercase dark:text-slate-400">
                                {t('dashboard.sessions_today')}
                            </p>
                            <div className="flex items-baseline space-x-2">
                                <span className="text-4xl font-extrabold tracking-tight text-[#1b1b1f] dark:text-white">
                                    {stats.sessions_today || 0}
                                </span>
                                <span className="text-sm font-semibold text-[#45464f] dark:text-slate-400">
                                    {t('dashboard.sessions_unit')}
                                </span>
                            </div>
                        </div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#d0e4ff] text-[#061445] transition duration-200 group-hover:scale-110 dark:bg-brand-yellow/15 dark:text-brand-yellow">
                            <Video className="h-5 w-5" />
                        </div>
                    </div>
                    <div className="mt-4 text-xs font-medium text-[#45464f] dark:text-slate-400">
                        {t('dashboard.sessions_today_desc')}
                    </div>
                </div>

                {/* Yakunlangan darslar */}
                <div className="group shadow-ambient hover:shadow-ambient-md relative overflow-hidden rounded-3xl bg-white p-6 transition duration-200 dark:border dark:border-white/10 dark:bg-card">
                    <div className="absolute top-0 left-0 h-full w-2 bg-sky-500"></div>
                    <div className="flex items-start justify-between">
                        <div className="space-y-2">
                            <p className="text-sm font-semibold tracking-wider text-[#45464f] uppercase dark:text-slate-400">
                                {t('dashboard.completed_conversations')}
                            </p>
                            <div className="flex items-baseline space-x-2">
                                <span className="text-4xl font-extrabold tracking-tight text-[#1b1b1f] dark:text-white">
                                    {stats.completed_conversations || 0}
                                </span>
                            </div>
                        </div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-50 text-sky-600 transition duration-200 group-hover:scale-110 dark:bg-sky-950/50 dark:text-sky-400">
                            <CheckCircle2 className="h-5 w-5" />
                        </div>
                    </div>
                    <div className="mt-4 text-xs font-medium text-[#45464f] dark:text-slate-400">
                        {t('dashboard.completed_conversations_desc')}
                    </div>
                </div>

                {/* Jami suhbat vaqti */}
                <div className="group shadow-ambient hover:shadow-ambient-md relative overflow-hidden rounded-3xl bg-white p-6 transition duration-200 dark:border dark:border-white/10 dark:bg-card">
                    <div className="absolute top-0 left-0 h-full w-2 bg-indigo-500"></div>
                    <div className="flex items-start justify-between">
                        <div className="space-y-2">
                            <p className="text-sm font-semibold tracking-wider text-[#45464f] uppercase dark:text-slate-400">
                                {t('dashboard.speaking_time')}
                            </p>
                            <div className="flex items-baseline space-x-2">
                                <span className="text-4xl font-extrabold tracking-tight text-[#1b1b1f] dark:text-white">
                                    {formatSpeakingTime(stats.speaking_time_minutes ?? stats.speaking_time, locale)}
                                </span>
                            </div>
                        </div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition duration-200 group-hover:scale-110 dark:bg-indigo-950/50 dark:text-indigo-400">
                            <Clock className="h-5 w-5" />
                        </div>
                    </div>
                    <div className="mt-4 text-xs font-medium text-[#45464f] dark:text-slate-400">
                        {t('dashboard.speaking_time_desc')}
                    </div>
                </div>

                {/* Jami o'quvchilar */}
                <div className="group shadow-ambient hover:shadow-ambient-md relative overflow-hidden rounded-3xl bg-white p-6 transition duration-200 dark:border dark:border-white/10 dark:bg-card">
                    <div className="absolute top-0 left-0 h-full w-2 bg-emerald-500"></div>
                    <div className="flex items-start justify-between">
                        <div className="space-y-2">
                            <p className="text-sm font-semibold tracking-wider text-[#45464f] uppercase dark:text-slate-400">
                                {t('dashboard.total_pupils')}
                            </p>
                            <div className="flex items-baseline space-x-2">
                                <span className="text-4xl font-extrabold tracking-tight text-[#1b1b1f] dark:text-white">
                                    {stats.total_pupils || 0}
                                </span>
                                <span className="text-sm font-semibold text-[#45464f] dark:text-slate-400">
                                    {t('dashboard.active_unit')}
                                </span>
                            </div>
                        </div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-500 transition duration-200 group-hover:scale-110 dark:bg-emerald-950/50 dark:text-emerald-400">
                            <Users className="h-5 w-5" />
                        </div>
                    </div>
                    <div className="mt-4 text-xs font-medium text-[#45464f] dark:text-slate-400">
                        {t('dashboard.total_pupils_desc')}
                    </div>
                </div>

                {/* Sizning bahoingiz */}
                <div className="group shadow-ambient hover:shadow-ambient-md relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-50/60 to-orange-50/40 p-6 transition duration-200 dark:border dark:border-amber-500/20 dark:from-[#1b1508] dark:to-[#161208]">
                    <div className="absolute top-0 left-0 h-full w-2 bg-amber-500"></div>
                    <div className="flex items-start justify-between">
                        <div className="space-y-2">
                            <p className="text-sm font-semibold tracking-wider text-amber-800/80 uppercase dark:text-amber-300/90">
                                {t('dashboard.your_rating')}
                            </p>
                            <div className="flex items-baseline space-x-1">
                                <span className="text-4xl font-extrabold tracking-tight text-amber-600 dark:text-amber-400">
                                    {stats.average_rating || '5.0'}
                                </span>
                                <span className="text-xl font-medium text-slate-400 dark:text-slate-500">
                                    /10
                                </span>
                            </div>
                        </div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500 text-white shadow-md shadow-amber-200 transition duration-200 group-hover:scale-110 dark:shadow-none">
                            <Star className="h-5 w-5 fill-current text-white" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center space-x-1.5 text-xs font-bold text-amber-700 dark:text-amber-300">
                        <TrendingUp className="h-3.5 w-3.5" />
                        <span>{t('dashboard.your_rating_desc')}</span>
                    </div>
                </div>
            </div>

            {/* Schedule and feedback sections */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Schedule column */}
                <div className="shadow-ambient flex flex-col justify-between rounded-3xl bg-white p-6 md:p-8 dark:border dark:border-white/10 dark:bg-card">
                    <div>
                        <h2 className="mb-6 flex items-center space-x-2 text-lg font-bold tracking-tight text-[#1b1b1f] dark:text-white">
                            <span className="inline-block h-5 w-2.5 rounded-sm bg-[#061445] dark:bg-brand-yellow"></span>
                            <span>{t('dashboard.todays_schedule')}</span>
                        </h2>

                        {appointments.length > 0 ? (
                            <div className="flex flex-col gap-4">
                                {appointments.map((apt) => {
                                    const start = new Date(apt.start_at);
                                    const end = new Date(apt.end_at);
                                    const durationMin = Math.round(
                                        (end.getTime() - start.getTime()) /
                                            60000,
                                    );

                                    return (
                                        <div
                                            key={apt.id}
                                            className="hover:shadow-ambient-md flex items-center gap-4 rounded-3xl border border-[#d0e4ff] bg-[#d0e4ff]/5 p-4 transition-all dark:border-white/10 dark:bg-[#070e24]"
                                        >
                                            <div className="flex flex-col items-center justify-center rounded-2xl border border-[#c6c5d0]/60 bg-white px-3 py-2.5 text-center shadow-sm dark:border-white/10 dark:bg-card">
                                                <span className="text-xs font-bold text-[#061445] uppercase dark:text-white">
                                                    {start.toLocaleTimeString(
                                                        locale,
                                                        {
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                        },
                                                    )}
                                                </span>
                                                <span className="mt-0.5 text-[10px] font-semibold text-muted-foreground">
                                                    {formatDuration(durationMin, locale)}
                                                </span>
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="text-sm font-bold text-[#1b1b1f] dark:text-white">
                                                    {t(
                                                        'dashboard.conversation_practice',
                                                    )}
                                                </h4>
                                                <p className="text-xs font-semibold text-[#45464f] dark:text-muted-foreground">
                                                    {(() => {
                                                        const textWithPlaceholder =
                                                            t(
                                                                'dashboard.with_pupil',
                                                                {
                                                                    name: '__NAME__',
                                                                },
                                                            );
                                                        const parts =
                                                            textWithPlaceholder.split(
                                                                '__NAME__',
                                                            );
                                                        const pupilLink =
                                                            apt.pupil ? (
                                                                <Link
                                                                    href={`/profile/${apt.pupil.id}`}
                                                                    className="font-bold text-[#061445] dark:text-brand-yellow hover:underline"
                                                                >
                                                                    {
                                                                        apt
                                                                            .pupil
                                                                            .full_name
                                                                    }
                                                                </Link>
                                                            ) : (
                                                                'Pupil'
                                                            );

                                                        return (
                                                            <>
                                                                {parts[0]}
                                                                {pupilLink}
                                                                {parts[1] || ''}
                                                            </>
                                                        );
                                                    })()}
                                                </p>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                {apt.status === 'accepted' ? (
                                                    <span className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-[10px] font-black tracking-wider text-amber-800 uppercase dark:border-amber-500/30 dark:bg-amber-950/60 dark:text-amber-300">
                                                        {t('sessions.awaiting_payment')}
                                                    </span>
                                                ) : (
                                                    <TeacherMeetingButton
                                                        apt={apt}
                                                        handleStart={
                                                            handleStart
                                                        }
                                                        startingAptId={
                                                            startingAptId
                                                        }
                                                    />
                                                )}
                                                <button
                                                    onClick={() =>
                                                        handleCancel(apt.id)
                                                    }
                                                    className="cursor-pointer rounded-full border border-destructive/20 px-3 py-2 text-xs font-bold text-destructive transition-all hover:bg-destructive hover:text-white"
                                                >
                                                    {t(
                                                        'dashboard.cancel_button',
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center space-y-4 px-4 py-10 text-center">
                                <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-brand-lightblue/30 bg-brand-lightblue/25 text-3xl text-brand-brown dark:border-white/10 dark:bg-white/10 dark:text-white">
                                    🗓️
                                </div>
                                <div className="space-y-1">
                                    <h4 className="font-bold text-[#1b1b1f] dark:text-white">
                                        {t('dashboard.no_appointments_today')}
                                    </h4>
                                    <p className="mx-auto max-w-xs text-sm text-[#45464f] dark:text-slate-400">
                                        {t(
                                            'dashboard.no_appointments_today_desc',
                                        )}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    <Link
                        href="/teacher/schedule"
                        className="mt-4 block w-full rounded-full border border-brand-lightblue bg-brand-lightblue/30 py-3 text-center font-semibold text-brand-brown transition duration-150 hover:bg-[#d0e4ff]/60 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                    >
                        {t('dashboard.view_calendar')}
                    </Link>
                </div>

                {/* Feedback column */}
                <div className="shadow-ambient flex flex-col justify-between rounded-3xl bg-white p-6 md:p-8 dark:border dark:border-white/10 dark:bg-card">
                    <div>
                        <h2 className="mb-6 flex items-center space-x-2 text-lg font-bold tracking-tight text-[#1b1b1f] dark:text-white">
                            <span className="inline-block h-5 w-2.5 rounded-sm bg-emerald-500"></span>
                            <span>{t('dashboard.pending_feedback')}</span>
                        </h2>

                        <div className="flex flex-col items-center space-y-4 px-4 py-10 text-center">
                            <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-4xl text-emerald-500 shadow-inner dark:bg-emerald-950/50 dark:text-emerald-400">
                                <CheckCircle2 className="h-10 w-10 text-emerald-500 dark:text-emerald-400" />
                                <div className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-amber-400 text-xs shadow-sm">
                                    🎉
                                </div>
                            </div>

                            <div className="space-y-1">
                                <h4 className="text-lg font-extrabold text-emerald-900 dark:text-emerald-300">
                                    {t('dashboard.all_caught_up')}
                                </h4>
                                <p className="mx-auto max-w-xs text-sm font-medium text-emerald-700/70 dark:text-emerald-400/80">
                                    {t('dashboard.all_caught_up_desc')}
                                </p>
                            </div>
                        </div>
                    </div>

                    <Link
                        href="/teacher/sessions"
                        className="mt-4 block w-full rounded-full bg-emerald-600 py-3 text-center font-bold text-white shadow-md shadow-emerald-100 transition duration-150 hover:bg-emerald-700 dark:bg-emerald-600"
                    >
                        {t('dashboard.check_history')}
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default function Dashboard({
    appointments = [],
    stats = {},
    recentFeedback = null,
    activePackages = [],
}: {
    appointments?: any[];
    stats?: any;
    recentFeedback?: any;
    activePackages?: any[];
}) {
    const { auth } = usePage<any>().props;
    const role = (auth.user?.role as string) || 'pupil';
    const { t } = useTranslation();

    return (
        <>
            <Head title={t('nav.dashboard')} />

            {role === 'teacher' ? (
                <TeacherDashboard
                    user={auth.user}
                    appointments={appointments}
                    stats={stats}
                />
            ) : (
                <PupilDashboard
                    user={auth.user}
                    appointments={appointments}
                    stats={stats}
                    recentFeedback={recentFeedback}
                    activePackages={activePackages}
                />
            )}
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [{ title: 'Dashboard', href: '/dashboard' }],
};

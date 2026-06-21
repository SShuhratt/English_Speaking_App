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
} from 'lucide-react';
import { dashboard } from '@/routes';
import type { Auth } from '@/types';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/use-translation';
import AppLayout from '@/layouts/app-layout';

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

    if (!hasStartedTime) {
        return (
            <button
                disabled
                className="flex cursor-not-allowed items-center gap-2 rounded-xl border border-border/50 bg-muted/60 px-4 py-2.5 text-xs font-semibold text-muted-foreground"
            >
                <Clock className="h-3.5 w-3.5" /> {t('meeting.scheduled')}
            </button>
        );
    }

    return (
        <button
            onClick={() => handleJoin(apt)}
            className="flex cursor-pointer items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-500/10 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-500/20"
        >
            <Video className="h-3.5 w-3.5" /> {t('meeting.join')}
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
                className="flex cursor-not-allowed items-center gap-2 rounded-xl border border-border/50 bg-muted/60 px-4 py-2.5 text-xs font-semibold text-muted-foreground"
            >
                <Clock className="h-3.5 w-3.5" /> {t('meeting.scheduled')}
            </button>
        );
    }

    return (
        <button
            disabled={startingAptId === apt.id}
            onClick={() => handleStart(apt)}
            className="flex cursor-pointer items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-500/10 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-500/20 disabled:opacity-50"
        >
            <Video className="h-3.5 w-3.5" />
            {startingAptId === apt.id
                ? t('meeting.starting')
                : apt.google_meet_link
                  ? t('meeting.join')
                  : t('meeting.start')}
        </button>
    );
}

function PupilDashboard({
    user,
    appointments = [],
    stats = {},
    recentFeedback = null,
}: {
    user: any;
    appointments?: any[];
    stats?: any;
    recentFeedback?: any;
}) {
    const { t, locale } = useTranslation();

    useEffect(() => {
        if (!user) return;

        const channel = window.Echo.channel(`pupil.${user.id}`);

        channel.listen('.booking.updated', (e: any) => {
            toast.info(`Booking status updated: ${e.appointment.status}`);
            router.reload();
        });

        return () => {
            channel.stopListening('.booking.updated');
        };
    }, [user.id]);

    const handleCancel = async (id: string) => {
        if (!confirm(t('dashboard.cancel_booking_confirm'))) return;
        try {
            await axios.delete(`/bookings/${id}`);
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
            window.open(response.data.google_meet_link, '_blank');
        } catch (error: any) {
            toast.error(
                error.response?.data?.message || t('meeting.not_ready'),
            );
        }
    };

    return (
        <div className="flex h-full flex-1 flex-col gap-8 p-4 md:p-8">
            {/* Header / Welcome Back Banner */}
            <div className="relative flex flex-col justify-between gap-6 overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-purple-600 to-violet-700 p-6 text-white shadow-xl shadow-indigo-100 md:flex-row md:items-center md:p-8 dark:shadow-none">
                <div className="pointer-events-none absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/10 blur-2xl"></div>
                <div className="pointer-events-none absolute right-1/4 -bottom-10 h-32 w-32 rounded-full bg-purple-500/20 blur-xl"></div>

                <div className="z-10 flex items-center space-x-4 md:space-x-6">
                    <div className="relative">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-white/40 bg-white/20 text-3xl font-bold shadow-inner backdrop-blur-md md:h-20 md:w-20">
                            👤
                        </div>
                        <span className="absolute -right-1 -bottom-1 rounded-full border-2 border-indigo-600 bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                            {t('dashboard.level', { level: 3 })}
                        </span>
                    </div>
                    <div>
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-white/20 px-2.5 py-1 text-xs font-semibold tracking-wider text-white uppercase backdrop-blur-sm">
                                {t('welcome.badge')}
                            </span>
                            <div className="flex animate-pulse items-center space-x-1.5 rounded-full border border-orange-500/30 bg-orange-500/20 px-3 py-1 text-xs font-bold text-orange-200 shadow-sm">
                                <span>
                                    {t('dashboard.streak', { count: 5 })}
                                </span>
                            </div>
                        </div>
                        <h1 className="mt-2 text-2xl font-extrabold tracking-tight md:text-3xl">
                            {t('dashboard.welcome_back', {
                                name: user.full_name || user.name,
                            })}{' '}
                            👋
                        </h1>
                        <p className="mt-1 text-sm font-medium text-indigo-100 opacity-90 md:text-base">
                            {t('dashboard.learning_journey_desc')}
                        </p>
                    </div>
                </div>

                <Link
                    href="/pupil/teachers"
                    className="group z-10 flex shrink-0 items-center justify-center space-x-2 rounded-xl bg-white px-6 py-3.5 font-bold text-indigo-700 shadow-md transition-all duration-200 hover:scale-[1.02] hover:bg-indigo-50 active:scale-[0.98]"
                >
                    <Calendar className="h-4 w-4 transition-transform group-hover:rotate-12" />
                    <span>{t('dashboard.book_now')}</span>
                </Link>
            </div>

            {/* Stats Cards Grid */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                {/* Jami gapirish vaqti */}
                <div className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition duration-200 hover:shadow-md dark:border-border dark:bg-card">
                    <div className="absolute top-0 left-0 h-full w-2 bg-emerald-500"></div>
                    <div className="flex items-start justify-between">
                        <div className="space-y-2">
                            <p className="text-sm font-semibold tracking-wider text-slate-500 uppercase dark:text-muted-foreground">
                                {t('dashboard.speaking_hours')}
                            </p>
                            <div className="flex items-baseline space-x-2">
                                <span className="text-4xl font-extrabold tracking-tight text-slate-800 dark:text-foreground">
                                    {stats.speaking_hours || 0}
                                </span>
                                <span className="text-sm font-semibold text-slate-500">
                                    {t('dashboard.hours_unit')}
                                </span>
                            </div>
                        </div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-500 transition duration-200 group-hover:scale-110 dark:bg-emerald-950/40">
                            <Clock className="h-5 w-5" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center space-x-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-500">
                        <TrendingUp className="h-3.5 w-3.5" />
                        <span>{t('dashboard.practice_perfect')}</span>
                    </div>
                </div>

                {/* Kelgusi darslar */}
                <div className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition duration-200 hover:shadow-md dark:border-border dark:bg-card">
                    <div className="absolute top-0 left-0 h-full w-2 bg-indigo-500"></div>
                    <div className="flex items-start justify-between">
                        <div className="space-y-2">
                            <p className="text-sm font-semibold tracking-wider text-slate-500 uppercase dark:text-muted-foreground">
                                {t('dashboard.upcoming_sessions')}
                            </p>
                            <div className="flex items-baseline space-x-2">
                                <span className="text-4xl font-extrabold tracking-tight text-slate-800 dark:text-foreground">
                                    {stats.upcoming_sessions || 0}
                                </span>
                                <span className="text-sm font-semibold text-slate-500">
                                    {t('dashboard.sessions_unit')}
                                </span>
                            </div>
                        </div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-500 transition duration-200 group-hover:scale-110 dark:bg-indigo-950/40">
                            <Calendar className="h-5 w-5" />
                        </div>
                    </div>
                    <div className="mt-4 text-xs font-medium text-slate-500 dark:text-muted-foreground">
                        {t('dashboard.book_more')}
                    </div>
                </div>

                {/* O'rtacha baho */}
                <div className="group relative overflow-hidden rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50/60 to-orange-50/40 p-6 shadow-sm transition duration-200 hover:shadow-md dark:border-amber-950/20 dark:from-amber-950/10 dark:to-orange-950/10">
                    <div className="absolute top-0 left-0 h-full w-2 bg-amber-500"></div>
                    <div className="flex items-start justify-between">
                        <div className="space-y-2">
                            <p className="text-sm font-semibold tracking-wider text-amber-800/80 uppercase dark:text-amber-400">
                                {t('dashboard.avg_rating')}
                            </p>
                            <div className="flex items-baseline space-x-1">
                                <span className="text-4xl font-extrabold tracking-tight text-amber-600 dark:text-amber-500">
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
                    <div className="mt-4 flex items-center space-x-1.5 text-xs font-bold text-amber-700 dark:text-amber-500">
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>{t('dashboard.rating_desc')}</span>
                    </div>
                </div>
            </div>

            {/* Upcoming Sessions List */}
            <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm md:p-10 dark:border-border dark:bg-card">
                <h2 className="mb-6 flex items-center space-x-2 text-lg font-bold tracking-tight text-slate-800 dark:text-foreground">
                    <span className="inline-block h-5 w-2.5 rounded-sm bg-indigo-600"></span>
                    <span>{t('dashboard.upcoming_sessions')}</span>
                </h2>

                {appointments.length > 0 ? (
                    <div className="flex flex-col gap-5">
                        {appointments.map((apt) => (
                            <div
                                key={apt.id}
                                className="group overflow-hidden rounded-3xl border border-border bg-card shadow-sm transition-all duration-300 hover:border-indigo-500/20 hover:shadow-md"
                            >
                                <div className="flex flex-col justify-between gap-4 border-b border-border/60 p-6 sm:flex-row sm:items-center">
                                    <div className="flex items-center gap-4">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 transition-transform group-hover:scale-105 dark:bg-indigo-950/40 dark:text-indigo-400">
                                            <Mic className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <h4 className="text-base font-bold">
                                                {t(
                                                    'dashboard.speaking_practice',
                                                )}
                                            </h4>
                                            <p className="text-sm font-medium text-muted-foreground">
                                                {t('dashboard.with_teacher', {
                                                    name:
                                                        apt.teacher
                                                            ?.full_name || '',
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col sm:text-right">
                                        <span className="font-bold text-indigo-600 dark:text-indigo-400">
                                            {new Date(
                                                apt.start_at,
                                            ).toLocaleDateString(locale, {
                                                month: 'long',
                                                day: 'numeric',
                                                year: 'numeric',
                                            })}
                                        </span>
                                        <span className="mt-0.5 text-xs font-semibold text-muted-foreground">
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
                                <div className="flex items-center justify-end gap-3 bg-muted/30 px-6 py-4">
                                    <button
                                        onClick={() => handleCancel(apt.id)}
                                        className="cursor-pointer rounded-xl border border-destructive/20 px-4 py-2.5 text-xs font-bold text-destructive transition-all hover:bg-destructive hover:text-white"
                                    >
                                        {t('dashboard.cancel_button')}
                                    </button>
                                    <PupilMeetingButton
                                        apt={apt}
                                        handleJoin={handleJoin}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="mx-auto flex max-w-md flex-col items-center space-y-5 px-4 py-8 text-center">
                        <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-100 to-violet-100 text-4xl shadow-inner dark:from-indigo-950/40 dark:to-violet-950/40">
                            🎙️
                            <div className="absolute -right-1 -bottom-1 flex h-8 w-8 animate-bounce items-center justify-center rounded-full bg-amber-400 text-sm shadow-sm">
                                ✨
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h3 className="text-xl font-bold text-slate-800 dark:text-foreground">
                                {t('dashboard.no_upcoming')}
                            </h3>
                            <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                                Sizning gapirish amaliyotingiz shu yerda
                                boshlanadi! Keling, birgalikda maqsadlaringiz
                                sari harakat qilamiz va yangi marralarni zabt
                                etamiz.
                            </p>
                        </div>

                        <Link
                            href="/pupil/teachers"
                            className="block rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3 text-center font-bold text-white shadow-md shadow-indigo-100 transition-all duration-150 hover:scale-[1.01] hover:opacity-95 active:scale-[0.99] dark:shadow-none"
                        >
                            Hozir dars band qilish seansi / Book Now
                        </Link>
                    </div>
                )}
            </div>
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

        const channel = window.Echo.channel(`teacher.${user.id}`);

        channel.listen('.booking.updated', (e: any) => {
            router.reload();
        });

        return () => {
            channel.stopListening('.booking.updated');
        };
    }, [user.id]);

    const handleCancel = async (id: string) => {
        if (!confirm(t('dashboard.cancel_conversation_confirm'))) return;
        try {
            await axios.delete(`/bookings/${id}`);
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
        if (apt.google_meet_link) {
            window.open(apt.google_meet_link, '_blank');
            return;
        }

        setStartingAptId(apt.id);
        try {
            const response = await axios.post(
                `/teacher/appointments/${apt.id}/start`,
            );
            toast.success(t('dashboard.start_conversation_success'));
            if (response.data.google_meet_link) {
                window.open(response.data.google_meet_link, '_blank');
            }
            router.reload();
        } catch (error: any) {
            toast.error(
                error.response?.data?.message ||
                    t('dashboard.start_conversation_error'),
            );
        } finally {
            setStartingAptId(null);
        }
    };

    return (
        <div className="flex h-full flex-1 flex-col gap-8 p-4 md:p-8">
            {/* Header Banner */}
            <div className="relative flex flex-col justify-between gap-6 overflow-hidden rounded-3xl bg-gradient-to-r from-sky-600 via-indigo-600 to-purple-700 p-6 text-white shadow-xl shadow-sky-100/40 md:p-8 lg:flex-row lg:items-center dark:shadow-none">
                <div className="pointer-events-none absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-white/10 blur-2xl"></div>
                <div className="pointer-events-none absolute -top-12 right-1/3 h-36 w-36 rounded-full bg-sky-400/20 blur-xl"></div>

                <div className="z-10 flex items-center space-x-4 md:space-x-6">
                    <div className="relative">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-white/40 bg-white/20 text-3xl shadow-inner backdrop-blur-md md:h-20 md:w-20">
                            👨‍🏫
                        </div>
                        <span className="absolute -right-1 -bottom-1 rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-bold text-slate-900 shadow-sm">
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
                        <p className="mt-1 text-sm font-medium text-sky-100 opacity-90 md:text-base">
                            {t('dashboard.teacher_subtitle', { name: '' })
                                .replace(/^\s*,\s*/, '')
                                .trim() ||
                                "Darslaringiz va bo'sh vaqtlarigizni samarali boshqaring."}
                        </p>
                    </div>
                </div>

                <div className="z-10 flex shrink-0 flex-wrap items-center gap-3">
                    <Link
                        href="/teacher/appointments"
                        className="relative flex items-center space-x-2 rounded-xl border border-white/20 bg-white/10 px-5 py-3 font-semibold text-white backdrop-blur-sm transition-all duration-200 hover:bg-white/20 active:scale-[0.98]"
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
                        className="group flex items-center space-x-2 rounded-xl bg-white px-5 py-3 font-bold text-sky-700 shadow-md transition-all duration-200 hover:scale-[1.02] hover:bg-sky-50 active:scale-[0.98]"
                    >
                        <Clock className="h-4 w-4 transition-transform group-hover:rotate-45" />
                        <span>{t('dashboard.manage_availability')}</span>
                    </Link>
                </div>
            </div>

            {/* Google Meet status warning */}
            {!user.google_connected && (
                <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-red-200 bg-red-50/40 p-5 md:flex-row dark:border-red-950/20 dark:bg-red-950/5">
                    <div>
                        <h4 className="font-bold text-red-800 dark:text-red-400">
                            {t('dashboard.google_not_connected')}
                        </h4>
                        <p className="mt-0.5 text-xs text-red-600 dark:text-red-500">
                            {t('dashboard.google_not_connected_desc')}
                        </p>
                    </div>
                    <a
                        href="/auth/google"
                        className="inline-flex items-center justify-center rounded-xl bg-red-600 px-4 py-2.5 text-xs font-bold whitespace-nowrap text-white shadow-sm transition-colors hover:bg-red-700"
                    >
                        {t('dashboard.connect_google')}
                    </a>
                </div>
            )}

            {/* Stats grid */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                {/* Bugungi darslar */}
                <div className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition duration-200 hover:shadow-md dark:border-border dark:bg-card">
                    <div className="absolute top-0 left-0 h-full w-2 bg-indigo-500"></div>
                    <div className="flex items-start justify-between">
                        <div className="space-y-2">
                            <p className="text-sm font-semibold tracking-wider text-slate-500 uppercase dark:text-muted-foreground">
                                {t('dashboard.sessions_today')}
                            </p>
                            <div className="flex items-baseline space-x-2">
                                <span className="text-4xl font-extrabold tracking-tight text-slate-800 dark:text-foreground">
                                    {stats.sessions_today || 0}
                                </span>
                                <span className="text-sm font-semibold text-slate-500">
                                    {t('dashboard.sessions_unit')}
                                </span>
                            </div>
                        </div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-500 transition duration-200 group-hover:scale-110 dark:bg-indigo-950/40">
                            <Video className="h-5 w-5" />
                        </div>
                    </div>
                    <div className="mt-4 text-xs font-medium text-slate-500 dark:text-muted-foreground">
                        {t('dashboard.sessions_today_desc')}
                    </div>
                </div>

                {/* Jami o'quvchilar */}
                <div className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition duration-200 hover:shadow-md dark:border-border dark:bg-card">
                    <div className="absolute top-0 left-0 h-full w-2 bg-emerald-500"></div>
                    <div className="flex items-start justify-between">
                        <div className="space-y-2">
                            <p className="text-sm font-semibold tracking-wider text-slate-500 uppercase dark:text-muted-foreground">
                                {t('dashboard.total_pupils')}
                            </p>
                            <div className="flex items-baseline space-x-2">
                                <span className="text-4xl font-extrabold tracking-tight text-slate-800 dark:text-foreground">
                                    {stats.total_pupils || 0}
                                </span>
                                <span className="text-sm font-semibold text-slate-500">
                                    {t('dashboard.active_unit')}
                                </span>
                            </div>
                        </div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-500 transition duration-200 group-hover:scale-110 dark:bg-emerald-950/40">
                            <Users className="h-5 w-5" />
                        </div>
                    </div>
                    <div className="mt-4 text-xs font-medium text-slate-500 dark:text-muted-foreground">
                        {t('dashboard.total_pupils_desc')}
                    </div>
                </div>

                {/* Sizning bahoingiz */}
                <div className="group relative overflow-hidden rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50/60 to-orange-50/40 p-6 shadow-sm transition duration-200 hover:shadow-md dark:border-amber-950/20 dark:from-amber-950/10 dark:to-orange-950/10">
                    <div className="absolute top-0 left-0 h-full w-2 bg-amber-500"></div>
                    <div className="flex items-start justify-between">
                        <div className="space-y-2">
                            <p className="text-sm font-semibold tracking-wider text-amber-800/80 uppercase dark:text-amber-400">
                                {t('dashboard.your_rating')}
                            </p>
                            <div className="flex items-baseline space-x-1">
                                <span className="dark:text-amber-550 text-4xl font-extrabold tracking-tight text-amber-600">
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
                    <div className="mt-4 flex items-center space-x-1.5 text-xs font-bold text-amber-700 dark:text-amber-500">
                        <TrendingUp className="h-3.5 w-3.5" />
                        <span>{t('dashboard.your_rating_desc')}</span>
                    </div>
                </div>
            </div>

            {/* Schedule and feedback sections */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Schedule column */}
                <div className="flex flex-col justify-between rounded-3xl border border-slate-100 bg-white p-6 shadow-sm md:p-8 dark:border-border dark:bg-card">
                    <div>
                        <h2 className="mb-6 flex items-center space-x-2 text-lg font-bold tracking-tight text-slate-800 dark:text-foreground">
                            <span className="inline-block h-5 w-2.5 rounded-sm bg-sky-600"></span>
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
                                            className="flex items-center gap-4 rounded-2xl border border-indigo-100 bg-indigo-50/10 p-4 transition-all hover:shadow-md dark:border-indigo-950/20 dark:bg-indigo-950/5"
                                        >
                                            <div className="flex flex-col items-center justify-center rounded-xl border border-border/60 bg-white px-3 py-2.5 text-center shadow-sm dark:bg-card">
                                                <span className="text-xs font-bold text-indigo-600 uppercase dark:text-indigo-400">
                                                    {start.toLocaleTimeString(
                                                        locale,
                                                        {
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                        },
                                                    )}
                                                </span>
                                                <span className="mt-0.5 text-[10px] font-semibold text-muted-foreground">
                                                    {durationMin}m
                                                </span>
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="text-sm font-bold">
                                                    {t(
                                                        'dashboard.conversation_practice',
                                                    )}
                                                </h4>
                                                <p className="text-xs font-semibold text-muted-foreground">
                                                    {t('dashboard.with_pupil', {
                                                        name:
                                                            apt.pupil
                                                                ?.full_name ||
                                                            'Pupil',
                                                    })}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() =>
                                                        handleCancel(apt.id)
                                                    }
                                                    className="cursor-pointer rounded-xl border border-destructive/20 px-3 py-2 text-xs font-bold text-destructive transition-all hover:bg-destructive hover:text-white"
                                                >
                                                    {t(
                                                        'dashboard.cancel_button',
                                                    )}
                                                </button>
                                                <TeacherMeetingButton
                                                    apt={apt}
                                                    handleStart={handleStart}
                                                    startingAptId={
                                                        startingAptId
                                                    }
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center space-y-4 px-4 py-10 text-center">
                                <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-slate-100 bg-slate-50 text-3xl text-slate-400 dark:border-border/60 dark:bg-muted">
                                    🗓️
                                </div>
                                <div className="space-y-1">
                                    <h4 className="font-bold text-slate-700 dark:text-slate-200">
                                        {t('dashboard.no_appointments_today')}
                                    </h4>
                                    <p className="mx-auto max-w-xs text-sm text-slate-400">
                                        Bugun uchun tasdiqlangan dars seanslari
                                        hali rejalashtirilmagan / No sessions
                                        scheduled for today.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    <Link
                        href="/teacher/schedule"
                        className="mt-4 block w-full rounded-xl border border-slate-200/80 bg-slate-50 py-3 text-center font-semibold text-slate-700 transition duration-150 hover:bg-slate-100 dark:border-border/60 dark:bg-muted/40 dark:text-slate-300 dark:hover:bg-muted"
                    >
                        Jadval taqvimini ko'rish / View Calendar
                    </Link>
                </div>

                {/* Feedback column */}
                <div className="flex flex-col justify-between rounded-3xl border border-slate-100 bg-gradient-to-br from-white to-emerald-50/20 p-6 shadow-sm md:p-8 dark:border-border dark:from-card dark:to-emerald-950/5">
                    <div>
                        <h2 className="mb-6 flex items-center space-x-2 text-lg font-bold tracking-tight text-slate-800 dark:text-foreground">
                            <span className="inline-block h-5 w-2.5 rounded-sm bg-emerald-500"></span>
                            <span>{t('dashboard.pending_feedback')}</span>
                        </h2>

                        <div className="flex flex-col items-center space-y-4 px-4 py-10 text-center">
                            <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-4xl text-emerald-500 shadow-inner dark:bg-emerald-950/40">
                                <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                                <div className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-amber-400 text-xs shadow-sm">
                                    🎉
                                </div>
                            </div>

                            <div className="space-y-1">
                                <h4 className="text-lg font-extrabold text-emerald-900 dark:text-emerald-400">
                                    {t('dashboard.all_caught_up')}
                                </h4>
                                <p className="dark:text-emerald-450/70 mx-auto max-w-xs text-sm font-medium text-emerald-700/70">
                                    {t('dashboard.all_caught_up_desc')}
                                </p>
                            </div>
                        </div>
                    </div>

                    <Link
                        href="/teacher/sessions"
                        className="mt-4 block w-full rounded-xl bg-emerald-600 py-3 text-center font-bold text-white shadow-md shadow-emerald-100 transition duration-150 hover:bg-emerald-700 dark:shadow-none"
                    >
                        Tarixni tekshirish / Check History
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
}: {
    appointments?: any[];
    stats?: any;
    recentFeedback?: any;
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
                />
            )}
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [{ title: 'Dashboard', href: '/dashboard' }],
};

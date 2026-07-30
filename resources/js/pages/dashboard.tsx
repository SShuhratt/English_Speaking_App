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
                className="flex cursor-not-allowed items-center gap-2 rounded-full border border-brand-lightblue/50 bg-brand-lightblue/35 px-4 py-2.5 text-xs font-semibold text-brand-brown/80"
            >
                <Clock className="h-3.5 w-3.5" /> {t('meeting.scheduled')}
            </button>
        );
    }

    return (
        <button
            onClick={() => handleJoin(apt)}
            className="flex cursor-pointer items-center gap-2 rounded-full bg-[#061445] px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-[#061445]/10 transition-all hover:-translate-y-0.5 hover:shadow-lg"
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
}: {
    user: any;
    appointments?: any[];
    stats?: any;
    recentFeedback?: any;
}) {
    const { t, locale } = useTranslation();
    const [paymentBooking, setPaymentBooking] = useState<any | null>(null);
    const [copiedCard, setCopiedCard] = useState(false);

    const handleCopyCardNumber = (cardNumber: string) => {
        navigator.clipboard.writeText(cardNumber);
        setCopiedCard(true);
        toast.success(t('payment.copied_toast') || 'Card number copied!');
        setTimeout(() => setCopiedCard(false), 2500);
    };

    useEffect(() => {
        if (!user) return;

        const channel = window.Echo.private(`pupil.${user.id}`);

        channel.listen('.booking.updated', (e: any) => {
            toast.info(`Booking status updated: ${e.appointment.status}`);
            router.reload();
        });
        channel.listen('.ConversationApproved', (e: any) => {
            toast.info(t('dashboard.booking_approved_toast') || `Your session has been approved!`);
            router.reload();
        });

        return () => {
            channel.stopListening('.booking.updated');
            channel.stopListening('.ConversationApproved');
        };
    }, [user.id]);

    const handleCancel = async (id: string) => {
        const reason = prompt(t('dashboard.cancel_reason_prompt') || "Please enter the reason for cancellation (minimum 3 characters):");
        if (reason === null) {
            return;
        }
        const trimmedReason = reason.trim();
        if (trimmedReason.length < 3) {
            toast.error(t('dashboard.cancel_reason_min_length') || "Cancellation reason must be at least 3 characters.");
            return;
        }
        try {
            await axios.delete(`/bookings/${id}`, {
                data: { reason: trimmedReason }
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
            <div className="relative flex flex-col justify-between gap-6 overflow-hidden rounded-3xl bg-brand-navy p-6 text-white shadow-xl shadow-brand-navy/10 md:flex-row md:items-center md:p-8">
                <div className="pointer-events-none absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/10 blur-2xl"></div>
                <div className="pointer-events-none absolute right-1/4 -bottom-10 h-32 w-32 rounded-full bg-brand-pale-blue/20 blur-xl"></div>

                <div className="z-10 flex items-center space-x-4 md:space-x-6">
                    <div className="relative">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-white/40 bg-white/20 text-3xl font-bold shadow-inner backdrop-blur-md md:h-20 md:w-20 overflow-hidden">
                            {user.avatar ? (
                                <img src={user.avatar} className="h-full w-full object-cover" alt="avatar" />
                            ) : (
                                <span>👤</span>
                            )}
                        </div>
                        <span className="absolute -right-1 -bottom-1 rounded-full border-2 border-brand-navy bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                            {t('dashboard.level', { level: 3 })}
                        </span>
                    </div>
                    <div>
                        <div className="flex flex-wrap items-center gap-2">
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
                        <p className="mt-1 text-sm font-medium text-brand-yellow/80 opacity-90 md:text-base">
                            {t('dashboard.learning_journey_desc')}
                        </p>
                    </div>
                </div>

                <Link
                    href="/pupil/teachers"
                    className="group z-10 flex shrink-0 items-center justify-center space-x-2 rounded-full bg-white px-6 py-3.5 font-bold text-brand-navy shadow-md transition-all duration-200 hover:scale-[1.02] hover:bg-brand-yellow/10 active:scale-[0.98]"
                >
                    <Calendar className="h-4 w-4 transition-transform group-hover:rotate-12" />
                    <span>{t('dashboard.book_now')}</span>
                </Link>
            </div>

            {/* Stats Cards Grid */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                {/* Jami gapirish vaqti */}
                <div className="group relative overflow-hidden rounded-3xl bg-white p-6 shadow-ambient transition duration-200 hover:shadow-ambient-md">
                    <div className="absolute top-0 left-0 h-full w-2 bg-emerald-500"></div>
                    <div className="flex items-start justify-between">
                        <div className="space-y-2">
                            <p className="text-sm font-semibold tracking-wider text-[#45464f] uppercase">
                                {t('dashboard.speaking_sessions') || 'TOTAL SPEAKING SESSIONS'}
                            </p>
                            <div className="flex items-baseline space-x-2">
                                <span className="text-4xl font-extrabold tracking-tight text-[#1b1b1f]">
                                    {stats.speaking_sessions || 0}
                                </span>
                                <span className="text-sm font-semibold text-[#45464f]">
                                    {t('dashboard.sessions_unit') || 'sessions'}
                                </span>
                            </div>
                        </div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-500 transition duration-200 group-hover:scale-110">
                            <Clock className="h-5 w-5" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center space-x-1.5 text-xs font-medium text-emerald-600">
                        <TrendingUp className="h-3.5 w-3.5" />
                        <span>{t('dashboard.practice_perfect')}</span>
                    </div>
                </div>

                {/* Kelgusi darslar */}
                <div className="group relative overflow-hidden rounded-3xl bg-white p-6 shadow-ambient transition duration-200 hover:shadow-ambient-md">
                    <div className="absolute top-0 left-0 h-full w-2 bg-[#061445]"></div>
                    <div className="flex items-start justify-between">
                        <div className="space-y-2">
                            <p className="text-sm font-semibold tracking-wider text-[#45464f] uppercase">
                                {t('dashboard.upcoming_sessions')}
                            </p>
                            <div className="flex items-baseline space-x-2">
                                <span className="text-4xl font-extrabold tracking-tight text-[#1b1b1f]">
                                    {stats.upcoming_sessions || 0}
                                </span>
                                <span className="text-sm font-semibold text-[#45464f]">
                                    {t('dashboard.sessions_unit')}
                                </span>
                            </div>
                        </div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#d0e4ff] text-[#061445] transition duration-200 group-hover:scale-110">
                            <Calendar className="h-5 w-5" />
                        </div>
                    </div>
                    <div className="mt-4 text-xs font-medium text-[#45464f]">
                        {t('dashboard.book_more')}
                    </div>
                </div>

                {/* O'rtacha baho */}
                <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-50/60 to-orange-50/40 p-6 shadow-ambient transition duration-200 hover:shadow-ambient-md">
                    <div className="absolute top-0 left-0 h-full w-2 bg-amber-500"></div>
                    <div className="flex items-start justify-between">
                        <div className="space-y-2">
                            <p className="text-sm font-semibold tracking-wider text-amber-800/80 uppercase">
                                {t('dashboard.avg_rating')}
                            </p>
                            <div className="flex items-baseline space-x-1">
                                <span className="text-4xl font-extrabold tracking-tight text-amber-600">
                                    {stats.average_rating || '5.0'}
                                </span>
                                <span className="text-xl font-medium text-slate-400">
                                    /10
                                </span>
                            </div>
                        </div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500 text-white shadow-md shadow-amber-200 transition duration-200 group-hover:scale-110">
                            <Star className="h-5 w-5 fill-current text-white" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center space-x-1.5 text-xs font-bold text-amber-700">
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>{t('dashboard.rating_desc')}</span>
                    </div>
                </div>
            </div>

            {/* Upcoming Sessions List */}
            <div className="rounded-3xl bg-white p-6 shadow-ambient md:p-10">
                <h2 className="mb-6 flex items-center space-x-2 text-lg font-bold tracking-tight text-[#1b1b1f]">
                    <span className="inline-block h-5 w-2.5 rounded-sm bg-[#061445]"></span>
                    <span>{t('dashboard.upcoming_sessions')}</span>
                </h2>

                {appointments.length > 0 ? (
                    <div className="flex flex-col gap-5">
                        {appointments.map((apt) => (
                            <div
                                key={apt.id}
                                className="group overflow-hidden rounded-3xl border border-[#c6c5d0]/35 bg-white shadow-sm transition-all duration-300 hover:border-[#061445]/20 hover:shadow-ambient-md"
                            >
                                <div className="flex flex-col justify-between gap-4 border-b border-[#c6c5d0]/35 p-6 sm:flex-row sm:items-center">
                                    <div className="flex items-center gap-4">
                                        {apt.teacher ? (
                                            <Link href={`/profile/${apt.teacher.id}`} className="shrink-0">
                                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#d0e4ff] text-[#061445] transition-transform group-hover:scale-105 overflow-hidden">
                                                    {apt.teacher?.avatar ? (
                                                        <img src={apt.teacher.avatar} className="h-full w-full object-cover" alt="avatar" />
                                                    ) : (
                                                        <Mic className="h-6 w-6" />
                                                    )}
                                                </div>
                                            </Link>
                                        ) : (
                                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#d0e4ff] text-[#061445]">
                                                <Mic className="h-6 w-6" />
                                            </div>
                                        )}
                                        <div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h4 className="text-base font-bold text-[#1b1b1f]">
                                                    {t(
                                                        'dashboard.speaking_practice',
                                                    )}
                                                </h4>
                                                {apt.status === 'accepted' && (
                                                    <span className="rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-[10px] font-black uppercase text-amber-800 tracking-wider">
                                                        STATUS ACCEPTED
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm font-medium text-[#45464f]">
                                                {t('dashboard.with_teacher', { name: '' })}
                                                {apt.teacher ? (
                                                    <Link
                                                        href={`/profile/${apt.teacher.id}`}
                                                        className="font-bold text-[#061445] hover:underline"
                                                    >
                                                        {apt.teacher.full_name}
                                                    </Link>
                                                ) : (
                                                    ''
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col sm:text-right">
                                        <span className="font-bold text-[#061445]">
                                            {new Date(
                                                apt.start_at,
                                            ).toLocaleDateString(locale, {
                                                month: 'long',
                                                day: 'numeric',
                                                year: 'numeric',
                                            })}
                                        </span>
                                        <span className="mt-0.5 text-xs font-semibold text-[#45464f]">
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
                                <div className="flex items-center justify-end gap-3 bg-brand-lightblue/20 px-6 py-4">
                                    {apt.status === 'accepted' ? (
                                        <>
                                            <span className="mr-auto text-xs font-bold text-amber-800">
                                                Awaiting payment & admin confirmation
                                            </span>
                                            <button
                                                onClick={() => setPaymentBooking(apt)}
                                                className="flex cursor-pointer items-center gap-2 rounded-full bg-brand-button hover:bg-brand-button-hover px-4 py-2.5 text-xs font-bold text-brand-brown shadow-md shadow-brand-button/20 transition-all hover:-translate-y-0.5 animate-pulse"
                                            >
                                                💳 {t('booking.pay_now') || 'Pay Now'}
                                            </button>
                                            <button
                                                onClick={() => handleCancel(apt.id)}
                                                className="cursor-pointer rounded-full border border-destructive/20 px-4 py-2.5 text-xs font-bold text-destructive transition-all hover:bg-destructive hover:text-white"
                                            >
                                                {t('dashboard.cancel_button')}
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button
                                                onClick={() => handleCancel(apt.id)}
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
                        <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-[#d0e4ff] text-4xl shadow-inner">
                            🎙️
                            <div className="absolute -right-1 -bottom-1 flex h-8 w-8 animate-bounce items-center justify-center rounded-full bg-amber-400 text-sm shadow-sm">
                                ✨
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h3 className="text-xl font-bold text-[#1b1b1f]">
                                {t('dashboard.no_upcoming')}
                            </h3>
                            <p className="text-sm leading-relaxed text-[#45464f]">
                                {t('dashboard.no_upcoming_sub')}
                            </p>
                        </div>

                        <Link
                            href="/pupil/teachers"
                            className="block rounded-full bg-[#061445] hover:bg-[#061445]/90 px-6 py-3 text-center font-bold text-white shadow-md shadow-[#061445]/10 transition-all duration-150 hover:scale-[1.01] active:scale-[0.99]"
                        >
                            {t('dashboard.book_now')}
                        </Link>
                    </div>
                )}
            </div>

            {/* Payment Modal (Pop-up on Dashboard) */}
            {paymentBooking && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 text-left">
                    <div className="relative flex w-full max-w-lg animate-in flex-col rounded-3xl border border-border bg-white p-6 shadow-2xl duration-150 zoom-in-95">
                        <button
                            onClick={() => setPaymentBooking(null)}
                            className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
                        >
                            <X className="h-4 w-4" />
                        </button>

                        <div className="flex items-center gap-3 border-b pb-4">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-lightblue text-brand-brown">
                                <CreditCard className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-foreground">
                                    {t('payment.modal_title') || 'Payment & Verification'}
                                </h3>
                                <p className="text-xs text-muted-foreground">
                                    {t('payment.modal_desc') || 'Transfer the session fee to the card below and send your receipt in Telegram.'}
                                </p>
                            </div>
                        </div>

                        {/* Styled Credit Card Component */}
                        <div className="mt-5 relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#061445] via-[#1E2A5A] to-[#0D226B] p-6 text-white shadow-xl border border-brand-yellow/20">
                            <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-brand-yellow/10 blur-2xl" />
                            <div className="pointer-events-none absolute -left-12 -bottom-12 h-40 w-40 rounded-full bg-brand-lightblue/10 blur-2xl" />

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="h-7 w-10 rounded-md bg-amber-300/80 border border-amber-200 flex items-center justify-center shadow-inner">
                                        <div className="h-4 w-6 border-y border-amber-500/50 flex items-center justify-center">
                                            <div className="h-2 w-2 rounded-full border border-amber-600/50" />
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-bold tracking-widest text-brand-yellow uppercase">HUMO / UZCARD</span>
                                </div>
                                <span className="font-extrabold text-sm tracking-wider text-brand-yellow">
                                    Convo<span className="text-white">Mate</span>
                                </span>
                            </div>

                            <div className="mt-6">
                                <span className="text-[10px] font-semibold text-brand-lightblue/70 uppercase tracking-wider block mb-1">
                                    Card Number
                                </span>
                                <div className="flex items-center justify-between rounded-xl bg-white/10 px-3.5 py-2.5 backdrop-blur-md border border-white/15">
                                    <span className="font-mono text-lg font-black tracking-widest text-white">
                                        9860 1966 1940 4458
                                    </span>
                                    <button
                                        onClick={() => handleCopyCardNumber('9860196619404458')}
                                        className="flex items-center gap-1.5 rounded-lg bg-brand-yellow px-2.5 py-1 text-xs font-bold text-brand-brown shadow transition-all hover:bg-brand-yellow-hover hover:scale-105 cursor-pointer"
                                    >
                                        {copiedCard ? <Check className="h-3.5 w-3.5 text-emerald-700" /> : <Copy className="h-3.5 w-3.5" />}
                                        <span>{copiedCard ? 'Copied' : t('payment.copy_card') || 'Copy Card'}</span>
                                    </button>
                                </div>
                            </div>

                            <div className="mt-5 grid grid-cols-2 gap-4 pt-2 border-t border-white/10">
                                <div>
                                    <span className="text-[9px] font-semibold text-brand-lightblue/70 uppercase tracking-wider block">
                                        {t('payment.card_holder') || 'Student Name'}
                                    </span>
                                    <span className="text-xs font-bold text-white uppercase truncate block mt-0.5">
                                        {user.full_name}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-[9px] font-semibold text-brand-lightblue/70 uppercase tracking-wider block">
                                        {t('payment.pupil_id') || 'Pupil ID'}
                                    </span>
                                    <span className="text-xs font-mono font-black text-brand-yellow block mt-0.5">
                                        {user.short_id || user.id.substring(0, 8).toUpperCase()}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 rounded-2xl border border-amber-200/80 bg-amber-50/80 p-4">
                            <div className="flex gap-3">
                                <ShieldAlert className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
                                <div className="space-y-1">
                                    <p className="text-xs font-extrabold text-amber-900 leading-snug">
                                        {t('payment.warning_notice') || 'Must send proof with your Pupil ID to Telegram for verification!'}
                                    </p>
                                    <p className="text-[11px] font-medium text-amber-800">
                                        Name: <strong className="font-bold">{user.full_name}</strong> | ID: <strong className="font-mono font-bold text-amber-950">{user.short_id || user.id.substring(0, 8).toUpperCase()}</strong>
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-5 flex flex-col gap-2.5">
                            <a
                                href="https://t.me/+Z9Gr0FnDDAFhOTky"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#24A1DE] hover:bg-[#1D8AC0] py-3 text-xs font-bold text-white shadow-md transition-all hover:scale-[1.01]"
                            >
                                <ExternalLink className="h-4 w-4" />
                                {t('payment.open_telegram') || 'Open Telegram Verification Group'}
                            </a>
                            <button
                                onClick={() => setPaymentBooking(null)}
                                className="cursor-pointer rounded-xl border py-2 text-xs font-semibold text-muted-foreground hover:bg-muted transition-colors"
                            >
                                {t('bookings.close_btn') || 'Close'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
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
            toast.info(t('dashboard.new_booking_toast') || `A new session has been booked!`);
            router.reload();
        });

        return () => {
            channel.stopListening('.booking.updated');
            channel.stopListening('.ConversationBooked');
        };
    }, [user.id]);

    const handleCancel = async (id: string) => {
        const reason = prompt(t('dashboard.cancel_reason_prompt') || "Please enter the reason for cancellation (minimum 3 characters):");
        if (reason === null) {
            return;
        }
        const trimmedReason = reason.trim();
        if (trimmedReason.length < 3) {
            toast.error(t('dashboard.cancel_reason_min_length') || "Cancellation reason must be at least 3 characters.");
            return;
        }
        try {
            await axios.delete(`/bookings/${id}`, {
                data: { reason: trimmedReason }
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
            <div className="relative flex flex-col justify-between gap-6 overflow-hidden rounded-3xl bg-brand-navy p-6 text-white shadow-xl shadow-brand-navy/10 md:p-8 lg:flex-row lg:items-center">
                <div className="pointer-events-none absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-white/10 blur-2xl"></div>
                <div className="pointer-events-none absolute -top-12 right-1/3 h-36 w-36 rounded-full bg-[#fae18e]/10 blur-xl"></div>

                <div className="z-10 flex items-center space-x-4 md:space-x-6">
                    <div className="relative">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-white/40 bg-white/20 text-3xl shadow-inner backdrop-blur-md md:h-20 md:w-20 overflow-hidden">
                            {user.avatar ? (
                                <img src={user.avatar} className="h-full w-full object-cover" alt="avatar" />
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
                        className="group flex items-center space-x-2 rounded-full bg-white px-5 py-3 font-bold text-[#061445] shadow-md transition-all duration-200 hover:scale-[1.02] hover:bg-brand-yellow/10 active:scale-[0.98]"
                    >
                        <Clock className="h-4 w-4 transition-transform group-hover:rotate-45" />
                        <span>{t('dashboard.manage_availability')}</span>
                    </Link>
                </div>
            </div>

            {/* Google Meet status warning */}
            {!user.google_connected && (
                <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-red-200 bg-red-50/40 p-5 md:flex-row">
                    <div>
                        <h4 className="font-bold text-red-800">
                            {t('dashboard.google_not_connected')}
                        </h4>
                        <p className="mt-0.5 text-xs text-red-600">
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
                <div className="group relative overflow-hidden rounded-3xl bg-white p-6 shadow-ambient transition duration-200 hover:shadow-ambient-md">
                    <div className="absolute top-0 left-0 h-full w-2 bg-[#061445]"></div>
                    <div className="flex items-start justify-between">
                        <div className="space-y-2">
                            <p className="text-sm font-semibold tracking-wider text-[#45464f] uppercase">
                                {t('dashboard.sessions_today')}
                            </p>
                            <div className="flex items-baseline space-x-2">
                                <span className="text-4xl font-extrabold tracking-tight text-[#1b1b1f]">
                                    {stats.sessions_today || 0}
                                </span>
                                <span className="text-sm font-semibold text-[#45464f]">
                                    {t('dashboard.sessions_unit')}
                                </span>
                            </div>
                        </div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#d0e4ff] text-[#061445] transition duration-200 group-hover:scale-110">
                            <Video className="h-5 w-5" />
                        </div>
                    </div>
                    <div className="mt-4 text-xs font-medium text-[#45464f]">
                        {t('dashboard.sessions_today_desc')}
                    </div>
                </div>

                {/* Jami o'quvchilar */}
                <div className="group relative overflow-hidden rounded-3xl bg-white p-6 shadow-ambient transition duration-200 hover:shadow-ambient-md">
                    <div className="absolute top-0 left-0 h-full w-2 bg-emerald-500"></div>
                    <div className="flex items-start justify-between">
                        <div className="space-y-2">
                            <p className="text-sm font-semibold tracking-wider text-[#45464f] uppercase">
                                {t('dashboard.total_pupils')}
                            </p>
                            <div className="flex items-baseline space-x-2">
                                <span className="text-4xl font-extrabold tracking-tight text-[#1b1b1f]">
                                    {stats.total_pupils || 0}
                                </span>
                                <span className="text-sm font-semibold text-[#45464f]">
                                    {t('dashboard.active_unit')}
                                </span>
                            </div>
                        </div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-500 transition duration-200 group-hover:scale-110">
                            <Users className="h-5 w-5" />
                        </div>
                    </div>
                    <div className="mt-4 text-xs font-medium text-[#45464f]">
                        {t('dashboard.total_pupils_desc')}
                    </div>
                </div>

                {/* Sizning bahoingiz */}
                <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-50/60 to-orange-50/40 p-6 shadow-ambient transition duration-200 hover:shadow-ambient-md">
                    <div className="absolute top-0 left-0 h-full w-2 bg-amber-500"></div>
                    <div className="flex items-start justify-between">
                        <div className="space-y-2">
                            <p className="text-sm font-semibold tracking-wider text-amber-800/80 uppercase">
                                {t('dashboard.your_rating')}
                            </p>
                            <div className="flex items-baseline space-x-1">
                                <span className="text-4xl font-extrabold tracking-tight text-amber-600">
                                    {stats.average_rating || '5.0'}
                                </span>
                                <span className="text-xl font-medium text-slate-400">
                                    /10
                                </span>
                            </div>
                        </div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500 text-white shadow-md shadow-amber-200 transition duration-200 group-hover:scale-110">
                            <Star className="h-5 w-5 fill-current text-white" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center space-x-1.5 text-xs font-bold text-amber-700">
                        <TrendingUp className="h-3.5 w-3.5" />
                        <span>{t('dashboard.your_rating_desc')}</span>
                    </div>
                </div>
            </div>

            {/* Schedule and feedback sections */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Schedule column */}
                <div className="flex flex-col justify-between rounded-3xl bg-white p-6 shadow-ambient md:p-8">
                    <div>
                        <h2 className="mb-6 flex items-center space-x-2 text-lg font-bold tracking-tight text-[#1b1b1f]">
                            <span className="inline-block h-5 w-2.5 rounded-sm bg-[#061445]"></span>
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
                                            className="flex items-center gap-4 rounded-3xl border border-[#d0e4ff] bg-[#d0e4ff]/5 p-4 transition-all hover:shadow-ambient-md"
                                        >
                                            <div className="flex flex-col items-center justify-center rounded-2xl border border-[#c6c5d0]/60 bg-white px-3 py-2.5 text-center shadow-sm">
                                                <span className="text-xs font-bold text-[#061445] uppercase">
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
                                                <h4 className="text-sm font-bold text-[#1b1b1f]">
                                                    {t(
                                                        'dashboard.conversation_practice',
                                                    )}
                                                </h4>
                                                <p className="text-xs font-semibold text-[#45464f]">
                                                    {t('dashboard.with_pupil', { name: '' })}
                                                    {apt.pupil ? (
                                                        <Link
                                                            href={`/profile/${apt.pupil.id}`}
                                                            className="font-bold text-[#061445] hover:underline"
                                                        >
                                                            {apt.pupil.full_name}
                                                        </Link>
                                                    ) : (
                                                        'Pupil'
                                                    )}
                                                </p>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                {apt.status === 'accepted' ? (
                                                    <span className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-[10px] font-black uppercase text-amber-800 tracking-wider">
                                                        STATUS ACCEPTED · AWAITING PAYMENT
                                                    </span>
                                                ) : (
                                                    <TeacherMeetingButton
                                                        apt={apt}
                                                        handleStart={handleStart}
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
                                <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-brand-lightblue/30 bg-brand-lightblue/25 text-3xl text-brand-brown">
                                    🗓️
                                </div>
                                <div className="space-y-1">
                                    <h4 className="font-bold text-[#1b1b1f]">
                                        {t('dashboard.no_appointments_today')}
                                    </h4>
                                    <p className="mx-auto max-w-xs text-sm text-[#45464f]">
                                        {t('dashboard.no_appointments_today_desc')}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    <Link
                        href="/teacher/schedule"
                        className="mt-4 block w-full rounded-full border border-brand-lightblue bg-brand-lightblue/30 py-3 text-center font-semibold text-brand-brown transition duration-150 hover:bg-[#d0e4ff]/60"
                    >
                        {t('dashboard.view_calendar')}
                    </Link>
                </div>

                {/* Feedback column */}
                <div className="flex flex-col justify-between rounded-3xl bg-white p-6 shadow-ambient md:p-8">
                    <div>
                        <h2 className="mb-6 flex items-center space-x-2 text-lg font-bold tracking-tight text-[#1b1b1f]">
                            <span className="inline-block h-5 w-2.5 rounded-sm bg-emerald-500"></span>
                            <span>{t('dashboard.pending_feedback')}</span>
                        </h2>

                        <div className="flex flex-col items-center space-y-4 px-4 py-10 text-center">
                            <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-4xl text-emerald-500 shadow-inner">
                                <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                                <div className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-amber-400 text-xs shadow-sm">
                                    🎉
                                </div>
                            </div>

                            <div className="space-y-1">
                                <h4 className="text-lg font-extrabold text-emerald-900">
                                    {t('dashboard.all_caught_up')}
                                </h4>
                                <p className="mx-auto max-w-xs text-sm font-medium text-emerald-700/70">
                                    {t('dashboard.all_caught_up_desc')}
                                </p>
                            </div>
                        </div>
                    </div>

                    <Link
                        href="/teacher/sessions"
                        className="mt-4 block w-full rounded-full bg-emerald-600 py-3 text-center font-bold text-white shadow-md shadow-emerald-100 transition duration-150 hover:bg-emerald-700"
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

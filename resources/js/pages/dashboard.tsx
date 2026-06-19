import { Head, usePage, Link, router } from '@inertiajs/react';
import { Calendar, Clock, Video, Star, Mic, Play, TrendingUp, CheckCircle2, Users, ChevronRight, Bell, Sparkles } from 'lucide-react';
import { dashboard } from '@/routes';
import type { Auth } from '@/types';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/use-translation';
import AppLayout from '@/layouts/app-layout';

function PupilMeetingButton({ apt, handleJoin }: { apt: any; handleJoin: (apt: any) => void }) {
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
                className="flex items-center gap-2 rounded-xl bg-muted/60 px-4 py-2.5 text-xs font-semibold text-muted-foreground cursor-not-allowed border border-border/50"
            >
                <Clock className="h-3.5 w-3.5" /> {t('meeting.scheduled')}
            </button>
        );
    }

    return (
        <button 
            onClick={() => handleJoin(apt)}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-500/10 hover:shadow-lg hover:shadow-indigo-500/20 transition-all hover:-translate-y-0.5 cursor-pointer"
        >
            <Video className="h-3.5 w-3.5" /> {t('meeting.join')}
        </button>
    );
}

function TeacherMeetingButton({ apt, handleStart, startingAptId }: { apt: any; handleStart: (apt: any) => void; startingAptId: string | null }) {
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
                className="flex items-center gap-2 rounded-xl bg-muted/60 px-4 py-2.5 text-xs font-semibold text-muted-foreground cursor-not-allowed border border-border/50"
            >
                <Clock className="h-3.5 w-3.5" /> {t('meeting.scheduled')}
            </button>
        );
    }

    return (
        <button 
            disabled={startingAptId === apt.id}
            onClick={() => handleStart(apt)}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-500/10 hover:shadow-lg hover:shadow-indigo-500/20 transition-all hover:-translate-y-0.5 disabled:opacity-50 cursor-pointer"
        >
            <Video className="h-3.5 w-3.5" /> 
            {startingAptId === apt.id ? t('meeting.starting') : (apt.google_meet_link ? t('meeting.join') : t('meeting.start'))}
        </button>
    );
}

function PupilDashboard({ 
    user, 
    appointments = [], 
    stats = {}, 
    recentFeedback = null 
}: { 
    user: any; 
    appointments?: any[]; 
    stats?: any; 
    recentFeedback?: any; 
}) {
    const { t } = useTranslation();

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
            toast.error(error.response?.data?.message || t('dashboard.cancel_error'));
        }
    };

    const handleJoin = async (apt: any) => {
        try {
            const response = await axios.post(`/pupil/appointments/${apt.id}/join`);
            window.open(response.data.google_meet_link, '_blank');
        } catch (error: any) {
            toast.error(error.response?.data?.message || t('meeting.not_ready'));
        }
    };

    return (
        <div className="flex h-full flex-1 flex-col gap-8 p-4 md:p-8">
            {/* Header / Welcome Back Banner */}
            <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-violet-700 rounded-3xl p-6 md:p-8 text-white shadow-xl shadow-indigo-100 dark:shadow-none flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
                <div className="absolute right-1/4 -bottom-10 w-32 h-32 bg-purple-500/20 rounded-full blur-xl pointer-events-none"></div>

                <div className="flex items-center space-x-4 md:space-x-6 z-10">
                    <div className="relative">
                        <div className="w-16 h-16 md:w-20 md:h-20 bg-white/20 backdrop-blur-md rounded-2xl border-2 border-white/40 flex items-center justify-center text-3xl font-bold shadow-inner">
                            👤
                        </div>
                        <span className="absolute -bottom-1 -right-1 bg-emerald-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold border-2 border-indigo-600 shadow-sm">Level 3</span>
                    </div>
                    <div>
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="bg-white/20 text-white text-xs font-semibold tracking-wider uppercase px-2.5 py-1 rounded-full backdrop-blur-sm">
                                {t('welcome.badge')}
                            </span>
                            <div className="flex items-center space-x-1.5 bg-orange-500/20 text-orange-200 border border-orange-500/30 px-3 py-1 rounded-full text-xs font-bold animate-pulse shadow-sm">
                                <span>🔥 5 Day Streak!</span>
                            </div>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mt-2">
                            {t('dashboard.welcome_back', { name: user.full_name || user.name })} 👋
                        </h1>
                        <p className="text-indigo-100 text-sm md:text-base mt-1 font-medium opacity-90">
                            {t('dashboard.learning_journey_desc')}
                        </p>
                    </div>
                </div>

                <Link 
                    href="/pupil/teachers" 
                    className="bg-white text-indigo-700 font-bold px-6 py-3.5 rounded-xl shadow-md hover:bg-indigo-50 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shrink-0 flex items-center justify-center space-x-2 group z-10"
                >
                    <Calendar className="h-4 w-4 group-hover:rotate-12 transition-transform" />
                    <span>{t('dashboard.book_now')}</span>
                </Link>
            </div>

            {/* Stats Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Jami gapirish vaqti */}
                <div className="bg-white dark:bg-card rounded-2xl p-6 border border-slate-100 dark:border-border shadow-sm relative overflow-hidden group hover:shadow-md transition duration-200">
                    <div className="absolute top-0 left-0 w-2 h-full bg-emerald-500"></div>
                    <div className="flex justify-between items-start">
                        <div className="space-y-2">
                            <p className="text-slate-500 dark:text-muted-foreground text-sm font-semibold uppercase tracking-wider">{t('dashboard.speaking_hours')}</p>
                            <div className="flex items-baseline space-x-2">
                                <span className="text-4xl font-extrabold text-slate-800 dark:text-foreground tracking-tight">{stats.speaking_hours || 0}</span>
                                <span className="text-slate-500 font-semibold text-sm">soat</span>
                            </div>
                        </div>
                        <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl flex items-center justify-center text-emerald-500 group-hover:scale-110 transition duration-200">
                            <Clock className="h-5 w-5" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center space-x-1.5 text-xs text-emerald-600 dark:text-emerald-500 font-medium">
                        <TrendingUp className="h-3.5 w-3.5" />
                        <span>{t('dashboard.practice_perfect')}</span>
                    </div>
                </div>

                {/* Kelgusi darslar */}
                <div className="bg-white dark:bg-card rounded-2xl p-6 border border-slate-100 dark:border-border shadow-sm relative overflow-hidden group hover:shadow-md transition duration-200">
                    <div className="absolute top-0 left-0 w-2 h-full bg-indigo-500"></div>
                    <div className="flex justify-between items-start">
                        <div className="space-y-2">
                            <p className="text-slate-500 dark:text-muted-foreground text-sm font-semibold uppercase tracking-wider">{t('dashboard.upcoming_sessions')}</p>
                            <div className="flex items-baseline space-x-2">
                                <span className="text-4xl font-extrabold text-slate-800 dark:text-foreground tracking-tight">{stats.upcoming_sessions || 0}</span>
                                <span className="text-slate-500 font-semibold text-sm">ta seans</span>
                            </div>
                        </div>
                        <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl flex items-center justify-center text-indigo-500 group-hover:scale-110 transition duration-200">
                            <Calendar className="h-5 w-5" />
                        </div>
                    </div>
                    <div className="mt-4 text-xs text-slate-500 dark:text-muted-foreground font-medium">
                        {t('dashboard.book_more')}
                    </div>
                </div>

                {/* O'rtacha baho */}
                <div className="bg-gradient-to-br from-amber-50/60 to-orange-50/40 dark:from-amber-950/10 dark:to-orange-950/10 rounded-2xl p-6 border border-amber-100 dark:border-amber-950/20 shadow-sm relative overflow-hidden group hover:shadow-md transition duration-200">
                    <div className="absolute top-0 left-0 w-2 h-full bg-amber-500"></div>
                    <div className="flex justify-between items-start">
                        <div className="space-y-2">
                            <p className="text-amber-800/80 dark:text-amber-400 text-sm font-semibold uppercase tracking-wider">{t('dashboard.avg_rating')}</p>
                            <div className="flex items-baseline space-x-1">
                                <span className="text-4xl font-extrabold text-amber-600 dark:text-amber-500 tracking-tight">{stats.average_rating || '5.0'}</span>
                                <span className="text-slate-400 dark:text-slate-500 font-medium text-xl">/10</span>
                            </div>
                        </div>
                        <div className="w-12 h-12 bg-amber-500 text-white rounded-xl flex items-center justify-center shadow-md shadow-amber-200 dark:shadow-none group-hover:scale-110 transition duration-200">
                            <Star className="h-5 w-5 fill-current text-white" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center space-x-1.5 text-xs text-amber-700 dark:text-amber-500 font-bold">
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>{t('dashboard.rating_desc')}</span>
                    </div>
                </div>
            </div>

            {/* Upcoming Sessions List */}
            <div className="bg-white dark:bg-card rounded-3xl border border-slate-100 dark:border-border shadow-sm p-6 md:p-10">
                <h2 className="text-lg font-bold text-slate-800 dark:text-foreground tracking-tight flex items-center space-x-2 mb-6">
                    <span className="w-2.5 h-5 bg-indigo-600 rounded-sm inline-block"></span>
                    <span>{t('dashboard.upcoming_sessions')}</span>
                </h2>

                {appointments.length > 0 ? (
                    <div className="flex flex-col gap-5">
                        {appointments.map((apt) => (
                            <div key={apt.id} className="group rounded-3xl border border-border bg-card shadow-sm overflow-hidden transition-all duration-300 hover:border-indigo-500/20 hover:shadow-md">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 border-b border-border/60">
                                    <div className="flex items-center gap-4">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 group-hover:scale-105 transition-transform">
                                            <Mic className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-base">{t('dashboard.speaking_practice')}</h4>
                                            <p className="text-sm text-muted-foreground font-medium">{t('dashboard.with_teacher', { name: apt.teacher?.full_name || '' })}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col sm:text-right">
                                        <span className="font-bold text-indigo-600 dark:text-indigo-400">
                                            {new Date(apt.start_at).toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })}
                                        </span>
                                        <span className="text-xs text-muted-foreground font-semibold mt-0.5">
                                            {new Date(apt.start_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(apt.end_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </div>
                                <div className="px-6 py-4 bg-muted/30 flex justify-end gap-3 items-center">
                                    <button 
                                        onClick={() => handleCancel(apt.id)}
                                        className="rounded-xl px-4 py-2.5 text-xs font-bold border border-destructive/20 text-destructive hover:bg-destructive hover:text-white transition-all cursor-pointer"
                                    >
                                        {t('dashboard.cancel_button')}
                                    </button>
                                    <PupilMeetingButton apt={apt} handleJoin={handleJoin} />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="max-w-md mx-auto text-center py-8 px-4 flex flex-col items-center space-y-5">
                        <div className="w-24 h-24 bg-gradient-to-tr from-indigo-100 to-violet-100 dark:from-indigo-950/40 dark:to-violet-950/40 rounded-full flex items-center justify-center text-4xl shadow-inner relative">
                            🎙️
                            <div className="absolute -bottom-1 -right-1 bg-amber-400 w-8 h-8 rounded-full flex items-center justify-center text-sm shadow-sm animate-bounce">
                                ✨
                            </div>
                        </div>
                        
                        <div className="space-y-2">
                            <h3 className="text-xl font-bold text-slate-800 dark:text-foreground">{t('dashboard.no_upcoming')}</h3>
                            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                                Sizning gapirish amaliyotingiz shu yerda boshlanadi! Keling, birgalikda maqsadlaringiz sari harakat qilamiz va yangi marralarni zabt etamiz.
                            </p>
                        </div>

                        <Link 
                            href="/pupil/teachers" 
                            className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold px-6 py-3 rounded-xl shadow-md shadow-indigo-100 dark:shadow-none hover:opacity-95 hover:scale-[1.01] active:scale-[0.99] transition-all duration-150 block text-center"
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
    stats = {} 
}: { 
    user: any; 
    appointments?: any[]; 
    stats?: any; 
}) {
    const [startingAptId, setStartingAptId] = useState<string | null>(null);
    const { auth } = usePage<any>().props;
    const { t } = useTranslation();
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
            toast.error(error.response?.data?.message || t('dashboard.cancel_conversation_error'));
        }
    };

    const handleStart = async (apt: any) => {
        if (apt.google_meet_link) {
            window.open(apt.google_meet_link, '_blank');
            return;
        }

        setStartingAptId(apt.id);
        try {
            const response = await axios.post(`/teacher/appointments/${apt.id}/start`);
            toast.success(t('dashboard.start_conversation_success'));
            if (response.data.google_meet_link) {
                window.open(response.data.google_meet_link, '_blank');
            }
            router.reload();
        } catch (error: any) {
            toast.error(error.response?.data?.message || t('dashboard.start_conversation_error'));
        } finally {
            setStartingAptId(null);
        }
    };

    return (
        <div className="flex h-full flex-1 flex-col gap-8 p-4 md:p-8">
            {/* Header Banner */}
            <div className="relative overflow-hidden bg-gradient-to-r from-sky-600 via-indigo-600 to-purple-700 rounded-3xl p-6 md:p-8 text-white shadow-xl shadow-sky-100/40 dark:shadow-none flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
                <div className="absolute right-1/3 -top-12 w-36 h-36 bg-sky-400/20 rounded-full blur-xl pointer-events-none"></div>

                <div className="flex items-center space-x-4 md:space-x-6 z-10">
                    <div className="relative">
                        <div className="w-16 h-16 md:w-20 md:h-20 bg-white/20 backdrop-blur-md rounded-2xl border-2 border-white/40 flex items-center justify-center text-3xl shadow-inner">
                            👨‍🏫
                        </div>
                        <span className="absolute -bottom-1 -right-1 bg-amber-400 text-slate-900 text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm">PRO</span>
                    </div>
                    <div>
                        <span className="bg-white/20 text-white text-xs font-semibold tracking-wider uppercase px-2.5 py-1 rounded-full backdrop-blur-sm">
                            {t('dashboard.teacher_title')}
                        </span>
                        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mt-2">
                            {t('dashboard.welcome_back', { name: user.full_name || user.name })} 🌟
                        </h1>
                        <p className="text-sky-100 text-sm md:text-base mt-1 font-medium opacity-90">
                            {t('dashboard.teacher_subtitle', { name: '' }).replace(/^\s*,\s*/, '').trim() || "Darslaringiz va bo'sh vaqtlarigizni samarali boshqaring."}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 flex-wrap z-10">
                    <Link 
                        href="/teacher/appointments" 
                        className="relative bg-white/10 backdrop-blur-sm text-white font-semibold border border-white/20 px-5 py-3 rounded-xl hover:bg-white/20 active:scale-[0.98] transition-all duration-200 flex items-center space-x-2"
                    >
                        <Calendar className="h-4 w-4" />
                        <span>{t('nav.booking_requests')}</span>
                        {pendingCount > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-extrabold text-white shadow-sm border border-white animate-pulse">
                                {pendingCount}
                            </span>
                        )}
                    </Link>
                    <Link 
                        href="/teacher/availability" 
                        className="bg-white text-sky-700 font-bold px-5 py-3 rounded-xl shadow-md hover:bg-sky-50 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center space-x-2 group"
                    >
                        <Clock className="h-4 w-4 group-hover:rotate-45 transition-transform" />
                        <span>{t('dashboard.manage_availability')}</span>
                    </Link>
                </div>
            </div>

            {/* Google Meet status warning */}
            {!user.google_connected && (
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-5 rounded-2xl border border-red-200 bg-red-50/40 dark:border-red-950/20 dark:bg-red-950/5">
                    <div>
                        <h4 className="font-bold text-red-800 dark:text-red-400">{t('dashboard.google_not_connected')}</h4>
                        <p className="text-xs text-red-600 dark:text-red-500 mt-0.5">{t('dashboard.google_not_connected_desc')}</p>
                    </div>
                    <a 
                        href="/auth/google" 
                        className="inline-flex items-center justify-center rounded-xl bg-red-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-red-700 transition-colors whitespace-nowrap shadow-sm"
                    >
                        {t('dashboard.connect_google')}
                    </a>
                </div>
            )}

            {/* Stats grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Bugungi darslar */}
                <div className="bg-white dark:bg-card rounded-2xl p-6 border border-slate-100 dark:border-border shadow-sm relative overflow-hidden group hover:shadow-md transition duration-200">
                    <div className="absolute top-0 left-0 w-2 h-full bg-indigo-500"></div>
                    <div className="flex justify-between items-start">
                        <div className="space-y-2">
                            <p className="text-slate-500 dark:text-muted-foreground text-sm font-semibold uppercase tracking-wider">{t('dashboard.sessions_today')}</p>
                            <div className="flex items-baseline space-x-2">
                                <span className="text-4xl font-extrabold text-slate-800 dark:text-foreground tracking-tight">{stats.sessions_today || 0}</span>
                                <span className="text-slate-500 font-semibold text-sm">ta seans</span>
                            </div>
                        </div>
                        <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl flex items-center justify-center text-indigo-500 group-hover:scale-110 transition duration-200">
                            <Video className="h-5 w-5" />
                        </div>
                    </div>
                    <div className="mt-4 text-xs text-slate-500 dark:text-muted-foreground font-medium">
                        {t('dashboard.sessions_today_desc')}
                    </div>
                </div>

                {/* Jami o'quvchilar */}
                <div className="bg-white dark:bg-card rounded-2xl p-6 border border-slate-100 dark:border-border shadow-sm relative overflow-hidden group hover:shadow-md transition duration-200">
                    <div className="absolute top-0 left-0 w-2 h-full bg-emerald-500"></div>
                    <div className="flex justify-between items-start">
                        <div className="space-y-2">
                            <p className="text-slate-500 dark:text-muted-foreground text-sm font-semibold uppercase tracking-wider">{t('dashboard.total_pupils')}</p>
                            <div className="flex items-baseline space-x-2">
                                <span className="text-4xl font-extrabold text-slate-800 dark:text-foreground tracking-tight">{stats.total_pupils || 0}</span>
                                <span className="text-slate-500 font-semibold text-sm">ta faol</span>
                            </div>
                        </div>
                        <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl flex items-center justify-center text-emerald-500 group-hover:scale-110 transition duration-200">
                            <Users className="h-5 w-5" />
                        </div>
                    </div>
                    <div className="mt-4 text-xs text-slate-500 dark:text-muted-foreground font-medium">
                        {t('dashboard.total_pupils_desc')}
                    </div>
                </div>

                {/* Sizning bahoingiz */}
                <div className="bg-gradient-to-br from-amber-50/60 to-orange-50/40 dark:from-amber-950/10 dark:to-orange-950/10 rounded-2xl p-6 border border-amber-100 dark:border-amber-950/20 shadow-sm relative overflow-hidden group hover:shadow-md transition duration-200">
                    <div className="absolute top-0 left-0 w-2 h-full bg-amber-500"></div>
                    <div className="flex justify-between items-start">
                        <div className="space-y-2">
                            <p className="text-amber-800/80 dark:text-amber-400 text-sm font-semibold uppercase tracking-wider">{t('dashboard.your_rating')}</p>
                            <div className="flex items-baseline space-x-1">
                                <span className="text-4xl font-extrabold text-amber-600 dark:text-amber-550 tracking-tight">{stats.average_rating || '5.0'}</span>
                                <span className="text-slate-400 dark:text-slate-500 font-medium text-xl">/10</span>
                            </div>
                        </div>
                        <div className="w-12 h-12 bg-amber-500 text-white rounded-xl flex items-center justify-center shadow-md shadow-amber-200 dark:shadow-none group-hover:scale-110 transition duration-200">
                            <Star className="h-5 w-5 fill-current text-white" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center space-x-1.5 text-xs text-amber-700 dark:text-amber-500 font-bold">
                        <TrendingUp className="h-3.5 w-3.5" />
                        <span>{t('dashboard.your_rating_desc')}</span>
                    </div>
                </div>
            </div>

            {/* Schedule and feedback sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Schedule column */}
                <div className="bg-white dark:bg-card rounded-3xl border border-slate-100 dark:border-border shadow-sm p-6 md:p-8 flex flex-col justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800 dark:text-foreground tracking-tight flex items-center space-x-2 mb-6">
                            <span className="w-2.5 h-5 bg-sky-600 rounded-sm inline-block"></span>
                            <span>{t('dashboard.todays_schedule')}</span>
                        </h2>
                        
                        {appointments.length > 0 ? (
                            <div className="flex flex-col gap-4">
                                {appointments.map((apt) => {
                                    const start = new Date(apt.start_at);
                                    const end = new Date(apt.end_at);
                                    const durationMin = Math.round((end.getTime() - start.getTime()) / 60000);
                                    
                                    return (
                                        <div key={apt.id} className="flex items-center gap-4 rounded-2xl border border-indigo-100 bg-indigo-50/10 p-4 dark:border-indigo-950/20 dark:bg-indigo-950/5 transition-all hover:shadow-md">
                                            <div className="flex flex-col items-center justify-center rounded-xl bg-white dark:bg-card px-3 py-2.5 text-center shadow-sm border border-border/60">
                                                <span className="text-xs font-bold uppercase text-indigo-600 dark:text-indigo-400">
                                                    {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground font-semibold mt-0.5">{durationMin}m</span>
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-bold text-sm">{t('dashboard.conversation_practice')}</h4>
                                                <p className="text-xs text-muted-foreground font-semibold">{t('dashboard.with_pupil', { name: apt.pupil?.full_name || 'Pupil' })}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button 
                                                    onClick={() => handleCancel(apt.id)}
                                                    className="rounded-xl px-3 py-2 text-xs font-bold border border-destructive/20 text-destructive hover:bg-destructive hover:text-white transition-all cursor-pointer"
                                                >
                                                    {t('dashboard.cancel_button')}
                                                </button>
                                                <TeacherMeetingButton apt={apt} handleStart={handleStart} startingAptId={startingAptId} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-10 px-4 flex flex-col items-center space-y-4">
                                <div className="w-20 h-20 bg-slate-50 dark:bg-muted border border-slate-100 dark:border-border/60 rounded-2xl flex items-center justify-center text-3xl text-slate-400">
                                    🗓️
                                </div>
                                <div className="space-y-1">
                                    <h4 className="font-bold text-slate-700 dark:text-slate-200">{t('dashboard.no_appointments_today')}</h4>
                                    <p className="text-slate-400 text-sm max-w-xs mx-auto">Bugun uchun tasdiqlangan dars seanslari hali rejalashtirilmagan / No sessions scheduled for today.</p>
                                </div>
                            </div>
                        )}
                    </div>
                    
                    <Link 
                        href="/teacher/schedule" 
                        className="w-full text-center bg-slate-50 border border-slate-200/80 hover:bg-slate-100 dark:bg-muted/40 dark:border-border/60 dark:hover:bg-muted text-slate-700 dark:text-slate-300 font-semibold py-3 rounded-xl transition duration-150 mt-4 block"
                    >
                        Jadval taqvimini ko'rish / View Calendar
                    </Link>
                </div>

                {/* Feedback column */}
                <div className="bg-gradient-to-br from-white to-emerald-50/20 dark:from-card dark:to-emerald-950/5 rounded-3xl border border-slate-100 dark:border-border shadow-sm p-6 md:p-8 flex flex-col justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800 dark:text-foreground tracking-tight flex items-center space-x-2 mb-6">
                            <span className="w-2.5 h-5 bg-emerald-500 rounded-sm inline-block"></span>
                            <span>{t('dashboard.pending_feedback')}</span>
                        </h2>

                        <div className="text-center py-10 px-4 flex flex-col items-center space-y-4">
                            <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-950/40 rounded-full flex items-center justify-center text-emerald-500 text-4xl shadow-inner relative">
                                <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                                <div className="absolute -top-1 -right-1 bg-amber-400 w-6 h-6 rounded-full flex items-center justify-center text-xs shadow-sm">
                                    🎉
                                </div>
                            </div>
                            
                            <div className="space-y-1">
                                <h4 className="font-extrabold text-emerald-900 dark:text-emerald-400 text-lg">{t('dashboard.all_caught_up')}</h4>
                                <p className="text-emerald-700/70 dark:text-emerald-450/70 text-sm max-w-xs mx-auto font-medium">
                                    {t('dashboard.all_caught_up_desc')}
                                </p>
                            </div>
                        </div>
                    </div>

                    <Link 
                        href="/teacher/sessions" 
                        className="w-full text-center bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl shadow-md shadow-emerald-100 dark:shadow-none transition duration-150 mt-4 block"
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
    recentFeedback = null 
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
                <TeacherDashboard user={auth.user} appointments={appointments} stats={stats} />
            ) : (
                <PupilDashboard user={auth.user} appointments={appointments} stats={stats} recentFeedback={recentFeedback} />
            )}
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [{ title: 'Dashboard', href: '/dashboard' }]
};

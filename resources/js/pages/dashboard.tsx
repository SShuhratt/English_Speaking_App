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
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center p-6 rounded-3xl border border-indigo-100 bg-gradient-to-r from-indigo-50/40 via-purple-50/20 to-transparent dark:border-indigo-950/20 dark:from-indigo-950/5 dark:via-purple-950/20">
                <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-indigo-500 font-bold text-sm">
                        <Sparkles className="h-4 w-4 animate-pulse" />
                        <span>{t('welcome.badge')}</span>
                    </div>
                    <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 bg-clip-text text-transparent">
                        {t('dashboard.welcome_back', { name: user.full_name || user.name })}
                    </h1>
                    <p className="text-muted-foreground font-medium text-sm">{t('dashboard.learning_journey_desc')}</p>
                </div>
                <Link 
                    href="/pupil/teachers" 
                    className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 transition-all hover:scale-102 hover:shadow-xl hover:shadow-indigo-500/30"
                >
                    {t('dashboard.book_now')} <ChevronRight className="ml-2 h-4 w-4" />
                </Link>
            </div>

            {/* Stats Cards Grid */}
            <div className="grid gap-6 md:grid-cols-3">
                <div className="flex flex-col gap-2 rounded-3xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:border-indigo-500/30 hover:shadow-md hover:shadow-indigo-500/5">
                    <div className="flex items-center gap-2 text-indigo-500">
                        <div className="p-2 rounded-xl bg-indigo-500/5">
                            <Clock className="h-5 w-5" />
                        </div>
                        <h3 className="font-bold text-sm text-muted-foreground">{t('dashboard.speaking_hours')}</h3>
                    </div>
                    <div className="mt-2 flex items-baseline gap-1">
                        <span className="text-4xl font-extrabold tracking-tight">{stats.speaking_hours || 0}</span>
                        <span className="text-lg font-bold text-muted-foreground">hours</span>
                    </div>
                    <p className="text-xs text-emerald-500 font-bold flex items-center gap-1 mt-2">
                        <TrendingUp className="h-3.5 w-3.5" /> {t('dashboard.practice_perfect')}
                    </p>
                </div>

                <div className="flex flex-col gap-2 rounded-3xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:border-purple-500/30 hover:shadow-md hover:shadow-purple-500/5">
                    <div className="flex items-center gap-2 text-purple-500">
                        <div className="p-2 rounded-xl bg-purple-500/5">
                            <Calendar className="h-5 w-5" />
                        </div>
                        <h3 className="font-bold text-sm text-muted-foreground">{t('dashboard.upcoming_sessions')}</h3>
                    </div>
                    <div className="mt-2">
                        <span className="text-4xl font-extrabold tracking-tight">{stats.upcoming_sessions || 0}</span>
                    </div>
                    <p className="text-xs text-muted-foreground font-semibold mt-2">{t('dashboard.book_more')}</p>
                </div>

                <div className="flex flex-col gap-2 rounded-3xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:border-amber-500/30 hover:shadow-md hover:shadow-amber-500/5">
                    <div className="flex items-center gap-2 text-amber-500">
                        <div className="p-2 rounded-xl bg-amber-500/5">
                            <Star className="h-5 w-5" />
                        </div>
                        <h3 className="font-bold text-sm text-muted-foreground">{t('dashboard.avg_rating')}</h3>
                    </div>
                    <div className="mt-2 flex items-baseline gap-0.5">
                        <span className="text-4xl font-extrabold tracking-tight">4.8</span>
                        <span className="text-lg font-bold text-muted-foreground">/5</span>
                    </div>
                    <p className="text-xs text-muted-foreground font-semibold mt-2">{t('dashboard.rating_desc')}</p>
                </div>
            </div>

            {/* Upcoming Sessions List */}
            <div className="max-w-4xl flex flex-col gap-5">
                <h2 className="text-xl font-bold tracking-tight">{t('dashboard.upcoming_sessions')}</h2>
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
                    <div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center text-muted-foreground">
                        <Calendar className="mx-auto h-10 w-10 text-muted-foreground/40 mb-4 animate-pulse" />
                        <p className="font-bold text-base text-foreground mb-1">{t('dashboard.no_upcoming')}</p>
                        <p className="text-sm text-muted-foreground mb-4">Start your journey by booking a speaking lesson now.</p>
                        <Link href="/pupil/teachers" className="inline-flex items-center gap-1.5 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:shadow-lg transition-all hover:scale-102">
                            {t('dashboard.book_now')} <ChevronRight className="h-3.5 w-3.5" />
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
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center p-6 rounded-3xl border border-indigo-100 bg-gradient-to-r from-indigo-50/40 via-purple-50/20 to-transparent dark:border-indigo-950/20 dark:from-indigo-950/5 dark:via-purple-950/20">
                <div>
                    <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 bg-clip-text text-transparent">
                        {t('dashboard.teacher_title')}
                    </h1>
                    <p className="text-muted-foreground font-medium text-sm mt-1">{t('dashboard.teacher_subtitle', { name: user.full_name || user.name })}</p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <Link 
                        href="/teacher/appointments" 
                        className="relative inline-flex items-center justify-center rounded-2xl border border-border bg-card px-5 py-3 text-sm font-bold hover:bg-accent transition-colors"
                    >
                        <div className="relative mr-2 flex items-center justify-center">
                            <Bell className="h-4 w-4 text-indigo-500" />
                            {pendingCount > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[8px] font-bold text-white shadow-sm">
                                    {pendingCount}
                                </span>
                            )}
                        </div>
                        {t('nav.booking_requests')}
                    </Link>
                    <Link 
                        href="/teacher/availability" 
                        className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 px-5 py-3 text-sm font-bold text-white shadow-md hover:shadow-lg transition-all"
                    >
                        <Clock className="mr-2 h-4 w-4" /> {t('dashboard.manage_availability')}
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
            <div className="grid gap-6 md:grid-cols-3">
                <div className="flex flex-col gap-2 rounded-3xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:border-indigo-500/30 hover:shadow-md hover:shadow-indigo-500/5">
                    <div className="flex items-center gap-2 text-indigo-500">
                        <div className="p-2 rounded-xl bg-indigo-500/5">
                            <Video className="h-5 w-5" />
                        </div>
                        <h3 className="font-bold text-sm text-muted-foreground">{t('dashboard.sessions_today')}</h3>
                    </div>
                    <div className="mt-2">
                        <span className="text-4xl font-extrabold tracking-tight">{stats.sessions_today || 0}</span>
                    </div>
                    <p className="text-xs text-muted-foreground font-semibold mt-2">{t('dashboard.sessions_today_desc')}</p>
                </div>

                <div className="flex flex-col gap-2 rounded-3xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:border-emerald-500/30 hover:shadow-md hover:shadow-emerald-500/5">
                    <div className="flex items-center gap-2 text-emerald-500">
                        <div className="p-2 rounded-xl bg-emerald-500/5">
                            <Users className="h-5 w-5" />
                        </div>
                        <h3 className="font-bold text-sm text-muted-foreground">{t('dashboard.total_pupils')}</h3>
                    </div>
                    <div className="mt-2">
                        <span className="text-4xl font-extrabold tracking-tight">{stats.total_pupils || 0}</span>
                    </div>
                    <p className="text-xs text-muted-foreground font-semibold mt-2">{t('dashboard.total_pupils_desc')}</p>
                </div>

                <div className="flex flex-col gap-2 rounded-3xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:border-amber-500/30 hover:shadow-md hover:shadow-amber-500/5">
                    <div className="flex items-center gap-2 text-amber-500">
                        <div className="p-2 rounded-xl bg-amber-500/5">
                            <Star className="h-5 w-5" />
                        </div>
                        <h3 className="font-bold text-sm text-muted-foreground">{t('dashboard.your_rating')}</h3>
                    </div>
                    <div className="mt-2 flex items-baseline gap-0.5">
                        <span className="text-4xl font-extrabold tracking-tight">{stats.average_rating || '5.0'}</span>
                        <span className="text-lg font-bold text-muted-foreground">/10</span>
                    </div>
                    <p className="text-xs text-muted-foreground font-semibold mt-2">{t('dashboard.your_rating_desc')}</p>
                </div>
            </div>

            {/* Schedule and feedback sections */}
            <div className="grid gap-8 lg:grid-cols-2">
                <div className="flex flex-col gap-4">
                    <h2 className="text-xl font-bold tracking-tight">{t('dashboard.todays_schedule')}</h2>
                    {appointments.length > 0 ? (
                        <div className="flex flex-col gap-4">
                            {appointments.map((apt) => {
                                const start = new Date(apt.start_at);
                                const end = new Date(apt.end_at);
                                const durationMin = Math.round((end.getTime() - start.getTime()) / 60000);
                                
                                return (
                                    <div key={apt.id} className="flex items-center gap-4 rounded-2xl border border-indigo-150 bg-indigo-50/20 p-4 dark:border-indigo-950/20 dark:bg-indigo-950/5 transition-all hover:shadow-md">
                                        <div className="flex flex-col items-center justify-center rounded-xl bg-white px-3 py-2.5 text-center shadow-sm dark:bg-card border border-border/60">
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
                        <div className="rounded-3xl border border-dashed border-border bg-card p-10 text-center text-muted-foreground">
                            <Calendar className="mx-auto h-8 w-8 text-muted-foreground/40 mb-3" />
                            <p className="font-bold text-foreground text-sm">{t('dashboard.no_appointments_today')}</p>
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-4">
                    <h2 className="text-xl font-bold tracking-tight">{t('dashboard.pending_feedback')}</h2>
                    <div className="rounded-3xl border border-dashed border-border bg-card p-10 text-center">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 mb-4 animate-bounce">
                            <CheckCircle2 className="h-6 w-6" />
                        </div>
                        <h3 className="text-base font-bold text-foreground">{t('dashboard.all_caught_up')}</h3>
                        <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">{t('dashboard.all_caught_up_desc')}</p>
                    </div>
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

Dashboard.layout = (page: React.ReactNode) => {
    return (
        <AppLayout breadcrumbs={[{ title: 'Dashboard', href: '/dashboard' }]}>
            {page}
        </AppLayout>
    );
};

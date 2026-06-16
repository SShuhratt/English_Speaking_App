import { Head, usePage, Link, router } from '@inertiajs/react';
import { Calendar, Clock, Video, Star, Mic, Play, TrendingUp, CheckCircle2, Users, ChevronRight, Bell } from 'lucide-react';
import { dashboard } from '@/routes';
import type { Auth } from '@/types';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';

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
    useEffect(() => {
        if (!user) return;

        const channel = window.Echo.channel(`pupil.${user.id}`);
        
        channel.listen('.booking.updated', (e: any) => {
            toast.info(`Booking status updated: ${e.appointment.status}`);
            router.reload({ preserveState: false });
        });

        return () => {
            channel.stopListening('.booking.updated');
        };
    }, [user.id]);

    const handleCancel = async (id: string) => {
        if (!confirm('Are you sure you want to cancel this booking?')) return;
        try {
            await axios.delete(`/bookings/${id}`);
            toast.success('Booking cancelled successfully');
            router.reload();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to cancel booking');
        }
    };

    const handleJoin = async (apt: any) => {
        try {
            const response = await axios.post(`/pupil/appointments/${apt.id}/join`);
            window.open(response.data.google_meet_link, '_blank');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Teacher is not ready yet');
        }
    };

    return (
        <div className="flex h-full flex-1 flex-col gap-8 p-4 md:p-8">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Welcome back, {user.full_name || user.name} 👋</h1>
                    <p className="text-muted-foreground">Here is what's happening with your learning journey.</p>
                </div>
                <Link href="/pupil/teachers" className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition-all hover:scale-105">
                    Book a Session <ChevronRight className="ml-2 h-4 w-4" />
                </Link>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <div className="flex flex-col gap-2 rounded-2xl border bg-card p-6 shadow-sm">
                    <div className="flex items-center gap-2 text-indigo-500">
                        <Clock className="h-5 w-5" />
                        <h3 className="font-medium">Total Speaking Hours</h3>
                    </div>
                    <p className="text-4xl font-bold">{stats.speaking_hours || 0}<span className="text-xl font-medium text-muted-foreground">h</span></p>
                    <p className="text-sm text-emerald-500 flex items-center gap-1 mt-1"><TrendingUp className="h-3 w-3" /> Practice makes perfect</p>
                </div>
                <div className="flex flex-col gap-2 rounded-2xl border bg-card p-6 shadow-sm">
                    <div className="flex items-center gap-2 text-purple-500">
                        <Calendar className="h-5 w-5" />
                        <h3 className="font-medium">Upcoming Sessions</h3>
                    </div>
                    <p className="text-4xl font-bold">{stats.upcoming_sessions || 0}</p>
                    <p className="text-sm text-muted-foreground mt-1">Book more for faster progress</p>
                </div>
                <div className="flex flex-col gap-2 rounded-2xl border bg-card p-6 shadow-sm">
                    <div className="flex items-center gap-2 text-amber-500">
                        <Star className="h-5 w-5" />
                        <h3 className="font-medium">Average Rating</h3>
                    </div>
                    <p className="text-4xl font-bold">4.8<span className="text-xl font-medium text-muted-foreground">/5</span></p>
                    <p className="text-sm text-muted-foreground mt-1">Feedback from your teachers</p>
                </div>
            </div>

            <div className="grid gap-8 lg:grid-cols-2">
                <div className="flex flex-col gap-4">
                    <h2 className="text-xl font-bold">Upcoming Sessions</h2>
                    {appointments.length > 0 ? (
                        <div className="flex flex-col gap-4">
                            {appointments.map((apt) => (
                                <div key={apt.id} className="rounded-2xl border bg-card shadow-sm overflow-hidden">
                                    <div className="flex items-center justify-between border-b p-5">
                                        <div className="flex items-center gap-4">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50">
                                                <Mic className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <h4 className="font-semibold">English Speaking Practice</h4>
                                                <p className="text-sm text-muted-foreground">with Teacher {apt.teacher?.full_name}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold text-indigo-600 dark:text-indigo-400">
                                                {new Date(apt.start_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {new Date(apt.start_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(apt.end_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-muted/50 flex justify-end gap-3">
                                        <button 
                                            onClick={() => handleCancel(apt.id)}
                                            className="rounded-lg px-4 py-2 text-sm font-medium border border-destructive/20 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-all"
                                        >
                                            Cancel
                                        </button>
                                        <button 
                                            onClick={() => handleJoin(apt)}
                                            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
                                        >
                                            <Video className="h-4 w-4" /> Join Call
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-2xl border bg-card p-10 text-center text-muted-foreground">
                            <Calendar className="mx-auto h-8 w-8 text-muted-foreground/50 mb-3" />
                            <p>No confirmed upcoming sessions.</p>
                            <Link href="/pupil/teachers" className="text-indigo-600 hover:underline text-sm font-medium mt-2 inline-block">
                                Book one now
                            </Link>
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-4">
                    <h2 className="text-xl font-bold">Recent Feedback</h2>
                    {recentFeedback ? (
                        <div className="rounded-2xl border bg-card p-5 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex justify-center items-center text-white font-bold">
                                        {recentFeedback.teacher?.full_name?.substring(0, 2).toUpperCase() || 'TR'}
                                    </div>
                                    <div>
                                        <h4 className="font-semibold">{recentFeedback.teacher?.full_name}</h4>
                                        <p className="text-xs text-muted-foreground">
                                            {new Date(recentFeedback.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full text-sm font-medium dark:bg-amber-900/30 dark:text-amber-400">
                                    <Star className="h-3.5 w-3.5 fill-current" /> {recentFeedback.rating_score}/10
                                </div>
                            </div>
                            <p className="text-sm text-muted-foreground leading-relaxed italic">
                                "{recentFeedback.comment_text}"
                            </p>
                        </div>
                    ) : (
                        <div className="rounded-2xl border bg-card p-10 text-center text-muted-foreground">
                            <Play className="mx-auto h-8 w-8 text-muted-foreground/50 mb-3" />
                            <p>No feedback received yet.</p>
                        </div>
                    )}
                </div>
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
    const pendingCount = auth.pending_requests_count || 0;

    useEffect(() => {
        if (!user) return;

        const channel = window.Echo.channel(`teacher.${user.id}`);
        
        channel.listen('.booking.updated', (e: any) => {
            router.reload({ preserveState: false });
        });

        return () => {
            channel.stopListening('.booking.updated');
        };
    }, [user.id]);

    const handleCancel = async (id: string) => {
        if (!confirm('Are you sure you want to cancel this conversation?')) return;
        try {
            await axios.delete(`/bookings/${id}`);
            toast.success('Conversation cancelled successfully');
            router.reload();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to cancel conversation');
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
            toast.success('Conversation started! Opening meeting link...');
            if (response.data.google_meet_link) {
                window.open(response.data.google_meet_link, '_blank');
            }
            router.reload();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to start conversation');
        } finally {
            setStartingAptId(null);
        }
    };

    return (
        <div className="flex h-full flex-1 flex-col gap-8 p-4 md:p-8">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Teacher Dashboard</h1>
                    <p className="text-muted-foreground">Welcome back, {user.full_name || user.name}. Manage your sessions and availability.</p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <Link href="/teacher/appointments" className="relative inline-flex items-center justify-center rounded-xl border bg-background px-6 py-2.5 text-sm font-semibold hover:bg-muted transition-colors">
                        <div className="relative mr-2 flex items-center justify-center">
                            <Bell className="h-4 w-4" />
                            {pendingCount > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[8px] font-bold text-destructive-foreground">
                                    {pendingCount}
                                </span>
                            )}
                        </div>
                        Booking Requests
                    </Link>
                    <Link href="/teacher/availability" className="inline-flex items-center justify-center rounded-xl border bg-background px-6 py-2.5 text-sm font-semibold hover:bg-muted transition-colors">
                        <Clock className="mr-2 h-4 w-4" /> Manage Availability
                    </Link>
                </div>
            </div>

            {!user.google_connected && (
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-xl border border-red-200 bg-red-50/50 dark:border-red-900/50 dark:bg-red-900/10">
                    <div>
                        <h4 className="font-semibold text-red-800 dark:text-red-400">Google Calendar Not Connected</h4>
                        <p className="text-sm text-red-600 dark:text-red-500">Please connect your Google Account to automatically generate Google Meet links for your sessions.</p>
                    </div>
                    <a 
                        href="/auth/google" 
                        className="inline-flex items-center justify-center rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition-colors whitespace-nowrap shadow-md shadow-red-500/20"
                    >
                        Connect Google Account
                    </a>
                </div>
            )}

            <div className="grid gap-4 md:grid-cols-3">
                <div className="flex flex-col gap-2 rounded-2xl border bg-card p-6 shadow-sm">
                    <div className="flex items-center gap-2 text-indigo-500">
                        <Video className="h-5 w-5" />
                        <h3 className="font-medium">Sessions Today</h3>
                    </div>
                    <p className="text-4xl font-bold">{stats.sessions_today || 0}</p>
                    <p className="text-sm text-muted-foreground mt-1">Confirmed slots for today</p>
                </div>
                <div className="flex flex-col gap-2 rounded-2xl border bg-card p-6 shadow-sm">
                    <div className="flex items-center gap-2 text-emerald-500">
                        <Users className="h-5 w-5" />
                        <h3 className="font-medium">Total Pupils</h3>
                    </div>
                    <p className="text-4xl font-bold">{stats.total_pupils || 0}</p>
                    <p className="text-sm text-muted-foreground mt-1">Pupils you have taught</p>
                </div>
                <div className="flex flex-col gap-2 rounded-2xl border bg-card p-6 shadow-sm">
                    <div className="flex items-center gap-2 text-amber-500">
                        <Star className="h-5 w-5" />
                        <h3 className="font-medium">Your Rating</h3>
                    </div>
                    <p className="text-4xl font-bold">{stats.average_rating || '5.0'}<span className="text-xl font-medium text-muted-foreground">/10</span></p>
                    <p className="text-sm text-muted-foreground mt-1">Based on pupil reviews</p>
                </div>
            </div>

            <div className="grid gap-8 lg:grid-cols-2">
                <div className="flex flex-col gap-4">
                    <h2 className="text-xl font-bold">Today's Schedule</h2>
                    {appointments.length > 0 ? (
                        <div className="flex flex-col gap-3">
                            {appointments.map((apt) => {
                                const start = new Date(apt.start_at);
                                const end = new Date(apt.end_at);
                                const durationMin = Math.round((end.getTime() - start.getTime()) / 60000);
                                
                                return (
                                    <div key={apt.id} className="flex items-center gap-4 rounded-xl border border-indigo-200 bg-indigo-50/50 p-4 dark:border-indigo-900/50 dark:bg-indigo-900/10 transition-all hover:shadow-sm">
                                        <div className="flex flex-col items-center justify-center rounded-lg bg-white px-3 py-2 text-center shadow-sm dark:bg-background">
                                            <span className="text-xs font-bold uppercase text-indigo-600 dark:text-indigo-400">
                                                {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground">{durationMin}m</span>
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-semibold">English Conversation Practice</h4>
                                            <p className="text-sm text-muted-foreground">with {apt.pupil?.full_name || 'Pupil'}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button 
                                                onClick={() => handleCancel(apt.id)}
                                                className="rounded-lg px-3 py-2 text-xs font-medium border border-destructive/20 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-all"
                                            >
                                                Cancel
                                            </button>
                                            <button 
                                                disabled={startingAptId === apt.id}
                                                onClick={() => handleStart(apt)}
                                                className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors disabled:opacity-50"
                                            >
                                                <Video className="h-4 w-4" /> 
                                                {startingAptId === apt.id ? 'Starting...' : (apt.google_meet_link ? 'Join' : 'Start')}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="rounded-2xl border bg-card p-10 text-center text-muted-foreground">
                            <Calendar className="mx-auto h-8 w-8 text-muted-foreground/50 mb-3" />
                            <p>No confirmed appointments scheduled for today.</p>
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-4">
                    <h2 className="text-xl font-bold">Pending Feedback</h2>
                    <div className="rounded-2xl border bg-card p-5 text-center py-10">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 mb-4">
                            <CheckCircle2 className="h-6 w-6" />
                        </div>
                        <h3 className="text-lg font-medium">All caught up!</h3>
                        <p className="text-muted-foreground mt-1 max-w-sm mx-auto">You've submitted feedback for all your past sessions. Great job!</p>
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

    return (
        <>
            <Head title="Dashboard" />

            {role === 'teacher' ? (
                <TeacherDashboard user={auth.user} appointments={appointments} stats={stats} />
            ) : (
                <PupilDashboard user={auth.user} appointments={appointments} stats={stats} recentFeedback={recentFeedback} />
            )}
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};

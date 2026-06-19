import React, { useEffect, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, router, usePage, Link } from '@inertiajs/react';
import { Calendar, Clock, User, Video, XCircle, Trash2, Sparkles, BookOpen } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/use-translation';

interface Props {
    bookings: {
        data: any[];
    };
}

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
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-500/10 hover:shadow-lg hover:shadow-indigo-500/20 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer animate-pulse"
        >
            <Video className="h-3.5 w-3.5" /> {t('meeting.join')}
        </button>
    );
}

export default function Bookings({ bookings }: Props) {
    const { auth } = usePage<any>().props;
    const { t } = useTranslation();

    useEffect(() => {
        if (!auth.user) return;

        const channel = window.Echo.channel(`pupil.${auth.user.id}`);
        
        channel.listen('.booking.updated', (e: any) => {
            toast.info(`Booking status updated: ${e.appointment.status}`);
            router.reload();
        });

        return () => {
            channel.stopListening('.booking.updated');
        };
    }, [auth.user?.id]);

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

    const handleDelete = async (id: string) => {
        if (!confirm(t('bookings.delete_confirm'))) return;
        try {
            await axios.delete(`/appointments/${id}`);
            toast.success(t('bookings.delete_success'));
            router.reload();
        } catch (error: any) {
            toast.error(error.response?.data?.message || t('bookings.delete_error'));
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

    const getStatusLabel = (status: string) => {
        switch(status) {
            case 'confirmed': return t('bookings.status_confirmed');
            case 'pending': return t('bookings.status_pending');
            case 'cancelled': return t('bookings.status_cancelled');
            default: return status;
        }
    };

    return (
        <>
            <Head title={t('bookings.title')} />
            <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl border border-indigo-100 bg-gradient-to-r from-indigo-50/40 via-purple-50/20 to-transparent dark:border-indigo-950/20 dark:from-indigo-950/5 dark:via-purple-950/20">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 bg-clip-text text-transparent">
                            {t('bookings.title')}
                        </h1>
                        <p className="text-muted-foreground font-medium text-sm">{t('bookings.desc')}</p>
                    </div>
                </div>

                {/* Booking List */}
                <div className="grid gap-5">
                    {bookings.data.length > 0 ? (
                        bookings.data.map((apt) => {
                            const isPast = new Date(apt.end_at) < new Date();
                            return (
                                <div key={apt.id} className="group rounded-3xl border border-border bg-card p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-md transition-shadow duration-300">
                                    <div className="flex items-center gap-4">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 group-hover:scale-105 transition-transform shrink-0">
                                            <User className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-base text-foreground">
                                                {t('bookings.teacher_label', { name: apt.teacher?.full_name || 'Expert' })}
                                            </h4>
                                            <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-muted-foreground font-semibold">
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="h-3.5 w-3.5 text-indigo-500" />
                                                    {new Date(apt.start_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </span>
                                                <div className="h-2 w-px bg-border hidden sm:block" />
                                                <span className="flex items-center gap-1">
                                                    <Clock className="h-3.5 w-3.5 text-indigo-500" />
                                                    {new Date(apt.start_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(apt.end_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-3">
                                        <span className={`px-3 py-1 rounded-xl text-[10px] font-extrabold uppercase tracking-wider border ${
                                            apt.status === 'confirmed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200/50 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/30' :
                                            apt.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200/50 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/30' :
                                            apt.status === 'cancelled' ? 'bg-red-50 text-red-700 border-red-200/50 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/30' :
                                            'bg-muted text-muted-foreground border-transparent'
                                        }`}>
                                            {getStatusLabel(apt.status)}
                                        </span>
                                        
                                        {isPast ? (
                                            <button 
                                                onClick={() => handleDelete(apt.id)}
                                                className="flex items-center gap-1.5 rounded-xl border border-destructive/20 text-destructive px-3 py-2 text-xs font-bold hover:bg-destructive hover:text-white transition-all duration-300 cursor-pointer"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" /> {t('bookings.delete')}
                                            </button>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                {apt.status === 'confirmed' && (
                                                    <PupilMeetingButton apt={apt} handleJoin={handleJoin} />
                                                )}

                                                {(apt.status === 'confirmed' || apt.status === 'pending') && (
                                                    <button 
                                                        onClick={() => handleCancel(apt.id)}
                                                        className="flex items-center gap-1.5 rounded-xl border border-destructive/25 text-destructive px-3.5 py-2.5 text-xs font-bold hover:bg-destructive hover:text-white transition-all duration-300 cursor-pointer"
                                                    >
                                                        <XCircle className="h-3.5 w-3.5" /> {t('dashboard.cancel_button')}
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="rounded-3xl border border-dashed border-border bg-card p-16 text-center text-muted-foreground">
                            <BookOpen className="mx-auto h-10 w-10 text-muted-foreground/45 mb-4 animate-pulse" />
                            <p className="font-bold text-base text-foreground mb-1">{t('bookings.none')}</p>
                            <p className="text-sm text-muted-foreground mb-5">You haven't scheduled any speaking lessons yet.</p>
                            <Link href="/pupil/teachers" className="inline-flex items-center gap-1.5 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:shadow-lg transition-all hover:scale-102">
                                Browse Teachers <Sparkles className="h-3.5 w-3.5" />
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

Bookings.layout = {
    breadcrumbs: [{ title: 'my bookings', href: '/pupil/bookings' }]
};

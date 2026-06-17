import React, { useEffect, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, router, usePage } from '@inertiajs/react';
import { Calendar, Clock, User, Video, XCircle, Trash2 } from 'lucide-react';
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
                className="flex items-center gap-2 rounded-xl bg-muted px-4 py-2 text-sm font-semibold text-muted-foreground cursor-not-allowed border"
            >
                <Clock className="h-4 w-4" /> {t('meeting.scheduled')}
            </button>
        );
    }

    return (
        <button 
            onClick={() => handleJoin(apt)}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-all shadow-md shadow-indigo-500/20 cursor-pointer"
        >
            <Video className="h-4 w-4" /> {t('meeting.join')}
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
            router.reload({ preserveState: false });
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
        <AppLayout>
            <Head title={t('bookings.title')} />
            <div className="p-6 md:p-8 max-w-5xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">{t('bookings.title')}</h1>
                    <p className="text-muted-foreground mt-2">{t('bookings.desc')}</p>
                </div>

                <div className="grid gap-4">
                    {bookings.data.length > 0 ? (
                        bookings.data.map((apt) => (
                            <div key={apt.id} className="rounded-2xl border bg-card p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-4">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 shrink-0">
                                        <User className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-foreground">
                                            {t('bookings.teacher_label', { name: apt.teacher?.full_name || 'Expert' })}
                                        </h4>
                                        <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="h-3.5 w-3.5" />
                                                {new Date(apt.start_at).toLocaleDateString()}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Clock className="h-3.5 w-3.5" />
                                                {new Date(apt.start_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                                        apt.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                                        apt.status === 'pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                                        apt.status === 'cancelled' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                        'bg-muted text-muted-foreground'
                                    }`}>
                                        {getStatusLabel(apt.status)}
                                    </span>
                                    
                                    {new Date(apt.end_at) < new Date() ? (
                                        <button 
                                            onClick={() => handleDelete(apt.id)}
                                            className="flex items-center gap-1.5 rounded-xl border border-destructive/20 text-destructive px-3 py-2 text-sm font-medium hover:bg-destructive hover:text-destructive-foreground transition-all cursor-pointer"
                                        >
                                            <Trash2 className="h-4 w-4" /> {t('bookings.delete')}
                                        </button>
                                    ) : (
                                        <>
                                            {apt.status === 'confirmed' && (
                                                <PupilMeetingButton apt={apt} handleJoin={handleJoin} />
                                            )}

                                            {(apt.status === 'confirmed' || apt.status === 'pending') && (
                                                <button 
                                                    onClick={() => handleCancel(apt.id)}
                                                    className="flex items-center gap-1.5 rounded-xl border border-destructive/20 text-destructive px-3 py-2 text-sm font-medium hover:bg-destructive hover:text-destructive-foreground transition-all cursor-pointer"
                                                >
                                                    <XCircle className="h-4 w-4" /> {t('dashboard.cancel_button')}
                                                </button>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-20 border rounded-2xl bg-muted/10 border-dashed">
                            <p className="text-muted-foreground">{t('bookings.none')}</p>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}

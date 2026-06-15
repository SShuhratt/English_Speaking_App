import React, { useEffect } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, router, usePage } from '@inertiajs/react';
import { Calendar, Clock, User, Video, XCircle } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

interface Props {
    bookings: {
        data: any[];
    };
}

export default function Bookings({ bookings }: Props) {
    const { auth } = usePage<any>().props;

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
        if (!confirm('Are you sure you want to cancel this booking?')) return;
        try {
            await axios.delete(`/bookings/${id}`);
            toast.success('Booking cancelled successfully');
            router.reload();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to cancel booking');
        }
    };

    const handleJoin = (apt: any) => {
        if (!apt.google_meet_link) {
            toast.error('Teacher is not ready yet');
        } else {
            window.open(apt.google_meet_link, '_blank');
        }
    };

    return (
        <AppLayout>
            <Head title="My Bookings" />
            <div className="p-6 md:p-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight">My Bookings</h1>
                    <p className="text-muted-foreground mt-2">Manage your upcoming and pending lesson requests.</p>
                </div>

                <div className="grid gap-4">
                    {bookings.data.length > 0 ? (
                        bookings.data.map((apt) => (
                            <div key={apt.id} className="rounded-2xl border bg-card p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30">
                                        <User className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-foreground">Teacher: {apt.teacher?.full_name || 'Expert'}</h4>
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
                                        {apt.status}
                                    </span>
                                    
                                    {apt.status === 'confirmed' && (
                                        <button 
                                            onClick={() => handleJoin(apt)}
                                            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-all"
                                        >
                                            <Video className="h-4 w-4" /> Join
                                        </button>
                                    )}

                                    {(apt.status === 'confirmed' || apt.status === 'pending') && (
                                        <button 
                                            onClick={() => handleCancel(apt.id)}
                                            className="flex items-center gap-1.5 rounded-xl border border-destructive/20 text-destructive px-3 py-2 text-sm font-medium hover:bg-destructive hover:text-destructive-foreground transition-all"
                                        >
                                            <XCircle className="h-4 w-4" /> Cancel
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-20 border rounded-2xl bg-muted/10 border-dashed">
                            <p className="text-muted-foreground">You haven't booked any sessions yet.</p>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}

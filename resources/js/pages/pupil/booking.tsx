import React, { useState, useEffect } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, usePage } from '@inertiajs/react';
import { Calendar as CalendarIcon, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

interface Props {
    teacher: any;
}

export default function Booking({ teacher }: Props) {
    const { auth } = usePage<any>().props;
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [slots, setSlots] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [booking, setBooking] = useState(false);

    const fetchSlots = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`/bookings/slots/${teacher.id}?date=${selectedDate}`);
            setSlots(response.data.slots);
        } catch (error) {
            toast.error('Failed to load slots');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSlots();

        // LIVE SYNC: Listen for booking updates
        const channel = window.Echo.channel(`teacher.${teacher.id}`);
        channel.listen('.booking.updated', (e: any) => {
            console.log('Booking updated event received:', e);
            fetchSlots(); // Refresh slots instantly
        });

        return () => {
            window.Echo.leaveChannel(`teacher.${teacher.id}`);
        };
    }, [selectedDate, teacher.id]);

    const handleBook = async (slot: any) => {
        setBooking(true);
        try {
            await axios.post('/bookings', {
                teacher_id: teacher.id,
                pupil_id: auth.user.id,
                start_at: slot.start_at,
                end_at: slot.end_at,
            });
            toast.success('Session booked! Waiting for teacher approval.');
            fetchSlots();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Booking failed');
        } finally {
            setBooking(false);
        }
    };

    return (
        <AppLayout>
            <Head title={`Book with ${teacher.full_name}`} />
            <div className="max-w-4xl mx-auto p-6 md:p-8">
                <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Book a Session</h1>
                        <p className="text-muted-foreground mt-2">Practice with {teacher.full_name}</p>
                    </div>
                    
                    <div className="flex items-center gap-4 bg-muted/50 p-2 rounded-xl">
                        <CalendarIcon className="h-5 w-5 text-indigo-500 ml-2" />
                        <input 
                            type="date" 
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                            className="bg-transparent border-none focus:ring-0 text-sm font-medium pr-4"
                        />
                    </div>
                </div>

                <div className="grid gap-6">
                    <div className="rounded-2xl border bg-card p-6 shadow-sm">
                        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                            <Clock className="h-5 w-5 text-indigo-500" /> Available Slots
                        </h2>

                        {loading ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 animate-pulse">
                                {[...Array(8)].map((_, i) => (
                                    <div key={i} className="h-12 bg-muted rounded-xl"></div>
                                ))}
                            </div>
                        ) : slots.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                {slots.map((slot, index) => {
                                    const start = new Date(slot.start_at);
                                    return (
                                        <button
                                            key={index}
                                            onClick={() => handleBook(slot)}
                                            disabled={booking}
                                            className="flex flex-col items-center justify-center rounded-xl border p-3 transition-all hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 group"
                                        >
                                            <span className="text-sm font-bold group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                                                {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground uppercase mt-1">
                                                30 min
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-12 bg-muted/20 rounded-xl border border-dashed">
                                <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                                <p className="text-muted-foreground">No slots available for this date.</p>
                            </div>
                        )}
                    </div>

                    <div className="rounded-2xl border border-indigo-100 bg-indigo-50/30 p-6 dark:border-indigo-900/30 dark:bg-indigo-900/5">
                        <h3 className="font-semibold flex items-center gap-2 mb-2">
                            <CheckCircle2 className="h-4 w-4 text-indigo-500" /> Instant Booking Sync
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            Slots disappear instantly as they are booked by other students. You are seeing live availability.
                        </p>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

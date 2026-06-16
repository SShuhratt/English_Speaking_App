import React, { useState, useEffect } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, usePage } from '@inertiajs/react';
import { Calendar as CalendarIcon, Clock, CheckCircle2, AlertCircle, Award, Star } from 'lucide-react';
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
    const [customStartTime, setCustomStartTime] = useState('');
    const [customEndTime, setCustomEndTime] = useState('');

    const handleBookCustom = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!customStartTime || !customEndTime) {
            toast.error('Please select start and end times');
            return;
        }

        try {
            const [year, month, day] = selectedDate.split('-').map(Number);
            const [startHour, startMin] = customStartTime.split(':').map(Number);
            const [endHour, endMin] = customEndTime.split(':').map(Number);

            const startLocal = new Date(year, month - 1, day, startHour, startMin);
            const endLocal = new Date(year, month - 1, day, endHour, endMin);

            // If end time is before or equal to start time, it belongs to the next day
            if (endLocal <= startLocal) {
                endLocal.setDate(endLocal.getDate() + 1);
            }

            const startAt = startLocal.toISOString();
            const endAt = endLocal.toISOString();

            setBooking(true);
            await axios.post('/bookings', {
                teacher_id: teacher.id,
                pupil_id: auth.user.id,
                start_at: startAt,
                end_at: endAt,
            });
            toast.success('Custom session requested! Waiting for teacher approval.');
            fetchSlots();
            setCustomStartTime('');
            setCustomEndTime('');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Booking failed');
        } finally {
            setBooking(false);
        }
    };

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
                        <p className="text-muted-foreground mt-2">Reserve a time for your practice session.</p>
                    </div>
                    
                    <div className="flex items-center gap-4 bg-muted/50 p-2 rounded-xl">
                        <CalendarIcon className="h-5 w-5 text-indigo-500 ml-2" />
                        <input 
                            type="date" 
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                            className="bg-transparent border-none focus:ring-0 text-sm font-medium pr-4 focus:outline-none"
                        />
                    </div>
                </div>

                {/* Teacher Profile Card */}
                <div className="rounded-2xl border bg-card p-6 shadow-sm mb-6 flex flex-col md:flex-row gap-6 items-start">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-3xl font-bold text-white shadow-lg shrink-0 mx-auto md:mx-0">
                        {teacher.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                    </div>
                    <div className="flex-1 text-center md:text-left space-y-3 w-full">
                        <div>
                            <h2 className="text-2xl font-bold text-foreground">{teacher.full_name}</h2>
                            <p className="text-sm text-muted-foreground mt-0.5">{teacher.email}</p>
                        </div>
                        
                        <div className="flex flex-wrap justify-center md:justify-start gap-2">
                            <span className="inline-flex items-center rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-700/10 dark:bg-indigo-950/40 dark:text-indigo-400">
                                IELTS Level: {teacher.teacher_profile?.overall_level || 'Certified'}
                            </span>
                            {teacher.teacher_profile?.speaking_band && (
                                <span className="inline-flex items-center rounded-md bg-purple-50 px-2.5 py-1 text-xs font-semibold text-purple-700 ring-1 ring-inset ring-purple-700/10 dark:bg-purple-950/40 dark:text-purple-400">
                                    Speaking Band: {teacher.teacher_profile.speaking_band}
                                </span>
                            )}
                            <span className="inline-flex items-center rounded-md bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-700/10 dark:bg-amber-950/40 dark:text-amber-400">
                                Experience: {teacher.teacher_profile?.experience_years || 0} Years
                            </span>
                            {teacher.teacher_profile?.rating_cache && (
                                <span className="inline-flex items-center rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-700/10 dark:bg-emerald-950/40 dark:text-emerald-400">
                                    ★ {teacher.teacher_profile.rating_cache} Rating
                                </span>
                            )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-muted-foreground pt-3 border-t w-full">
                            {teacher.teacher_profile?.workplace && (
                                <div>
                                    <span className="font-semibold text-foreground">Workplace:</span> {teacher.teacher_profile.workplace}
                                </div>
                            )}
                            {teacher.teacher_profile?.age && (
                                <div>
                                    <span className="font-semibold text-foreground">Age:</span> {teacher.teacher_profile.age}
                                </div>
                            )}
                            {teacher.teacher_profile?.phone_number && (
                                <div>
                                    <span className="font-semibold text-foreground">Phone:</span> {teacher.teacher_profile.phone_number}
                                </div>
                            )}
                        </div>

                        {teacher.teacher_profile?.certificates && Array.isArray(teacher.teacher_profile.certificates) && teacher.teacher_profile.certificates.length > 0 && (
                            <div className="pt-2">
                                <span className="text-sm font-semibold text-foreground block mb-1">Certificates:</span>
                                <div className="flex flex-wrap gap-1.5 justify-center md:justify-start">
                                    {teacher.teacher_profile.certificates.map((cert: string, idx: number) => (
                                        <span key={idx} className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground border">
                                            {cert}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
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
                        ) : (() => {
                            const filteredSlots = slots.filter((slot) => {
                                const start = new Date(slot.start_at);
                                const y = start.getFullYear();
                                const m = String(start.getMonth() + 1).padStart(2, '0');
                                const d = String(start.getDate()).padStart(2, '0');
                                return `${y}-${m}-${d}` === selectedDate;
                            });

                            return filteredSlots.length > 0 ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                    {filteredSlots.map((slot, index) => {
                                        const start = new Date(slot.start_at);
                                        return (
                                            <button
                                                key={index}
                                                onClick={() => handleBook(slot)}
                                                disabled={booking}
                                                className="flex flex-col items-center justify-center rounded-xl border p-3 transition-all hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 group cursor-pointer"
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
                            );
                        })()}
                    </div>

                    <div className="rounded-2xl border bg-card p-6 shadow-sm">
                        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                            <Clock className="h-5 w-5 text-indigo-500" /> Or Request a Custom Time
                        </h2>
                        
                        <form onSubmit={handleBookCustom} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-muted-foreground mb-1">Start Time</label>
                                    <input 
                                        type="time" 
                                        value={customStartTime}
                                        onChange={(e) => setCustomStartTime(e.target.value)}
                                        className="w-full rounded-xl border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-muted-foreground mb-1">End Time</label>
                                    <input 
                                        type="time" 
                                        value={customEndTime}
                                        onChange={(e) => setCustomEndTime(e.target.value)}
                                        className="w-full rounded-xl border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                        required
                                    />
                                </div>
                            </div>
                            
                            <button
                                type="submit"
                                disabled={booking}
                                className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 hover:from-indigo-600 hover:to-purple-700 transition-all disabled:opacity-50 cursor-pointer text-center"
                            >
                                {booking ? 'Requesting...' : 'Request Custom Session'}
                            </button>
                        </form>
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

import React, { useState, useEffect } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { Check, X, Clock, Calendar, User } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

export default function Appointments() {
    const [appointments, setAppointments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchAppointments = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/teacher/appointments');
            setAppointments(response.data.data);
        } catch (error) {
            toast.error('Failed to load appointments');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAppointments();
    }, []);

    const handleAction = async (id: string, action: 'approve' | 'reject') => {
        try {
            await axios.post(`/teacher/appointments/${id}/${action}`);
            toast.success(`Appointment ${action}d successfully`);
            fetchAppointments();
        } catch (error) {
            toast.error(`Failed to ${action} appointment`);
        }
    };

    return (
        <AppLayout>
            <Head title="Manage Appointments" />
            <div className="p-6 md:p-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight">Booking Requests</h1>
                    <p className="text-muted-foreground mt-2">Manage your upcoming sessions and approval requests.</p>
                </div>

                <div className="grid gap-4">
                    {loading ? (
                        <div className="text-center py-20">Loading...</div>
                    ) : appointments.length > 0 ? (
                        appointments.map((apt) => (
                            <div key={apt.id} className="rounded-2xl border bg-card p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30">
                                        <User className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-foreground">{apt.pupil?.full_name || 'Student'}</h4>
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
                                    {apt.status === 'pending' ? (
                                        <>
                                            <button 
                                                onClick={() => handleAction(apt.id, 'approve')}
                                                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition-all"
                                            >
                                                <Check className="h-4 w-4" /> Approve
                                            </button>
                                            <button 
                                                onClick={() => handleAction(apt.id, 'reject')}
                                                className="flex items-center gap-2 rounded-xl border border-destructive text-destructive px-4 py-2 text-sm font-semibold hover:bg-destructive hover:text-white transition-all"
                                            >
                                                <X className="h-4 w-4" /> Reject
                                            </button>
                                        </>
                                    ) : (
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                                            apt.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                                            apt.status === 'rejected' ? 'bg-destructive/10 text-destructive' :
                                            'bg-muted text-muted-foreground'
                                        }`}>
                                            {apt.status}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-20 border rounded-2xl bg-muted/10 border-dashed">
                            <p className="text-muted-foreground">No appointment requests found.</p>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}

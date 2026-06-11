import React from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { Video, User, Calendar, Clock } from 'lucide-react';

interface Props {
    appointments: {
        data: any[];
    };
}

export default function Sessions({ appointments }: Props) {
    return (
        <AppLayout>
            <Head title="My Sessions" />
            <div className="p-6 md:p-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight">My Sessions</h1>
                    <p className="text-muted-foreground mt-2">History of your past and upcoming teaching sessions.</p>
                </div>

                <div className="grid gap-4">
                    {appointments.data.length > 0 ? (
                        appointments.data.map((apt) => (
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
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                                        apt.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                                        apt.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                        'bg-muted text-muted-foreground'
                                    }`}>
                                        {apt.status}
                                    </span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-20 border rounded-2xl bg-muted/10 border-dashed">
                            <p className="text-muted-foreground">No sessions found.</p>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}

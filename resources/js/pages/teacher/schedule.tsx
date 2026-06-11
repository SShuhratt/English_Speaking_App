import React from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { Calendar, Clock, User, Video } from 'lucide-react';

interface Props {
    appointments: any[];
}

export default function Schedule({ appointments }: Props) {
    return (
        <AppLayout>
            <Head title="My Schedule" />
            <div className="p-6 md:p-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight">My Schedule</h1>
                    <p className="text-muted-foreground mt-2">Your upcoming confirmed sessions.</p>
                </div>

                <div className="grid gap-4">
                    {appointments.length > 0 ? (
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
                                    <a 
                                        href={apt.google_meet_link || '#'} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
                                            apt.google_meet_link 
                                            ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                                            : 'bg-muted text-muted-foreground cursor-not-allowed'
                                        }`}
                                    >
                                        <Video className="h-4 w-4" /> Join Meeting
                                    </a>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-20 border rounded-2xl bg-muted/10 border-dashed">
                            <p className="text-muted-foreground">No upcoming sessions scheduled.</p>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}

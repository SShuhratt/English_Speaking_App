import React from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { Video, User, Calendar, Clock, Star } from 'lucide-react';

interface Props {
    sessions: {
        data: any[];
    };
}

export default function Sessions({ sessions }: Props) {
    return (
        <AppLayout>
            <Head title="Past Sessions" />
            <div className="p-6 md:p-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight">Past Sessions</h1>
                    <p className="text-muted-foreground mt-2">A history of your completed English practice sessions.</p>
                </div>

                <div className="grid gap-4">
                    {sessions.data.length > 0 ? (
                        sessions.data.map((apt) => (
                            <div key={apt.id} className="rounded-2xl border bg-card p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30">
                                        <User className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-foreground">{apt.teacher?.full_name || 'Teacher'}</h4>
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
                                    <button className="flex items-center gap-2 rounded-xl border border-indigo-200 px-4 py-2 text-sm font-semibold text-indigo-600 hover:bg-indigo-50 transition-all">
                                        <Star className="h-4 w-4" /> Leave Feedback
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-20 border rounded-2xl bg-muted/10 border-dashed">
                            <p className="text-muted-foreground">No past sessions found.</p>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}

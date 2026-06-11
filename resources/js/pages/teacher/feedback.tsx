import React from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { MessageSquare, User, Star } from 'lucide-react';

interface Props {
    feedbacks: {
        data: any[];
    };
}

export default function Feedback({ feedbacks }: Props) {
    return (
        <AppLayout>
            <Head title="Pupil Feedback" />
            <div className="p-6 md:p-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight">Pupil Feedback</h1>
                    <p className="text-muted-foreground mt-2">See what your students are saying about your sessions.</p>
                </div>

                <div className="grid gap-6">
                    {feedbacks.data.length > 0 ? (
                        feedbacks.data.map((fb) => (
                            <div key={fb.id} className="rounded-2xl border bg-card p-6 shadow-sm">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                                            <User className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold">{fb.pupil?.full_name || 'Anonymous Student'}</h4>
                                            <p className="text-xs text-muted-foreground">{new Date(fb.created_at).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 text-amber-500">
                                        <Star className="h-4 w-4 fill-current" />
                                        <span className="font-bold">{fb.rating}</span>
                                    </div>
                                </div>
                                <p className="text-sm leading-relaxed italic text-muted-foreground">
                                    "{fb.comment}"
                                </p>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-20 border rounded-2xl bg-muted/10 border-dashed">
                            <p className="text-muted-foreground">No feedback received yet.</p>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}

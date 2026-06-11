import React from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { TrendingUp, Award, BookOpen, Clock } from 'lucide-react';

interface Props {
    progress: {
        total_sessions: number;
        completed_sessions: number;
        learning_path: string;
        average_rating: number;
    };
}

export default function Progress({ progress }: Props) {
    return (
        <AppLayout>
            <Head title="My Progress" />
            <div className="p-6 md:p-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight">My Progress</h1>
                    <p className="text-muted-foreground mt-2">Track your learning journey and speaking improvements.</p>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-2xl border bg-card p-6 shadow-sm">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                                <BookOpen className="h-5 w-5" />
                            </div>
                            <span className="text-sm font-medium text-muted-foreground">Path</span>
                        </div>
                        <h4 className="text-xl font-bold">{progress.learning_path}</h4>
                    </div>

                    <div className="rounded-2xl border bg-card p-6 shadow-sm">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                                <Clock className="h-5 w-5" />
                            </div>
                            <span className="text-sm font-medium text-muted-foreground">Sessions</span>
                        </div>
                        <h4 className="text-xl font-bold">{progress.completed_sessions} / {progress.total_sessions}</h4>
                    </div>

                    <div className="rounded-2xl border bg-card p-6 shadow-sm">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                                <TrendingUp className="h-5 w-5" />
                            </div>
                            <span className="text-sm font-medium text-muted-foreground">Rating</span>
                        </div>
                        <h4 className="text-xl font-bold">{progress.average_rating} / 5.0</h4>
                    </div>

                    <div className="rounded-2xl border bg-card p-6 shadow-sm">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                                <Award className="h-5 w-5" />
                            </div>
                            <span className="text-sm font-medium text-muted-foreground">Certificates</span>
                        </div>
                        <h4 className="text-xl font-bold">0 Earned</h4>
                    </div>
                </div>

                <div className="mt-8 rounded-2xl border bg-card p-8 shadow-sm text-center">
                    <TrendingUp className="h-12 w-12 text-indigo-500 mx-auto mb-4" />
                    <h3 className="text-xl font-bold mb-2">Keep Practicing!</h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                        Your speaking performance is improving. Book more sessions to level up your fluency and accuracy.
                    </p>
                </div>
            </div>
        </AppLayout>
    );
}

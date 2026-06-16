import React, { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, useForm, usePage } from '@inertiajs/react';
import { Video, User, Calendar, Clock, Star, MessageSquare } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface Props {
    sessions: {
        data: any[];
    };
}

export default function Sessions({ sessions }: Props) {
    const { auth } = usePage().props as any;
    const [isOpen, setIsOpen] = useState(false);
    const [selectedApt, setSelectedApt] = useState<any>(null);

    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        appointment_id: '',
        rating_score: '10',
        comment_text: '',
    });

    const handleOpenFeedbackModal = (apt: any) => {
        setData({
            appointment_id: apt.id,
            rating_score: '10',
            comment_text: '',
        });
        clearErrors();
        setSelectedApt(apt);
        setIsOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/feedback', {
            onSuccess: () => {
                setIsOpen(false);
                reset();
            },
        });
    };

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
                        sessions.data.map((apt) => {
                            const pupilFeedback = apt.feedbacks?.find((fb: any) => fb.author_id === auth.user.id);
                            return (
                                <div key={apt.id} className="rounded-2xl border bg-card p-5 shadow-sm flex flex-col gap-4">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
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

                                        <div className="flex items-center gap-3 self-end md:self-auto">
                                            {!pupilFeedback ? (
                                                <button
                                                    onClick={() => handleOpenFeedbackModal(apt)}
                                                    className="flex items-center gap-2 rounded-xl border border-indigo-200 px-4 py-2 text-sm font-semibold text-indigo-600 hover:bg-indigo-50 transition-all cursor-pointer"
                                                >
                                                    <Star className="h-4 w-4" /> Leave Feedback
                                                </button>
                                            ) : (
                                                <span className="text-xs bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400 px-3 py-1 rounded-full font-medium">
                                                    Feedback Left
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {pupilFeedback && (
                                        <div className="mt-1 p-4 bg-muted/40 rounded-xl border border-dashed text-sm">
                                            <div className="flex items-center gap-1.5 text-amber-500 font-semibold mb-2">
                                                <Star className="h-3.5 w-3.5 fill-current" />
                                                <span>{pupilFeedback.rating}/10</span>
                                                <span className="text-muted-foreground font-normal text-xs ml-auto">Your Review</span>
                                            </div>
                                            <p className="text-muted-foreground italic">"{pupilFeedback.comment}"</p>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    ) : (
                        <div className="text-center py-20 border rounded-2xl bg-muted/10 border-dashed">
                            <p className="text-muted-foreground">No past sessions found.</p>
                        </div>
                    )}
                </div>
            </div>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Leave Feedback</DialogTitle>
                        <DialogDescription>
                            Share your feedback for your session with {selectedApt?.teacher?.full_name}.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Session Rating ({data.rating_score}/10)</label>
                            <div className="grid grid-cols-5 gap-2 mt-1">
                                {Array.from({ length: 10 }, (_, i) => i + 1).map((val) => (
                                    <button
                                        key={val}
                                        type="button"
                                        onClick={() => setData('rating_score', val.toString())}
                                        className={`py-2 text-sm font-semibold rounded-xl transition-all duration-200 border cursor-pointer ${
                                            data.rating_score === val.toString()
                                                ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-100 dark:shadow-none'
                                                : 'border-muted hover:bg-muted text-muted-foreground bg-background'
                                        }`}
                                    >
                                        {val}
                                    </button>
                                ))}
                            </div>
                            {errors.rating_score && (
                                <p className="text-xs text-destructive">{errors.rating_score}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Your Comments</label>
                            <textarea
                                value={data.comment_text}
                                onChange={(e) => setData('comment_text', e.target.value)}
                                placeholder="Describe your session. How was the teacher's pace, clarity, and helpfulness?"
                                className="w-full min-h-[120px] rounded-xl border border-muted bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none"
                                required
                            />
                            {errors.comment_text && (
                                <p className="text-xs text-destructive">{errors.comment_text}</p>
                            )}
                        </div>

                        <DialogFooter>
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="px-4 py-2 border border-muted rounded-xl text-sm font-semibold hover:bg-muted transition-all cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={processing}
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-50 cursor-pointer"
                            >
                                {processing ? 'Submitting...' : 'Submit Feedback'}
                            </button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}

import React, { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, useForm, usePage, router } from '@inertiajs/react';
import { Video, User, Calendar, Clock, Star, MessageSquare, Trash2 } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/use-translation';
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
    const { t } = useTranslation();
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

    const handleDelete = async (id: string) => {
        if (!confirm(t('bookings.delete_confirm'))) return;
        try {
            await axios.delete(`/appointments/${id}`);
            toast.success(t('bookings.delete_success'));
            router.reload();
        } catch (error: any) {
            toast.error(error.response?.data?.message || t('bookings.delete_error'));
        }
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
            <Head title={t('sessions.past_title')} />
            <div className="p-6 md:p-8 max-w-5xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">{t('sessions.past_title')}</h1>
                    <p className="text-muted-foreground mt-2">{t('sessions.past_desc')}</p>
                </div>

                <div className="grid gap-4">
                    {sessions.data.length > 0 ? (
                        sessions.data.map((apt) => {
                            const pupilFeedback = apt.feedbacks?.find((fb: any) => fb.author_id === auth.user.id);
                            return (
                                <div key={apt.id} className="rounded-2xl border bg-card p-5 shadow-sm flex flex-col gap-4 hover:shadow-md transition-shadow">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 shrink-0">
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
                                                    <Star className="h-4 w-4" /> {t('sessions.leave_feedback')}
                                                </button>
                                            ) : (
                                                <span className="text-xs bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400 px-3 py-1 rounded-full font-medium">
                                                    {t('sessions.feedback_left')}
                                                </span>
                                            )}

                                            <button 
                                                onClick={() => handleDelete(apt.id)}
                                                className="flex items-center gap-1.5 rounded-xl border border-destructive/20 text-destructive px-3 py-2 text-sm font-medium hover:bg-destructive hover:text-destructive-foreground transition-all cursor-pointer"
                                            >
                                                <Trash2 className="h-4 w-4" /> {t('bookings.delete')}
                                            </button>
                                        </div>
                                    </div>

                                    {pupilFeedback && (
                                        <div className="mt-1 p-4 bg-muted/40 rounded-xl border border-dashed text-sm">
                                            <div className="flex items-center gap-1.5 text-amber-500 font-semibold mb-2">
                                                <Star className="h-3.5 w-3.5 fill-current" />
                                                <span>{pupilFeedback.rating}/10</span>
                                                <span className="text-muted-foreground font-normal text-xs ml-auto">{t('sessions.your_review')}</span>
                                            </div>
                                            <p className="text-muted-foreground italic">"{pupilFeedback.comment}"</p>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    ) : (
                        <div className="text-center py-20 border rounded-2xl bg-muted/10 border-dashed">
                            <p className="text-muted-foreground">{t('sessions.none')}</p>
                        </div>
                    )}
                </div>
            </div>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="rounded-2xl max-w-md">
                    <DialogHeader>
                        <DialogTitle>{t('sessions.leave_feedback')}</DialogTitle>
                        <DialogDescription>
                            {t('sessions.dialog_desc', { name: selectedApt?.teacher?.full_name || 'Teacher' })}
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">
                                {t('sessions.rating_label', { score: data.rating_score })}
                            </label>
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
                            <label className="text-sm font-medium text-foreground">{t('sessions.comments_label')}</label>
                            <textarea
                                value={data.comment_text}
                                onChange={(e) => setData('comment_text', e.target.value)}
                                placeholder={t('sessions.comments_placeholder')}
                                className="w-full min-h-[120px] rounded-xl border border-muted bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none"
                                required
                            />
                            {errors.comment_text && (
                                <p className="text-xs text-destructive">{errors.comment_text}</p>
                            )}
                        </div>

                        <DialogFooter className="gap-2 sm:gap-0">
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="px-4 py-2 border border-muted rounded-xl text-sm font-semibold hover:bg-muted transition-all cursor-pointer"
                            >
                                {t('dashboard.cancel_button')}
                            </button>
                            <button
                                type="submit"
                                disabled={processing}
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-50 cursor-pointer"
                            >
                                {processing ? t('sessions.submitting') : t('sessions.submit_btn')}
                            </button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}

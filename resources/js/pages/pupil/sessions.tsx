import React, { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, useForm, usePage, router } from '@inertiajs/react';
import { Video, User, Calendar, Clock, Star, MessageSquare, Trash2, Sparkles } from 'lucide-react';
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
        <AppLayout breadcrumbs={[{ title: t('sessions.past_title'), href: '/pupil/sessions' }]}>
            <Head title={t('sessions.past_title')} />
            <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl border border-indigo-100 bg-gradient-to-r from-indigo-50/40 via-purple-50/20 to-transparent dark:border-indigo-950/20 dark:from-indigo-950/5 dark:via-purple-950/20">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 bg-clip-text text-transparent">
                            {t('sessions.past_title')}
                        </h1>
                        <p className="text-muted-foreground font-medium text-sm">{t('sessions.past_desc')}</p>
                    </div>
                </div>

                {/* Session Cards */}
                <div className="grid gap-5">
                    {sessions.data.length > 0 ? (
                        sessions.data.map((apt) => {
                            const pupilFeedback = apt.feedbacks?.find((fb: any) => fb.author_id === auth.user.id);
                            return (
                                <div key={apt.id} className="group rounded-3xl border border-border bg-card p-6 shadow-sm flex flex-col gap-5 hover:shadow-md transition-shadow duration-300">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 group-hover:scale-105 transition-transform shrink-0">
                                                <User className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-base text-foreground">{apt.teacher?.full_name || 'Teacher'}</h4>
                                                <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-muted-foreground font-semibold">
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="h-3.5 w-3.5 text-indigo-500" />
                                                        {new Date(apt.start_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    </span>
                                                    <div className="h-2 w-px bg-border hidden sm:block" />
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="h-3.5 w-3.5 text-indigo-500" />
                                                        {new Date(apt.start_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(apt.end_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2.5 self-end md:self-auto">
                                            {!pupilFeedback ? (
                                                <button
                                                    onClick={() => handleOpenFeedbackModal(apt)}
                                                    className="flex items-center gap-2 rounded-xl bg-indigo-500/5 hover:bg-indigo-500/10 border border-indigo-500/10 px-4 py-2.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 transition-all cursor-pointer"
                                                >
                                                    <Star className="h-3.5 w-3.5 fill-current" /> {t('sessions.leave_feedback')}
                                                </button>
                                            ) : (
                                                <span className="text-[10px] bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 px-3 py-1.5 rounded-xl font-bold uppercase tracking-wide border border-emerald-500/10">
                                                    {t('sessions.feedback_left')}
                                                </span>
                                            )}

                                            <button 
                                                onClick={() => handleDelete(apt.id)}
                                                className="flex items-center gap-1.5 rounded-xl border border-destructive/20 text-destructive px-3.5 py-2.5 text-xs font-bold hover:bg-destructive hover:text-white transition-all duration-300 cursor-pointer"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" /> {t('bookings.delete')}
                                            </button>
                                        </div>
                                    </div>

                                    {pupilFeedback && (
                                        <div className="mt-1 p-4 rounded-2xl bg-muted/30 border border-dashed border-border/80 text-sm">
                                            <div className="flex items-center gap-1.5 text-amber-500 font-bold mb-2">
                                                <Star className="h-4 w-4 fill-current" />
                                                <span>{pupilFeedback.rating}/10</span>
                                                <span className="text-muted-foreground font-semibold text-[11px] ml-auto">{t('sessions.your_review')}</span>
                                            </div>
                                            <p className="text-muted-foreground italic font-medium">"{pupilFeedback.comment}"</p>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    ) : (
                        <div className="rounded-3xl border border-dashed border-border bg-card p-16 text-center text-muted-foreground">
                            <Clock className="mx-auto h-10 w-10 text-muted-foreground/45 mb-4 animate-pulse" />
                            <p className="font-bold text-base text-foreground mb-1">{t('sessions.none')}</p>
                            <p className="text-sm text-muted-foreground">You don't have any past completed sessions.</p>
                        </div>
                    )}
                </div>
            </div>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="rounded-3xl max-w-md border border-border bg-card shadow-2xl p-6">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black tracking-tight">{t('sessions.leave_feedback')}</DialogTitle>
                        <DialogDescription className="text-sm font-medium text-muted-foreground">
                            {t('sessions.dialog_desc', { name: selectedApt?.teacher?.full_name || 'Teacher' })}
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                        <div className="space-y-2.5">
                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                {t('sessions.rating_label', { score: data.rating_score })}
                            </label>
                            <div className="grid grid-cols-5 gap-2 mt-1.5">
                                {Array.from({ length: 10 }, (_, i) => i + 1).map((val) => (
                                    <button
                                        key={val}
                                        type="button"
                                        onClick={() => setData('rating_score', val.toString())}
                                        className={`py-2.5 text-xs font-bold rounded-xl transition-all duration-200 border cursor-pointer ${
                                            data.rating_score === val.toString()
                                                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 border-transparent text-white shadow-md shadow-indigo-500/10'
                                                : 'border-border hover:bg-muted text-muted-foreground bg-card'
                                        }`}
                                    >
                                        {val}
                                    </button>
                                ))}
                            </div>
                            {errors.rating_score && (
                                <p className="text-xs text-destructive font-bold">{errors.rating_score}</p>
                            )}
                        </div>

                        <div className="space-y-2.5">
                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('sessions.comments_label')}</label>
                            <textarea
                                value={data.comment_text}
                                onChange={(e) => setData('comment_text', e.target.value)}
                                placeholder={t('sessions.comments_placeholder')}
                                className="w-full min-h-[120px] rounded-2xl border border-border bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none font-medium"
                                required
                            />
                            {errors.comment_text && (
                                <p className="text-xs text-destructive font-bold">{errors.comment_text}</p>
                            )}
                        </div>

                        <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-border/55">
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="px-4 py-2.5 border border-border rounded-xl text-xs font-bold hover:bg-muted transition-all cursor-pointer"
                            >
                                {t('dashboard.cancel_button')}
                            </button>
                            <button
                                type="submit"
                                disabled={processing}
                                className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-md shadow-indigo-500/10"
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

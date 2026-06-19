import React, { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, useForm, usePage, router } from '@inertiajs/react';
import { User, Calendar, Clock, MessageSquare, Trash2 } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { useTranslation } from '@/hooks/use-translation';

interface Props {
    appointments: {
        data: any[];
    };
}

export default function Sessions({ appointments }: Props) {
    const { auth } = usePage().props as any;
    const [isOpen, setIsOpen] = useState(false);
    const [selectedApt, setSelectedApt] = useState<any>(null);
    const { t } = useTranslation();

    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        appointment_id: '',
        comment_text: '',
    });

    const handleOpenFeedbackModal = (apt: any) => {
        setData({
            appointment_id: apt.id,
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
        <>
            <Head title={t('teacher.sessions_title')} />
            <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl border border-indigo-100 bg-gradient-to-r from-indigo-50/40 via-purple-50/20 to-transparent dark:border-indigo-950/20 dark:from-indigo-950/5 dark:via-purple-950/20">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 bg-clip-text text-transparent">
                            {t('teacher.sessions_title')}
                        </h1>
                        <p className="text-muted-foreground font-medium text-sm">{t('teacher.sessions_desc')}</p>
                    </div>
                </div>

                {/* Main Session List */}
                <div className="grid gap-5">
                    {appointments.data.length > 0 ? (
                        appointments.data.map((apt) => {
                            const teacherFeedback = apt.feedbacks?.find((fb: any) => fb.author_id === auth.user.id);
                            const isPast = new Date(apt.end_at) < new Date();
                            return (
                                <div key={apt.id} className="group rounded-3xl border border-border bg-card p-6 shadow-sm flex flex-col gap-5 hover:shadow-md transition-shadow duration-300">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 group-hover:scale-105 transition-transform shrink-0">
                                                <User className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-base text-foreground">{apt.pupil?.full_name || 'Student'}</h4>
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
                                            <span className={`px-3 py-1 rounded-xl text-[10px] font-extrabold uppercase tracking-wider border ${
                                                apt.status === 'confirmed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200/50 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/30' :
                                                apt.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200/50 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/30' :
                                                'bg-muted text-muted-foreground border-transparent'
                                            }`}>
                                                {t(`bookings.status_${apt.status}`)}
                                            </span>

                                            {apt.status === 'confirmed' && (
                                                <>
                                                    {!teacherFeedback ? (
                                                        <button
                                                            onClick={() => handleOpenFeedbackModal(apt)}
                                                            className="flex items-center gap-2 rounded-xl bg-indigo-500/5 hover:bg-indigo-500/10 border border-indigo-500/10 px-4 py-2.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 transition-all cursor-pointer"
                                                        >
                                                            <MessageSquare className="h-3.5 w-3.5" /> {t('teacher.sessions_leave_feedback')}
                                                        </button>
                                                    ) : (
                                                        <span className="text-[10px] bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 px-3 py-1.5 rounded-xl font-bold uppercase tracking-wide border border-emerald-500/10">
                                                            {t('teacher.sessions_feedback_left')}
                                                        </span>
                                                    )}
                                                </>
                                            )}

                                            {isPast && (
                                                <button 
                                                    onClick={() => handleDelete(apt.id)}
                                                    className="flex items-center gap-1.5 rounded-xl border border-destructive/20 text-destructive px-3.5 py-2.5 text-xs font-bold hover:bg-destructive hover:text-white transition-all duration-300 cursor-pointer"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" /> {t('bookings.delete')}
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {teacherFeedback && (
                                        <div className="mt-1 p-4 rounded-2xl bg-muted/30 border border-dashed border-border/80 text-sm font-semibold">
                                            <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 mb-2">
                                                <MessageSquare className="h-4 w-4" />
                                                <span>{t('teacher.sessions_your_feedback')}</span>
                                            </div>
                                            <p className="text-muted-foreground italic font-medium">"{teacherFeedback.comment}"</p>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    ) : (
                        <div className="rounded-3xl border border-dashed border-border bg-card p-16 text-center text-muted-foreground">
                            <Clock className="mx-auto h-10 w-10 text-muted-foreground/45 mb-4 animate-pulse" />
                            <p className="font-bold text-base text-foreground mb-1">{t('teacher.sessions_none')}</p>
                            <p className="text-sm text-muted-foreground">Completed past sessions with your feedback will appear here.</p>
                        </div>
                    )}
                </div>
            </div>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="rounded-3xl max-w-md border border-border bg-card shadow-2xl p-6">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black tracking-tight">{t('teacher.sessions_dialog_title')}</DialogTitle>
                        <DialogDescription className="text-sm font-medium text-muted-foreground">
                            {t('teacher.sessions_dialog_desc', { name: selectedApt?.pupil?.full_name })}
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                        <div className="space-y-2.5">
                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('teacher.sessions_feedback_notes')}</label>
                            <textarea
                                value={data.comment_text}
                                onChange={(e) => setData('comment_text', e.target.value)}
                                placeholder={t('teacher.sessions_feedback_placeholder')}
                                className="w-full min-h-[150px] rounded-2xl border border-border bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none font-medium"
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
                                {t('common.cancel')}
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
        </>
    );
}

Sessions.layout = {
    breadcrumbs: [{ title: 'my sessions', href: '/teacher/sessions' }]
};

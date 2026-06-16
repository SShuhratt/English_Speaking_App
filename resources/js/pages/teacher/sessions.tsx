import React, { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, useForm, usePage } from '@inertiajs/react';
import { User, Calendar, Clock, MessageSquare } from 'lucide-react';
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
            <Head title={t('teacher.sessions_title')} />
            <div className="p-6 md:p-8 max-w-5xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">{t('teacher.sessions_title')}</h1>
                    <p className="text-muted-foreground mt-2">{t('teacher.sessions_desc')}</p>
                </div>

                <div className="grid gap-4">
                    {appointments.data.length > 0 ? (
                        appointments.data.map((apt) => {
                            const teacherFeedback = apt.feedbacks?.find((fb: any) => fb.author_id === auth.user.id);
                            return (
                                <div key={apt.id} className="rounded-2xl border bg-card p-5 shadow-sm flex flex-col gap-4">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
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

                                        <div className="flex items-center gap-3 self-end md:self-auto">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                                                apt.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                                                apt.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                                'bg-muted text-muted-foreground'
                                            }`}>
                                                {t(`bookings.status_${apt.status}`)}
                                            </span>

                                            {apt.status === 'confirmed' && (
                                                <>
                                                    {!teacherFeedback ? (
                                                        <button
                                                            onClick={() => handleOpenFeedbackModal(apt)}
                                                            className="flex items-center gap-2 rounded-xl border border-indigo-200 px-4 py-2 text-sm font-semibold text-indigo-600 hover:bg-indigo-50 transition-all cursor-pointer dark:border-neutral-800 dark:text-indigo-400"
                                                        >
                                                            <MessageSquare className="h-4 w-4" /> {t('teacher.sessions_leave_feedback')}
                                                        </button>
                                                    ) : (
                                                        <span className="text-xs bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400 px-3 py-1 rounded-full font-medium">
                                                            {t('teacher.sessions_feedback_left')}
                                                        </span>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {teacherFeedback && (
                                        <div className="mt-1 p-4 bg-muted/40 rounded-xl border border-dashed text-sm">
                                            <div className="flex items-center gap-1.5 text-indigo-600 font-semibold mb-2 dark:text-indigo-400">
                                                <MessageSquare className="h-3.5 w-3.5" />
                                                <span>{t('teacher.sessions_your_feedback')}</span>
                                            </div>
                                            <p className="text-muted-foreground italic">"{teacherFeedback.comment}"</p>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    ) : (
                        <div className="text-center py-20 border rounded-2xl bg-muted/10 border-dashed">
                            <p className="text-muted-foreground">{t('teacher.sessions_none')}</p>
                        </div>
                    )}
                </div>
            </div>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('teacher.sessions_dialog_title')}</DialogTitle>
                        <DialogDescription>
                            {t('teacher.sessions_dialog_desc', { name: selectedApt?.pupil?.full_name })}
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium font-semibold">{t('teacher.sessions_feedback_notes')}</label>
                            <textarea
                                value={data.comment_text}
                                onChange={(e) => setData('comment_text', e.target.value)}
                                placeholder={t('teacher.sessions_feedback_placeholder')}
                                className="w-full min-h-[150px] rounded-xl border border-muted bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none"
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
                                {t('common.cancel')}
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

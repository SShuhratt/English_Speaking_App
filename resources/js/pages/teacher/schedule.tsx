import React, { useState, useEffect } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { Calendar, Clock, User, Video, XCircle } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/use-translation';

interface Props {
    appointments: any[];
}

function TeacherMeetingButton({ apt, handleStart, startingAptId }: { apt: any; handleStart: (apt: any) => void; startingAptId: string | null }) {
    const [currentTime, setCurrentTime] = useState(new Date());
    const { t } = useTranslation();

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const start = new Date(apt.start_at);
    const hasStartedTime = currentTime >= start;

    if (!hasStartedTime) {
        return (
            <button 
                disabled 
                className="flex items-center gap-2 rounded-xl bg-muted px-4 py-2 text-sm font-semibold text-muted-foreground cursor-not-allowed border"
            >
                <Clock className="h-4 w-4" /> {t('schedule.scheduled')}
            </button>
        );
    }

    return (
        <button 
            disabled={startingAptId === apt.id}
            onClick={() => handleStart(apt)}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-all shadow-md shadow-indigo-500/20 disabled:opacity-50 cursor-pointer"
        >
            <Video className="h-4 w-4" /> 
            {startingAptId === apt.id ? t('schedule.starting') : (apt.google_meet_link ? t('schedule.join') : t('schedule.start'))}
        </button>
    );
}

export default function Schedule({ appointments }: Props) {
    const [startingAptId, setStartingAptId] = useState<string | null>(null);
    const { t } = useTranslation();

    const handleCancel = async (id: string) => {
        if (!confirm(t('schedule.confirm_cancel'))) return;
        try {
            await axios.delete(`/bookings/${id}`);
            toast.success(t('schedule.cancel_success'));
            router.reload();
        } catch (error: any) {
            toast.error(error.response?.data?.message || t('schedule.cancel_failed'));
        }
    };

    const handleStart = async (apt: any) => {
        if (apt.google_meet_link) {
            window.open(apt.google_meet_link, '_blank');
            return;
        }

        setStartingAptId(apt.id);
        try {
            const response = await axios.post(`/teacher/appointments/${apt.id}/start`);
            toast.success(t('schedule.start_success'));
            if (response.data.google_meet_link) {
                window.open(response.data.google_meet_link, '_blank');
            }
            router.reload();
        } catch (error: any) {
            toast.error(error.response?.data?.message || t('schedule.start_failed'));
        } finally {
            setStartingAptId(null);
        }
    };

    return (
        <AppLayout>
            <Head title={t('schedule.title')} />
            <div className="p-6 md:p-8 max-w-5xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">{t('schedule.title')}</h1>
                    <p className="text-muted-foreground mt-2">{t('schedule.desc')}</p>
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
                                    <TeacherMeetingButton apt={apt} handleStart={handleStart} startingAptId={startingAptId} />

                                    <button 
                                        onClick={() => handleCancel(apt.id)}
                                        className="flex items-center gap-1.5 rounded-xl border border-destructive/20 text-destructive px-3 py-2 text-sm font-medium hover:bg-destructive hover:text-destructive-foreground transition-all cursor-pointer"
                                    >
                                        <XCircle className="h-4 w-4" /> {t('teacher.cancel')}
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-20 border rounded-2xl bg-muted/10 border-dashed">
                            <p className="text-muted-foreground">{t('schedule.none')}</p>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}

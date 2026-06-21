import React, { useState, useEffect } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import {
    Calendar,
    Clock,
    User,
    Video,
    XCircle,
    CalendarDays,
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/use-translation';

interface Props {
    appointments: any[];
}

function TeacherMeetingButton({
    apt,
    handleStart,
    startingAptId,
}: {
    apt: any;
    handleStart: (apt: any) => void;
    startingAptId: string | null;
}) {
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
                className="flex cursor-not-allowed items-center gap-2 rounded-xl border border-border/50 bg-muted/60 px-4 py-2.5 text-xs font-semibold text-muted-foreground"
            >
                <Clock className="h-3.5 w-3.5" /> {t('schedule.scheduled')}
            </button>
        );
    }

    return (
        <button
            disabled={startingAptId === apt.id}
            onClick={() => handleStart(apt)}
            className="flex animate-pulse cursor-pointer items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-500/10 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-500/20 disabled:opacity-50"
        >
            <Video className="h-3.5 w-3.5" />
            {startingAptId === apt.id
                ? t('schedule.starting')
                : apt.google_meet_link
                  ? t('schedule.join')
                  : t('schedule.start')}
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
            toast.error(
                error.response?.data?.message || t('schedule.cancel_failed'),
            );
        }
    };

    const handleStart = async (apt: any) => {
        if (apt.google_meet_link) {
            window.open(apt.google_meet_link, '_blank');
            return;
        }

        setStartingAptId(apt.id);
        try {
            const response = await axios.post(
                `/teacher/appointments/${apt.id}/start`,
            );
            toast.success(t('schedule.start_success'));
            if (response.data.google_meet_link) {
                window.open(response.data.google_meet_link, '_blank');
            }
            router.reload();
        } catch (error: any) {
            toast.error(
                error.response?.data?.message || t('schedule.start_failed'),
            );
        } finally {
            setStartingAptId(null);
        }
    };

    return (
        <>
            <Head title={t('schedule.title')} />
            <div className="mx-auto max-w-5xl space-y-8 p-6 md:p-8">
                {/* Header Section */}
                <div className="flex flex-col justify-between gap-4 rounded-3xl border border-indigo-100 bg-gradient-to-r from-indigo-50/40 via-purple-50/20 to-transparent p-6 md:flex-row md:items-center dark:border-indigo-950/20 dark:from-indigo-950/5 dark:via-purple-950/20">
                    <div className="space-y-1">
                        <h1 className="bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 bg-clip-text text-3xl font-black tracking-tight text-transparent">
                            {t('schedule.title')}
                        </h1>
                        <p className="text-sm font-medium text-muted-foreground">
                            {t('schedule.desc')}
                        </p>
                    </div>
                </div>

                {/* Main Schedule List */}
                <div className="grid gap-5">
                    {appointments.length > 0 ? (
                        appointments.map((apt) => (
                            <div
                                key={apt.id}
                                className="group flex flex-col justify-between gap-6 rounded-3xl border border-border bg-card p-6 shadow-sm transition-shadow duration-300 hover:shadow-md md:flex-row md:items-center"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 transition-transform group-hover:scale-105 dark:bg-indigo-950/40 dark:text-indigo-400">
                                        <User className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h4 className="text-base font-bold text-foreground">
                                            {apt.pupil?.full_name || 'Student'}
                                        </h4>
                                        <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs font-semibold text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="h-3.5 w-3.5 text-indigo-500" />
                                                {new Date(
                                                    apt.start_at,
                                                ).toLocaleDateString([], {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric',
                                                })}
                                            </span>
                                            <div className="hidden h-2 w-px bg-border sm:block" />
                                            <span className="flex items-center gap-1">
                                                <Clock className="h-3.5 w-3.5 text-indigo-500" />
                                                {new Date(
                                                    apt.start_at,
                                                ).toLocaleTimeString([], {
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}{' '}
                                                -{' '}
                                                {new Date(
                                                    apt.end_at,
                                                ).toLocaleTimeString([], {
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2.5">
                                    <TeacherMeetingButton
                                        apt={apt}
                                        handleStart={handleStart}
                                        startingAptId={startingAptId}
                                    />

                                    <button
                                        onClick={() => handleCancel(apt.id)}
                                        className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-destructive/25 px-3.5 py-2.5 text-xs font-bold text-destructive transition-all duration-300 hover:bg-destructive hover:text-white"
                                    >
                                        <XCircle className="h-3.5 w-3.5" />{' '}
                                        {t('teacher.cancel')}
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="rounded-3xl border border-dashed border-border bg-card p-16 text-center text-muted-foreground">
                            <CalendarDays className="mx-auto mb-4 h-10 w-10 animate-pulse text-muted-foreground/45" />
                            <p className="mb-1 text-base font-bold text-foreground">
                                {t('schedule.none')}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                You don't have any scheduled sessions on your
                                agenda.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

Schedule.layout = {
    breadcrumbs: [{ title: 'my schedule', href: '/teacher/schedule' }],
};

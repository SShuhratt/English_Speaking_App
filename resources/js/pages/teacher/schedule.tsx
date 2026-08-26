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
import GoogleCalendarWarningBanner from '@/components/teachers/GoogleCalendarWarningBanner';

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
            className="flex animate-pulse cursor-pointer items-center gap-2 rounded-xl bg-brand-button px-4 py-2.5 text-xs font-bold text-brand-brown shadow-md shadow-brand-button/10 transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand-button-hover hover:shadow-lg disabled:opacity-50"
        >
            <Video className="h-3.5 w-3.5" />
            {startingAptId === apt.id
                ? t('schedule.starting')
                : t('schedule.start')}
        </button>
    );
}

export default function Schedule({ appointments }: Props) {
    const [startingAptId, setStartingAptId] = useState<string | null>(null);
    const { t } = useTranslation();

    const [cancellingBooking, setCancellingBooking] = useState<any | null>(
        null,
    );
    const [cancelReason, setCancelReason] = useState('');
    const [submittingCancel, setSubmittingCancel] = useState(false);

    const handleCancelSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!cancellingBooking) return;
        if (
            cancelReason.trim().length < 3 ||
            cancelReason.trim().length > 1000
        ) {
            toast.error(
                t('teacher.reason_length_validation') ||
                    'Reason must be between 3 and 1000 characters',
            );
            return;
        }

        setSubmittingCancel(true);
        try {
            await axios.delete(`/bookings/${cancellingBooking.id}`, {
                data: { reason: cancelReason.trim() },
            });
            toast.success(t('schedule.cancel_success'));
            setCancellingBooking(null);
            setCancelReason('');
            router.reload();
        } catch (error: any) {
            toast.error(
                error.response?.data?.message || t('schedule.cancel_failed'),
            );
        } finally {
            setSubmittingCancel(false);
        }
    };

    const handleStart = async (apt: any) => {
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
            if (error.response?.data?.requires_google_calendar) {
                toast.error(
                    error.response.data.message ||
                        'Google Calendar connection required to generate Google Meet links.',
                    {
                        action: {
                            label: t('dashboard.connect_google') || 'Connect Google',
                            onClick: () => {
                                window.location.href = '/auth/google?calendar=1';
                            },
                        },
                        duration: 10000,
                    },
                );
            } else {
                toast.error(
                    error.response?.data?.message || t('schedule.start_failed'),
                );
            }
        } finally {
            setStartingAptId(null);
        }
    };

    return (
        <>
            <Head title={t('schedule.title')} />
            <div className="mx-auto max-w-5xl space-y-8 p-6 md:p-8">
                {/* Header Section */}
                <div className="relative overflow-hidden rounded-3xl bg-brand-navy p-8 text-white shadow-lg shadow-brand-navy/10">
                    <div className="pointer-events-none absolute -top-20 -right-20 h-44 w-44 rounded-full bg-brand-lightblue/10 blur-xl" />
                    <div className="pointer-events-none absolute -bottom-20 -left-20 h-44 w-44 rounded-full bg-brand-yellow/10 blur-xl" />

                    <div className="relative z-10 space-y-1.5">
                        <span className="text-[10px] font-black tracking-widest text-brand-yellow uppercase">
                            TEACHER SCHEDULING
                        </span>
                        <h1 className="text-3xl font-black tracking-tight text-white">
                            {t('schedule.title')}
                        </h1>
                        <p className="text-sm font-medium text-brand-lightblue/80">
                            {t('schedule.desc')}
                        </p>
                    </div>
                </div>

                {/* Google Calendar Reminder Banner */}
                <GoogleCalendarWarningBanner />

                {/* Main Schedule List */}
                <div className="grid gap-5">
                    {appointments.length > 0 ? (
                        appointments.map((apt) => (
                            <div
                                key={apt.id}
                                className="group flex flex-col justify-between gap-6 rounded-3xl border border-border bg-card p-6 shadow-sm transition-shadow duration-300 hover:shadow-md md:flex-row md:items-center"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-lightblue text-brand-brown transition-transform group-hover:scale-105">
                                        <User className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h4 className="text-base font-bold text-foreground">
                                            {apt.pupil?.full_name || 'Student'}
                                        </h4>
                                        <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs font-semibold text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="h-3.5 w-3.5 text-brand-brown" />
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
                                                <Clock className="h-3.5 w-3.5 text-brand-brown" />
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

                                        {/* Topics Display */}
                                        {apt.topics &&
                                            apt.topics.length > 0 && (
                                                <div className="mt-2.5 flex flex-wrap gap-1.5">
                                                    {apt.topics.map(
                                                        (topic: string) => (
                                                            <span
                                                                key={topic}
                                                                className="rounded-lg bg-brand-lightblue px-2 py-0.5 text-[10px] font-bold text-brand-brown"
                                                            >
                                                                #{topic}
                                                            </span>
                                                        ),
                                                    )}
                                                </div>
                                            )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2.5">
                                    <TeacherMeetingButton
                                        apt={apt}
                                        handleStart={handleStart}
                                        startingAptId={startingAptId}
                                    />

                                    <button
                                        onClick={() =>
                                            setCancellingBooking(apt)
                                        }
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
                                {t('schedule.empty_desc')}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {cancellingBooking && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="relative mx-4 flex w-full max-w-md animate-in flex-col rounded-2xl border bg-card p-6 shadow-2xl duration-150 zoom-in-95">
                        <h3 className="text-lg font-bold text-foreground">
                            {t('teacher.cancel_title') || 'Cancel Appointment'}
                        </h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                            {t('teacher.cancel_desc') ||
                                'Please state the reason for cancelling this appointment. This will be visible to the student.'}
                        </p>
                        <form
                            onSubmit={handleCancelSubmit}
                            className="mt-4 space-y-4"
                        >
                            <div>
                                <textarea
                                    className="min-h-[100px] w-full rounded-xl border bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-brand-button/20 focus:outline-none"
                                    placeholder={
                                        t('teacher.reason_placeholder') ||
                                        'Enter your reason here...'
                                    }
                                    value={cancelReason}
                                    onChange={(e) =>
                                        setCancelReason(e.target.value)
                                    }
                                    minLength={3}
                                    maxLength={1000}
                                    required
                                />
                                <div className="mt-1 text-right text-[10px] font-semibold text-muted-foreground">
                                    {cancelReason.length} / 1000
                                </div>
                            </div>
                            <div className="flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setCancellingBooking(null);
                                        setCancelReason('');
                                    }}
                                    className="cursor-pointer rounded-xl border px-4 py-2 text-sm font-semibold transition-colors hover:bg-muted"
                                >
                                    {t('bookings.close_btn') || 'Close'}
                                </button>
                                <button
                                    type="submit"
                                    disabled={
                                        submittingCancel ||
                                        cancelReason.trim().length < 3
                                    }
                                    className="cursor-pointer rounded-xl bg-destructive px-5 py-2 text-sm font-semibold text-white shadow-md transition-colors hover:bg-destructive/90 disabled:opacity-50"
                                >
                                    {submittingCancel
                                        ? t('bookings.cancelling') ||
                                          'Cancelling...'
                                        : t('bookings.confirm_cancel') ||
                                          'Confirm Cancel'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}

Schedule.layout = {
    breadcrumbs: [{ title: 'my schedule', href: '/teacher/schedule' }],
};

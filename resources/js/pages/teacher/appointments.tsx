import React, { useState, useEffect } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, usePage } from '@inertiajs/react';
import {
    Check,
    X,
    Clock,
    Calendar,
    User,
    Trash2,
    CalendarDays,
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/use-translation';

export default function Appointments() {
    const [appointments, setAppointments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { auth } = usePage<any>().props;
    const { t } = useTranslation();

    const fetchAppointments = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/teacher/appointments');
            setAppointments(response.data.data);
        } catch (error) {
            toast.error(t('teacher.failed_load'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAppointments();
    }, []);

    useEffect(() => {
        if (!auth.user) return;

        const channel = window.Echo.channel(`teacher.${auth.user.id}`);

        channel.listen('.booking.updated', (e: any) => {
            fetchAppointments();
        });

        return () => {
            channel.stopListening('.booking.updated');
        };
    }, [auth.user?.id]);

    const handleAction = async (id: string, action: 'approve' | 'reject') => {
        try {
            await axios.post(`/teacher/appointments/${id}/${action}`);
            toast.success(t(`teacher.${action}_success`));
            fetchAppointments();
        } catch (error) {
            toast.error(t(`teacher.${action}_failed`));
        }
    };

    const handleCancel = async (id: string) => {
        if (!confirm(t('teacher.confirm_cancel'))) return;
        try {
            await axios.delete(`/bookings/${id}`);
            toast.success(t('teacher.cancel_success'));
            fetchAppointments();
        } catch (error: any) {
            toast.error(
                error.response?.data?.message || t('teacher.cancel_failed'),
            );
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm(t('bookings.delete_confirm'))) return;
        try {
            await axios.delete(`/appointments/${id}`);
            toast.success(t('bookings.delete_success'));
            fetchAppointments();
        } catch (error: any) {
            toast.error(
                error.response?.data?.message || t('bookings.delete_error'),
            );
        }
    };

    return (
        <>
            <Head title={t('teacher.appointments_title')} />
            <div className="mx-auto max-w-5xl space-y-8 p-6 md:p-8">
                {/* Header Section */}
                <div className="flex flex-col justify-between gap-4 rounded-3xl border border-indigo-100 bg-gradient-to-r from-indigo-50/40 via-purple-50/20 to-transparent p-6 md:flex-row md:items-center dark:border-indigo-950/20 dark:from-indigo-950/5 dark:via-purple-950/20">
                    <div className="space-y-1">
                        <h1 className="bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 bg-clip-text text-3xl font-black tracking-tight text-transparent">
                            {t('teacher.booking_requests')}
                        </h1>
                        <p className="text-sm font-medium text-muted-foreground">
                            {t('teacher.booking_requests_desc')}
                        </p>
                    </div>
                </div>

                {/* Main List */}
                <div className="grid gap-5">
                    {loading ? (
                        <div className="rounded-3xl border border-dashed bg-card py-20 text-center">
                            <div className="mx-auto mb-4 h-7 w-7 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                            <p className="text-sm font-semibold text-muted-foreground">
                                {t('teacher.loading')}
                            </p>
                        </div>
                    ) : appointments.length > 0 ? (
                        appointments.map((apt) => {
                            const isPast = new Date(apt.end_at) < new Date();
                            return (
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
                                                {apt.pupil?.full_name ||
                                                    'Student'}
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

                                    <div className="flex flex-wrap items-center gap-3">
                                        {isPast ? (
                                            <>
                                                <span
                                                    className={`rounded-xl border px-3 py-1 text-[10px] font-extrabold tracking-wider uppercase ${
                                                        apt.status ===
                                                        'confirmed'
                                                            ? 'border-emerald-200/50 bg-emerald-50 text-emerald-700 dark:border-emerald-900/30 dark:bg-emerald-950/30 dark:text-emerald-400'
                                                            : apt.status ===
                                                                'rejected'
                                                              ? 'border-red-200/50 bg-red-50 text-red-700 dark:border-red-900/30 dark:bg-red-950/30 dark:text-red-400'
                                                              : apt.status ===
                                                                  'cancelled'
                                                                ? 'border-red-200/50 bg-red-50 text-red-700 dark:border-red-900/30 dark:bg-red-950/30 dark:text-red-400'
                                                                : 'border-transparent bg-muted text-muted-foreground'
                                                    }`}
                                                >
                                                    {t(
                                                        `bookings.status_${apt.status}`,
                                                    )}
                                                </span>
                                                <button
                                                    onClick={() =>
                                                        handleDelete(apt.id)
                                                    }
                                                    className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-destructive/20 px-3.5 py-2.5 text-xs font-bold text-destructive transition-all duration-300 hover:bg-destructive hover:text-white"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />{' '}
                                                    {t('bookings.delete')}
                                                </button>
                                            </>
                                        ) : apt.status === 'pending' ? (
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() =>
                                                        handleAction(
                                                            apt.id,
                                                            'approve',
                                                        )
                                                    }
                                                    className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-600/10 transition-all duration-300 hover:bg-emerald-700 hover:shadow-lg"
                                                >
                                                    <Check className="h-3.5 w-3.5" />{' '}
                                                    {t('teacher.approve')}
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        handleAction(
                                                            apt.id,
                                                            'reject',
                                                        )
                                                    }
                                                    className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-destructive/25 px-4 py-2.5 text-xs font-bold text-destructive transition-all duration-300 hover:bg-destructive hover:text-white"
                                                >
                                                    <X className="h-3.5 w-3.5" />{' '}
                                                    {t('teacher.reject')}
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-3">
                                                <span
                                                    className={`rounded-xl border px-3 py-1 text-[10px] font-extrabold tracking-wider uppercase ${
                                                        apt.status ===
                                                        'confirmed'
                                                            ? 'border-emerald-200/50 bg-emerald-50 text-emerald-700 dark:border-emerald-900/30 dark:bg-emerald-950/30 dark:text-emerald-400'
                                                            : apt.status ===
                                                                'rejected'
                                                              ? 'border-red-200/50 bg-red-50 text-red-700 dark:border-red-900/30 dark:bg-red-950/30 dark:text-red-400'
                                                              : apt.status ===
                                                                  'cancelled'
                                                                ? 'border-red-200/50 bg-red-50 text-red-700 dark:border-red-900/30 dark:bg-red-950/30 dark:text-red-400'
                                                                : 'border-transparent bg-muted text-muted-foreground'
                                                    }`}
                                                >
                                                    {t(
                                                        `bookings.status_${apt.status}`,
                                                    )}
                                                </span>
                                                {apt.status === 'confirmed' && (
                                                    <button
                                                        onClick={() =>
                                                            handleCancel(apt.id)
                                                        }
                                                        className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-destructive/25 px-3.5 py-2.5 text-xs font-bold text-destructive transition-all duration-300 hover:bg-destructive hover:text-white"
                                                    >
                                                        {t('teacher.cancel')}
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="rounded-3xl border border-dashed border-border bg-card p-16 text-center text-muted-foreground">
                            <CalendarDays className="mx-auto mb-4 h-10 w-10 animate-pulse text-muted-foreground/45" />
                            <p className="mb-1 text-base font-bold text-foreground">
                                {t('teacher.no_appointments')}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Students booking requests will appear here once
                                submitted.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

Appointments.layout = {
    breadcrumbs: [{ title: 'booking requests', href: '/teacher/appointments' }],
};

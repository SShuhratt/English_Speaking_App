import React, { useEffect, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, router, usePage, Link } from '@inertiajs/react';
import {
    Calendar,
    Clock,
    User,
    Video,
    XCircle,
    Trash2,
    Sparkles,
    BookOpen,
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/use-translation';

interface Props {
    bookings: {
        data: any[];
    };
}

function PupilMeetingButton({
    apt,
    handleJoin,
}: {
    apt: any;
    handleJoin: (apt: any) => void;
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
                <Clock className="h-3.5 w-3.5" /> {t('meeting.scheduled')}
            </button>
        );
    }

    return (
        <button
            onClick={() => handleJoin(apt)}
            className="flex animate-pulse cursor-pointer items-center gap-2 rounded-xl bg-brand-button hover:bg-brand-button-hover px-4 py-2.5 text-xs font-bold text-brand-brown shadow-md shadow-brand-button/10 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
        >
            <Video className="h-3.5 w-3.5" /> {t('meeting.join')}
        </button>
    );
}

export default function Bookings({ bookings }: Props) {
    const { auth } = usePage<any>().props;
    const { t } = useTranslation();

    const [cancellingBooking, setCancellingBooking] = useState<any | null>(null);
    const [cancelReason, setCancelReason] = useState('');
    const [submittingCancel, setSubmittingCancel] = useState(false);

    useEffect(() => {
        if (!auth.user) return;

        const channel = window.Echo.private(`pupil.${auth.user.id}`);

        channel.listen('.booking.updated', (e: any) => {
            toast.info(`Booking status updated: ${e.appointment.status}`);
            router.reload();
        });
        channel.listen('.ConversationApproved', (e: any) => {
            toast.info(t('dashboard.booking_approved_toast') || `Your session has been approved!`);
            router.reload();
        });

        return () => {
            channel.stopListening('.booking.updated');
            channel.stopListening('.ConversationApproved');
        };
    }, [auth.user?.id]);

    const handleCancelSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!cancellingBooking) return;
        if (cancelReason.trim().length < 3 || cancelReason.trim().length > 1000) {
            toast.error(t('bookings.reason_length_validation') || 'Reason must be between 3 and 1000 characters');
            return;
        }

        setSubmittingCancel(true);
        try {
            await axios.delete(`/bookings/${cancellingBooking.id}`, {
                data: { reason: cancelReason.trim() }
            });
            toast.success(t('dashboard.cancel_success'));
            setCancellingBooking(null);
            setCancelReason('');
            router.reload();
        } catch (error: any) {
            toast.error(
                error.response?.data?.message || t('dashboard.cancel_error'),
            );
        } finally {
            setSubmittingCancel(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm(t('bookings.delete_confirm'))) return;
        try {
            await axios.delete(`/appointments/${id}`);
            toast.success(t('bookings.delete_success'));
            router.reload();
        } catch (error: any) {
            toast.error(
                error.response?.data?.message || t('bookings.delete_error'),
            );
        }
    };

    const handleJoin = async (apt: any) => {
        try {
            const response = await axios.post(
                `/pupil/appointments/${apt.id}/join`,
            );
            window.open(response.data.google_meet_link, '_blank');
        } catch (error: any) {
            toast.error(
                error.response?.data?.message || t('meeting.not_ready'),
            );
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'confirmed':
                return t('bookings.status_confirmed');
            case 'pending':
                return t('bookings.status_pending');
            case 'cancelled':
                return t('bookings.status_cancelled');
            case 'rejected':
                return t('bookings.status_rejected') || 'Rejected';
            default:
                return status;
        }
    };

    return (
        <>
            <Head title={t('bookings.title')} />
            <div className="mx-auto max-w-5xl space-y-8 p-6 md:p-8">
                {/* Header Section */}
                <div className="relative overflow-hidden rounded-3xl bg-brand-navy p-8 text-white shadow-lg shadow-brand-navy/10">
                    <div className="pointer-events-none absolute -top-20 -right-20 h-44 w-44 rounded-full bg-brand-lightblue/10 blur-xl" />
                    <div className="pointer-events-none absolute -bottom-20 -left-20 h-44 w-44 rounded-full bg-brand-yellow/10 blur-xl" />
                    
                    <div className="relative z-10 space-y-1.5">
                        <span className="text-[10px] font-black uppercase tracking-widest text-brand-yellow">
                            MY BOOKINGS
                        </span>
                        <h1 className="text-3xl font-black tracking-tight text-white">
                            {t('bookings.title')}
                        </h1>
                        <p className="text-sm font-medium text-brand-lightblue/80">
                            {t('bookings.desc')}
                        </p>
                    </div>
                </div>

                {/* Booking List */}
                <div className="grid gap-5">
                    {bookings.data.length > 0 ? (
                        bookings.data.map((apt) => {
                            const isPast = new Date(apt.end_at) < new Date();
                            return (
                                <div
                                    key={apt.id}
                                    className="group flex flex-col justify-between gap-6 rounded-3xl border border-border bg-card p-6 shadow-sm transition-shadow duration-300 hover:shadow-md md:flex-row md:items-center"
                                >
                                    <div className="flex items-center gap-4">
                                        {apt.teacher ? (
                                            <Link href={`/profile/${apt.teacher.id}`} className="shrink-0">
                                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-lightblue text-brand-brown transition-transform group-hover:scale-105 overflow-hidden">
                                                    {apt.teacher?.avatar ? (
                                                        <img src={apt.teacher.avatar} className="h-full w-full object-cover" alt="avatar" />
                                                    ) : (
                                                        <User className="h-6 w-6" />
                                                    )}
                                                </div>
                                            </Link>
                                        ) : (
                                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-lightblue text-brand-brown">
                                                <User className="h-6 w-6" />
                                            </div>
                                        )}
                                        <div>
                                            <h4 className="text-base font-bold text-foreground">
                                                {t('bookings.teacher_label', { name: '' })}
                                                {apt.teacher ? (
                                                    <Link href={`/profile/${apt.teacher.id}`} className="font-bold text-[#061445] hover:underline">
                                                        {apt.teacher.full_name}
                                                    </Link>
                                                ) : (
                                                    'Expert'
                                                )}
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
                                            {apt.topics && apt.topics.length > 0 && (
                                                <div className="mt-2.5 flex flex-wrap gap-1.5">
                                                    {apt.topics.map((topic: string) => (
                                                        <span
                                                            key={topic}
                                                            className="rounded-lg bg-brand-lightblue px-2 py-0.5 text-[10px] font-bold text-brand-brown"
                                                        >
                                                            #{topic}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Cancellation/Rejection Reason Display */}
                                            {(apt.status === 'cancelled' || apt.status === 'rejected') && apt.cancellation_reason && (
                                                <div className="mt-3 max-w-md rounded-2xl border border-red-100 bg-red-50/20 p-3 text-xs">
                                                    <p className="font-extrabold text-red-800">
                                                        {apt.status === 'rejected'
                                                            ? (t('bookings.rejected_by_teacher') || 'Rejected by Teacher')
                                                            : (t('bookings.cancelled_by', {
                                                                name: apt.cancelled_by === auth.user.id
                                                                    ? (t('bookings.you') || 'You')
                                                                    : (apt.cancelled_by === apt.teacher_id
                                                                        ? (apt.teacher?.full_name || t('bookings.teacher') || 'Teacher')
                                                                        : (t('bookings.pupil') || 'Pupil'))
                                                            }))
                                                        }
                                                    </p>
                                                    <p className="mt-0.5 font-medium text-muted-foreground italic">
                                                        "{apt.cancellation_reason}"
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-3">
                                        <span
                                            className={`rounded-xl border px-3 py-1 text-[10px] font-extrabold tracking-wider uppercase ${
                                                apt.status === 'confirmed'
                                                    ? 'border-emerald-200/50 bg-emerald-50 text-emerald-700'
                                                    : apt.status === 'pending'
                                                      ? 'border-amber-200/50 bg-amber-50 text-amber-700'
                                                      : (apt.status === 'cancelled' || apt.status === 'rejected')
                                                        ? 'border-red-200/50 bg-red-50 text-red-700'
                                                        : 'border-transparent bg-muted text-muted-foreground'
                                            }`}
                                        >
                                            {getStatusLabel(apt.status)}
                                        </span>

                                        {isPast ? (
                                            <button
                                                onClick={() =>
                                                    handleDelete(apt.id)
                                                }
                                                className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-destructive/20 px-3 py-2 text-xs font-bold text-destructive transition-all duration-300 hover:bg-destructive hover:text-white"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />{' '}
                                                {t('bookings.delete')}
                                            </button>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                {apt.status === 'confirmed' && (
                                                    <PupilMeetingButton
                                                        apt={apt}
                                                        handleJoin={handleJoin}
                                                    />
                                                )}

                                                {(apt.status === 'confirmed' ||
                                                    apt.status ===
                                                        'pending') && (
                                                    <button
                                                        onClick={() =>
                                                            setCancellingBooking(apt)
                                                        }
                                                        className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-destructive/25 px-3.5 py-2.5 text-xs font-bold text-destructive transition-all duration-300 hover:bg-destructive hover:text-white"
                                                    >
                                                        <XCircle className="h-3.5 w-3.5" />{' '}
                                                        {t(
                                                            'dashboard.cancel_button',
                                                        )}
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
                            <BookOpen className="mx-auto mb-4 h-10 w-10 animate-pulse text-muted-foreground/45" />
                            <p className="mb-1 text-base font-bold text-foreground">
                                {t('bookings.none')}
                            </p>
                            <p className="mb-5 text-sm text-muted-foreground">
                                {t('bookings.none_desc')}
                            </p>
                            <Link
                                href="/pupil/teachers"
                                className="inline-flex items-center gap-1.5 rounded-2xl bg-brand-button hover:bg-brand-button-hover px-5 py-2.5 text-xs font-bold text-brand-brown shadow-md transition-all hover:scale-102"
                            >
                                {t('teachers.browse')}{' '}
                                <Sparkles className="h-3.5 w-3.5" />
                            </Link>
                        </div>
                    )}
                </div>
            </div>

            {cancellingBooking && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="relative mx-4 flex w-full max-w-md animate-in flex-col rounded-2xl border bg-card p-6 shadow-2xl duration-150 zoom-in-95">
                        <h3 className="text-lg font-bold text-foreground">
                            {t('bookings.cancel_title') || 'Cancel Booking'}
                        </h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                            {t('bookings.cancel_desc') || 'Please state the reason for cancellation. This will be visible to the teacher.'}
                        </p>
                        <form onSubmit={handleCancelSubmit} className="mt-4 space-y-4">
                            <div>
                                <textarea
                                    className="w-full min-h-[100px] rounded-xl border bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-brand-button/20 focus:outline-none"
                                    placeholder={t('bookings.cancel_reason_placeholder') || 'Enter your reason here...'}
                                    value={cancelReason}
                                    onChange={(e) => setCancelReason(e.target.value)}
                                    minLength={3}
                                    maxLength={1000}
                                    required
                                />
                                <div className="mt-1 text-right text-[10px] text-muted-foreground font-semibold">
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
                                    disabled={submittingCancel || cancelReason.trim().length < 3}
                                    className="cursor-pointer rounded-xl bg-destructive px-5 py-2 text-sm font-semibold text-white shadow-md transition-colors hover:bg-destructive/90 disabled:opacity-50"
                                >
                                    {submittingCancel
                                        ? t('bookings.cancelling') || 'Cancelling...'
                                        : t('bookings.confirm_cancel') || 'Confirm Cancel'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}

Bookings.layout = {
    breadcrumbs: [{ title: 'my bookings', href: '/pupil/bookings' }],
};

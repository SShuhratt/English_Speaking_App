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
    TrendingUp,
    BookOpen,
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/use-translation';

type TabType = 'pending' | 'upcoming' | 'completed' | 'all';

export default function Appointments() {
    const [appointments, setAppointments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabType>('pending');
    const { auth } = usePage<any>().props;
    const { t } = useTranslation();

    const [modalAction, setModalAction] = useState<{ id: string; type: 'cancel' | 'reject' } | null>(null);
    const [actionReason, setActionReason] = useState('');
    const [submittingAction, setSubmittingAction] = useState(false);

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
        const channel = window.Echo.private(`teacher.${auth.user.id}`);
        channel.listen('.booking.updated', () => { fetchAppointments(); });
        channel.listen('.ConversationBooked', () => { fetchAppointments(); });
        return () => {
            channel.stopListening('.booking.updated');
            channel.stopListening('.ConversationBooked');
        };
    }, [auth.user?.id]);

    const handleAction = async (id: string, action: 'approve') => {
        try {
            await axios.post(`/teacher/appointments/${id}/${action}`);
            toast.success(t(`teacher.${action}_success`));
            fetchAppointments();
        } catch (error) {
            toast.error(t(`teacher.${action}_failed`));
        }
    };

    const handleModalActionSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!modalAction) return;
        if (actionReason.trim().length < 3 || actionReason.trim().length > 1000) {
            toast.error(t('teacher.reason_length_validation') || 'Reason must be between 3 and 1000 characters');
            return;
        }
        setSubmittingAction(true);
        try {
            if (modalAction.type === 'cancel') {
                await axios.delete(`/bookings/${modalAction.id}`, { data: { reason: actionReason.trim() } });
                toast.success(t('teacher.cancel_success'));
            } else {
                await axios.post(`/teacher/appointments/${modalAction.id}/reject`, { reason: actionReason.trim() });
                toast.success(t('teacher.reject_success'));
            }
            setModalAction(null);
            setActionReason('');
            fetchAppointments();
        } catch (error: any) {
            toast.error(error.response?.data?.message || t('teacher.action_failed') || 'Action failed');
        } finally {
            setSubmittingAction(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm(t('bookings.delete_confirm'))) return;
        try {
            await axios.delete(`/appointments/${id}`);
            toast.success(t('bookings.delete_success'));
            fetchAppointments();
        } catch (error: any) {
            toast.error(error.response?.data?.message || t('bookings.delete_error'));
        }
    };

    const now = new Date();
    const filteredAppointments = appointments.filter((apt) => {
        const isPast = new Date(apt.end_at) < now;
        const isFuture = new Date(apt.start_at) >= now;
        if (activeTab === 'pending') return apt.status === 'pending';
        if (activeTab === 'upcoming') return apt.status === 'confirmed' && isFuture;
        if (activeTab === 'completed') return isPast;
        return true;
    });

    const pendingCount = appointments.filter((a) => a.status === 'pending').length;
    const upcomingCount = appointments.filter((a) => a.status === 'confirmed' && new Date(a.start_at) >= now).length;
    const completedCount = appointments.filter((a) => new Date(a.end_at) < now).length;

    const tabs: { key: TabType; label: string; count?: number }[] = [
        { key: 'pending', label: 'Pending', count: pendingCount },
        { key: 'upcoming', label: 'Upcoming', count: upcomingCount },
        { key: 'completed', label: 'Completed', count: completedCount },
        { key: 'all', label: 'All', count: appointments.length },
    ];

    const statusStyle = (status: string) => {
        if (status === 'confirmed') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
        if (status === 'pending') return 'border-[#fae18e] bg-[#fffbeb] text-[#92700a]';
        if (status === 'rejected' || status === 'cancelled') return 'border-red-200 bg-red-50 text-red-600';
        return 'border-slate-200 bg-slate-50 text-slate-500';
    };

    return (
        <>
            <Head title={t('teacher.appointments_title')} />
            <div className="min-h-screen bg-[#f8f9fc] p-4 md:p-8">
                {/* Header Banner */}
                <div className="mb-6 overflow-hidden rounded-2xl bg-[#061445] px-6 py-8 md:px-10">
                    <p className="text-xs font-black tracking-widest text-[#fae18e] uppercase">Session Management</p>
                    <h1 className="mt-1 text-2xl font-black text-white md:text-3xl">{t('teacher.booking_requests')}</h1>
                    <p className="mt-1 text-sm text-white/60">{t('teacher.booking_requests_desc')}</p>
                </div>

                <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
                    {/* Main content */}
                    <div className="flex flex-col gap-4">
                        {/* Tabs */}
                        <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveTab(tab.key)}
                                    className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-all ${
                                        activeTab === tab.key
                                            ? 'bg-[#061445] text-white shadow-sm'
                                            : 'text-slate-500 hover:bg-slate-100'
                                    }`}
                                >
                                    {tab.label}
                                    {tab.count !== undefined && tab.count > 0 && (
                                        <span className={`flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-black ${
                                            activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                                        }`}>
                                            {tab.count}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* List */}
                        <div className="flex flex-col gap-3">
                            {loading ? (
                                <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white py-16">
                                    <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#061445] border-t-transparent" />
                                </div>
                            ) : filteredAppointments.length > 0 ? (
                                filteredAppointments.map((apt) => {
                                    const isPast = new Date(apt.end_at) < now;
                                    const isFuture = new Date(apt.start_at) >= now;
                                    return (
                                        <div
                                            key={apt.id}
                                            className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md md:flex-row md:items-center"
                                        >
                                            {/* Left: avatar + info */}
                                            <div className="flex items-start gap-4">
                                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#d0e4ff]/40 text-[#061445]">
                                                    <User className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-bold text-[#061445]">
                                                        {apt.pupil?.full_name || 'Student'}
                                                    </h4>
                                                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                                                        <span className="flex items-center gap-1">
                                                            <Calendar className="h-3.5 w-3.5" />
                                                            {new Date(apt.start_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="h-3.5 w-3.5" />
                                                            {new Date(apt.start_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            {' – '}
                                                            {new Date(apt.end_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>

                                                    {apt.topics && apt.topics.length > 0 && (
                                                        <div className="mt-2 flex flex-wrap gap-1.5">
                                                            {apt.topics.map((topic: string) => (
                                                                <span key={topic} className="rounded-lg bg-[#d0e4ff]/30 px-2 py-0.5 text-[10px] font-bold text-[#061445]">
                                                                    #{topic}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {(apt.status === 'cancelled' || apt.status === 'rejected') && apt.cancellation_reason && (
                                                        <div className="mt-2 max-w-md rounded-xl border border-red-100 bg-red-50/30 p-3 text-xs">
                                                            <p className="font-bold text-red-700">
                                                                {apt.status === 'rejected' ? 'Rejected by You' : 'Cancelled'}
                                                            </p>
                                                            <p className="mt-0.5 italic text-slate-500">"{apt.cancellation_reason}"</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Right: status + actions */}
                                            <div className="flex flex-wrap items-center gap-2 md:shrink-0">
                                                {isPast ? (
                                                    <>
                                                        <span className={`rounded-xl border px-3 py-1 text-[10px] font-black tracking-wider uppercase ${statusStyle(apt.status)}`}>
                                                            {t(`bookings.status_${apt.status}`)}
                                                        </span>
                                                        <button
                                                            onClick={() => handleDelete(apt.id)}
                                                            className="flex cursor-pointer items-center gap-1 rounded-xl border border-red-200 px-3 py-2 text-xs font-bold text-red-500 transition hover:bg-red-50"
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                            {t('bookings.delete')}
                                                        </button>
                                                    </>
                                                ) : apt.status === 'pending' ? (
                                                    <>
                                                        <button
                                                            onClick={() => handleAction(apt.id, 'approve')}
                                                            className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-[#061445] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#0a1f6b]"
                                                        >
                                                            <Check className="h-3.5 w-3.5" />
                                                            {t('teacher.approve')}
                                                        </button>
                                                        <button
                                                            onClick={() => setModalAction({ id: apt.id, type: 'reject' })}
                                                            className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-red-200 px-4 py-2.5 text-xs font-bold text-red-500 transition hover:bg-red-50"
                                                        >
                                                            <X className="h-3.5 w-3.5" />
                                                            {t('teacher.reject')}
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <span className={`rounded-xl border px-3 py-1 text-[10px] font-black tracking-wider uppercase ${statusStyle(apt.status)}`}>
                                                            {t(`bookings.status_${apt.status}`)}
                                                        </span>
                                                        {apt.status === 'confirmed' && isFuture && (
                                                            <button
                                                                onClick={() => setModalAction({ id: apt.id, type: 'cancel' })}
                                                                className="flex cursor-pointer items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-500 transition hover:bg-slate-50"
                                                            >
                                                                {t('teacher.cancel')}
                                                            </button>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
                                    <CalendarDays className="mb-3 h-10 w-10 text-slate-300" />
                                    <p className="text-sm font-bold text-slate-400">{t('teacher.no_appointments')}</p>
                                    <p className="mt-1 text-xs text-slate-300">Student booking requests will appear here.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="flex flex-col gap-4">
                        {/* Quick Stats */}
                        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <p className="mb-3 text-xs font-black tracking-widest text-slate-400 uppercase">Quick Stats</p>
                            <div className="flex flex-col gap-3">
                                <div className="flex items-center justify-between rounded-xl bg-[#fffbeb] px-4 py-3">
                                    <span className="text-xs font-bold text-[#92700a]">Pending Review</span>
                                    <span className="text-lg font-black text-[#061445]">{pendingCount}</span>
                                </div>
                                <div className="flex items-center justify-between rounded-xl bg-[#f0f8ff] px-4 py-3">
                                    <span className="text-xs font-bold text-[#061445]/60">Upcoming</span>
                                    <span className="text-lg font-black text-[#061445]">{upcomingCount}</span>
                                </div>
                                <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                                    <span className="text-xs font-bold text-slate-400">Completed</span>
                                    <span className="text-lg font-black text-[#061445]">{completedCount}</span>
                                </div>
                            </div>
                        </div>

                        {/* Marketplace Tip */}
                        <div className="rounded-2xl border border-[#fae18e]/60 bg-[#fffbeb] p-5">
                            <div className="mb-2 flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-[#92700a]" />
                                <p className="text-xs font-black tracking-widest text-[#92700a] uppercase">Marketplace Tip</p>
                            </div>
                            <p className="text-xs text-[#92700a]/80 leading-relaxed">
                                Respond to booking requests within 2 hours to increase your acceptance rate and ranking on the platform.
                            </p>
                        </div>

                        {/* Popular Times */}
                        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="mb-3 flex items-center gap-2">
                                <BookOpen className="h-4 w-4 text-[#061445]" />
                                <p className="text-xs font-black tracking-widest text-slate-400 uppercase">Popular Times</p>
                            </div>
                            {['9:00 – 11:00', '14:00 – 16:00', '18:00 – 20:00'].map((slot, i) => (
                                <div key={slot} className="mb-2 flex items-center justify-between">
                                    <span className="text-xs text-slate-500">{slot}</span>
                                    <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-100">
                                        <div
                                            className="h-full rounded-full bg-[#061445]"
                                            style={{ width: i === 0 ? '80%' : i === 1 ? '60%' : '45%' }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Action Modal */}
            {modalAction && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="relative mx-4 flex w-full max-w-md flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                        <h3 className="text-lg font-bold text-[#061445]">
                            {modalAction.type === 'cancel' ? (t('teacher.cancel_title') || 'Cancel Appointment') : (t('teacher.reject_title') || 'Reject Request')}
                        </h3>
                        <p className="mt-2 text-sm text-slate-500">
                            {modalAction.type === 'cancel'
                                ? (t('teacher.cancel_desc') || 'Please state the reason for cancelling this appointment.')
                                : (t('teacher.reject_desc') || 'Please state the reason for rejecting this booking request.')}
                        </p>
                        <form onSubmit={handleModalActionSubmit} className="mt-4 space-y-4">
                            <div>
                                <textarea
                                    className="w-full min-h-[100px] rounded-xl border border-slate-200 bg-[#f8f9fc] px-3 py-2 text-sm focus:border-[#061445] focus:ring-2 focus:ring-[#061445]/10 focus:outline-none"
                                    placeholder={t('teacher.reason_placeholder') || 'Enter your reason here...'}
                                    value={actionReason}
                                    onChange={(e) => setActionReason(e.target.value)}
                                    minLength={3}
                                    maxLength={1000}
                                    required
                                />
                                <div className="mt-1 text-right text-[10px] font-semibold text-slate-400">
                                    {actionReason.length} / 1000
                                </div>
                            </div>
                            <div className="flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => { setModalAction(null); setActionReason(''); }}
                                    className="cursor-pointer rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                                >
                                    {t('bookings.close_btn') || 'Close'}
                                </button>
                                <button
                                    type="submit"
                                    disabled={submittingAction || actionReason.trim().length < 3}
                                    className="cursor-pointer rounded-xl bg-red-600 px-5 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-red-700 disabled:opacity-50"
                                >
                                    {submittingAction ? (t('bookings.submitting') || 'Submitting...') : (t('bookings.confirm_submit') || 'Submit')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}

Appointments.layout = {
    breadcrumbs: [{ title: 'booking requests', href: '/teacher/appointments' }],
};

import React, { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, useForm, usePage, router, Link } from '@inertiajs/react';
import { User, Calendar, Clock, MessageSquare, Trash2, Sparkles, Check, Info } from 'lucide-react';
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
    const [activeTab, setActiveTab] = useState<'all' | 'upcoming' | 'completed'>('all');
    const { t } = useTranslation();

    const now = new Date();
    const allItems = appointments.data || [];

    const filteredAppointments = allItems.filter((apt) => {
        const isPast = new Date(apt.end_at) < now;
        const isFuture = new Date(apt.start_at) >= now;
        if (activeTab === 'upcoming') return apt.status === 'confirmed' && isFuture;
        if (activeTab === 'completed') return isPast || apt.status === 'completed';
        return true;
    });

    const upcomingCount = allItems.filter((a) => a.status === 'confirmed' && new Date(a.start_at) >= now).length;
    const completedCount = allItems.filter((a) => new Date(a.end_at) < now || a.status === 'completed').length;
    const trialsThisWeek = allItems.filter((a) => {
        if (!a.is_trial) return false;
        const start = new Date(a.start_at);
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(now.getDate() - 7);
        return start >= sevenDaysAgo;
    }).length;

    const latestTrial = allItems.find((a) => a.is_trial && new Date(a.start_at) >= now && a.status === 'confirmed');
    const [toastDismissed, setToastDismissed] = useState(false);

    const { data, setData, post, processing, errors, reset, clearErrors } =
        useForm({
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

    const handleStartSession = async (apt: any) => {
        try {
            const res = await axios.post(`/teacher/appointments/${apt.id}/start`);
            if (res.data.google_meet_link) {
                window.open(res.data.google_meet_link, '_blank');
            } else {
                toast.success('Session started');
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Could not start session');
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
            <Head title="SESSION MANAGEMENT — My Lessons · ConvoMate" />

            <div className="mx-auto max-w-6xl space-y-8 p-6 md:p-8" style={{ fontFamily: "'Schibsted Grotesk', sans-serif" }}>
                {/* Header Section */}
                <div className="relative overflow-hidden rounded-3xl bg-[#1E2A5A] p-8 text-white shadow-xl">
                    <div className="pointer-events-none absolute -top-20 -right-20 h-44 w-44 rounded-full bg-[#F0CE5F]/10 blur-2xl" />
                    
                    <div className="relative z-10 space-y-2">
                        <span className="text-[11px] font-black uppercase tracking-widest text-[#F7DE8B]">
                            SESSION MANAGEMENT
                        </span>
                        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                            My Lessons
                        </h1>
                        <p className="text-sm font-medium text-[#A9C6E8]/90 max-w-2xl">
                            Every lesson here is already booked and paid. Nothing needs your approval — just show up and teach.
                        </p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex flex-wrap gap-2 rounded-2xl border border-[#E8E6DE] bg-white p-1.5 shadow-sm">
                    <button
                        onClick={() => setActiveTab('all')}
                        className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                            activeTab === 'all'
                                ? 'bg-[#1E2A5A] text-white shadow-sm'
                                : 'text-[#6B7394] hover:bg-[#EEF4FB]'
                        }`}
                    >
                        All
                        <span className={`flex h-4 min-w-4 items-center justify-center rounded-full px-1.5 text-[10px] font-black ${
                            activeTab === 'all' ? 'bg-white/20 text-white' : 'bg-[#EEF4FB] text-[#1E2A5A]'
                        }`}>
                            {allItems.length}
                        </span>
                    </button>
                    <button
                        onClick={() => setActiveTab('upcoming')}
                        className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                            activeTab === 'upcoming'
                                ? 'bg-[#1E2A5A] text-white shadow-sm'
                                : 'text-[#6B7394] hover:bg-[#EEF4FB]'
                        }`}
                    >
                        Upcoming
                        {upcomingCount > 0 && (
                            <span className={`flex h-4 min-w-4 items-center justify-center rounded-full px-1.5 text-[10px] font-black ${
                                activeTab === 'upcoming' ? 'bg-white/20 text-white' : 'bg-[#EEF4FB] text-[#1E2A5A]'
                            }`}>
                                {upcomingCount}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('completed')}
                        className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                            activeTab === 'completed'
                                ? 'bg-[#1E2A5A] text-white shadow-sm'
                                : 'text-[#6B7394] hover:bg-[#EEF4FB]'
                        }`}
                    >
                        Completed
                        {completedCount > 0 && (
                            <span className={`flex h-4 min-w-4 items-center justify-center rounded-full px-1.5 text-[10px] font-black ${
                                activeTab === 'completed' ? 'bg-white/20 text-white' : 'bg-[#EEF4FB] text-[#1E2A5A]'
                            }`}>
                                {completedCount}
                            </span>
                        )}
                    </button>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left List (2 cols) */}
                    <div className="lg:col-span-2 space-y-4">
                        {filteredAppointments.length > 0 ? (
                            filteredAppointments.map((apt) => {
                                const isTrial = apt.is_trial;
                                const pupilName = apt.pupil?.full_name || 'Student';
                                const teacherFeedback = apt.feedbacks?.find((fb: any) => fb.author_id === auth.user.id);
                                const formattedDate = new Date(apt.start_at).toLocaleDateString('en-US', {
                                    weekday: 'short',
                                    day: 'numeric',
                                    month: 'short',
                                });
                                const formattedTimeStr = `${new Date(apt.start_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })} – ${new Date(apt.end_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}`;
                                const formattedPriceStr = (apt.price || (isTrial ? 23000 : 70000)).toLocaleString('ru-RU').replace(/,/g, ' ') + ' UZS';

                                return (
                                    <div
                                        key={apt.id}
                                        className={`rounded-3xl p-6 transition-all border-2 relative ${
                                            isTrial
                                                ? 'bg-[#FBEDBD]/60 border-[#F7DE8B] shadow-sm'
                                                : 'bg-white border-[#E8E6DE] shadow-sm'
                                        }`}
                                    >
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                {isTrial ? (
                                                    <span className="text-[10px] font-extrabold tracking-wider uppercase bg-[#1E2A5A] text-[#F7DE8B] px-3 py-1 rounded-full">
                                                        Trial · 20 min
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] font-extrabold tracking-wider uppercase bg-[#E4EEF9] border border-[#A9C6E8] text-[#1E2A5A] px-3 py-1 rounded-full">
                                                        Lesson · {apt.duration_minutes || 60} min
                                                    </span>
                                                )}
                                                {apt.status === 'confirmed' ? (
                                                    <span className="inline-flex items-center gap-1 bg-[#DDF2E6] text-[#1E7A4D] text-[10.5px] font-bold px-2.5 py-0.5 rounded-full">
                                                        <Check className="h-3 w-3" /> PAID
                                                    </span>
                                                ) : apt.status === 'accepted' ? (
                                                    <span className="inline-flex items-center gap-1 bg-[#FFF9E5] text-[#8A6A12] border border-[#F7DE8B] text-[10.5px] font-bold px-2.5 py-0.5 rounded-full">
                                                        STATUS ACCEPTED · AWAITING PAYMENT
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 bg-muted text-muted-foreground text-[10.5px] font-bold px-2.5 py-0.5 rounded-full uppercase">
                                                        {apt.status}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="text-xs text-[#6B7394] font-semibold">
                                                {formattedDate} · {formattedTimeStr}
                                            </div>
                                        </div>

                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <h3 className="text-lg font-extrabold text-[#22284A]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                                                    {pupilName}
                                                </h3>
                                                {isTrial && (
                                                    <p className="text-xs font-semibold text-[#8A6A12] mt-0.5">
                                                        — new student, first session with you
                                                    </p>
                                                )}
                                                <div className="text-xs text-[#6B7394] mt-2 flex items-center gap-2">
                                                    <strong className="text-[#1E2A5A] font-bold">{formattedPriceStr}</strong>
                                                    <span>· {isTrial ? '⅓ of your rate' : 'your full rate'}</span>
                                                </div>
                                            </div>

                                            <div className="flex flex-col sm:flex-row gap-2">
                                                {apt.status === 'confirmed' && (
                                                    <button
                                                        onClick={() => handleStartSession(apt)}
                                                        className="px-4 py-2 bg-[#1E2A5A] hover:bg-[#1E2A5A]/90 text-white rounded-full font-bold text-xs transition-all shadow-sm"
                                                    >
                                                        Join lesson
                                                    </button>
                                                )}

                                                {apt.status === 'confirmed' && !teacherFeedback && (
                                                    <button
                                                        onClick={() => handleOpenFeedbackModal(apt)}
                                                        className="px-3.5 py-2 border border-[#1E2A5A]/20 hover:bg-[#EEF4FB] text-[#1E2A5A] rounded-full font-bold text-xs transition-all"
                                                    >
                                                        Feedback
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {teacherFeedback && (
                                            <div className="mt-3 rounded-2xl bg-white/80 border border-[#E8E6DE] p-3 text-xs text-[#6B7394]">
                                                <b className="text-[#1E2A5A]">Your feedback:</b> "{teacherFeedback.comment}"
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        ) : (
                            <div className="rounded-3xl border border-dashed border-[#E8E6DE] bg-white p-12 text-center text-[#6B7394]">
                                <Clock className="mx-auto mb-3 h-10 w-10 text-[#6B7394]/40" />
                                <p className="font-bold text-base text-[#22284A]">No lessons found</p>
                                <p className="text-xs text-[#6B7394] mt-1">
                                    Unpaid bookings never appear here — a lesson exists only after the student has paid.
                                </p>
                            </div>
                        )}

                        <p className="text-xs text-[#6B7394] text-center pt-2">
                            ✦ Unpaid bookings never appear here — a lesson exists only after the student has paid.
                        </p>
                    </div>

                    {/* Right Sidebar */}
                    <div className="space-y-6">
                        {/* Quick Stats Card */}
                        <div className="rounded-3xl border border-[#E8E6DE] bg-white p-6 shadow-sm">
                            <div className="text-[11px] font-extrabold tracking-wider uppercase text-[#6B7394] mb-4">
                                QUICK STATS
                            </div>
                            <div className="space-y-3.5 text-sm">
                                <div className="flex items-center justify-between pb-3 border-b border-[#E8E6DE]">
                                    <span className="text-[#6B7394] font-medium">Trials this week</span>
                                    <span className="font-extrabold text-[#1E2A5A] text-base" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                                        {trialsThisWeek}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between pb-3 border-b border-[#E8E6DE]">
                                    <span className="text-[#6B7394] font-medium">Upcoming</span>
                                    <span className="font-extrabold text-[#1E2A5A] text-base" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                                        {upcomingCount}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[#6B7394] font-medium">Completed</span>
                                    <span className="font-extrabold text-[#1E2A5A] text-base" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                                        {completedCount}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Marketplace Tip Card */}
                        <div className="rounded-3xl border-1.5 border-[#F7DE8B] bg-[#FBEDBD]/70 p-6 shadow-sm">
                            <div className="text-[11px] font-black tracking-wider uppercase text-[#8A6A12] mb-2 flex items-center gap-1.5">
                                <Sparkles className="h-4 w-4 text-[#8A6A12]" /> MARKETPLACE TIP
                            </div>
                            <p className="text-xs text-[#5C4500] leading-relaxed font-medium">
                                A trial is your audition. Assess the student's level, name 2–3 concrete things to work on, and propose a weekly plan — that's how trials become regular students.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Floating Notification Toast for Trial Booking */}
                {latestTrial && !toastDismissed && (
                    <div className="fixed bottom-6 right-6 z-50 max-w-sm rounded-2xl bg-[#1E2A5A] p-4 text-white shadow-2xl border border-white/10 animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2 text-[#F7DE8B] text-xs font-extrabold uppercase tracking-wider">
                                <Sparkles className="h-4 w-4" /> New trial lesson
                            </div>
                            <button
                                onClick={() => setToastDismissed(true)}
                                className="text-white/60 hover:text-white text-xs font-bold"
                            >
                                ✕
                            </button>
                        </div>
                        <p className="text-xs text-white/90 mt-1.5 leading-snug">
                            <b>{latestTrial.pupil?.full_name}</b> booked a trial · {new Date(latestTrial.start_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })} · {(latestTrial.price || 23000).toLocaleString('ru-RU').replace(/,/g, ' ')} UZS, already paid. Tip: assess level and propose a plan.
                        </p>
                    </div>
                )}
            </div>

            {/* Feedback Dialog */}
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black tracking-tight" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                            {t('teacher.sessions_dialog_title')}
                        </DialogTitle>
                        <DialogDescription className="text-sm font-medium text-muted-foreground">
                            {t('teacher.sessions_dialog_desc', {
                                name: selectedApt?.pupil?.full_name,
                            })}
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="mt-4 space-y-6">
                        <div className="space-y-2.5">
                            <label className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                                {t('teacher.sessions_feedback_notes')}
                            </label>
                            <textarea
                                value={data.comment_text}
                                onChange={(e) =>
                                    setData('comment_text', e.target.value)
                                }
                                placeholder={t(
                                    'teacher.sessions_feedback_placeholder',
                                )}
                                className="min-h-[150px] w-full resize-none rounded-2xl border border-border bg-background p-3 text-sm font-medium transition-all focus:ring-2 focus:ring-[#1E2A5A] focus:outline-none"
                                required
                            />
                            {errors.comment_text && (
                                <p className="text-xs font-bold text-destructive">
                                    {errors.comment_text}
                                </p>
                            )}
                        </div>

                        <DialogFooter className="gap-2 border-t border-border/55 pt-2 sm:gap-0">
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="cursor-pointer rounded-xl border border-border px-4 py-2.5 text-xs font-bold transition-all hover:bg-muted"
                            >
                                {t('dashboard.cancel_button')}
                            </button>
                            <button
                                type="submit"
                                disabled={processing}
                                className="cursor-pointer rounded-xl bg-[#1E2A5A] text-white hover:bg-[#1E2A5A]/90 px-5 py-2.5 text-xs font-bold shadow-md transition-all disabled:opacity-50"
                            >
                                {processing
                                    ? t('sessions.submitting')
                                    : t('sessions.submit_btn')}
                            </button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}

Sessions.layout = {
    breadcrumbs: [{ title: 'my sessions', href: '/teacher/sessions' }],
};

import React, { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import TeacherCard from '@/components/teachers/TeacherCard';
import TeacherFilterBar, {
    FilterState,
} from '@/components/teachers/TeacherFilterBar';
import Pagination from '@/components/teachers/Pagination';
import PaymentModal from '@/components/PaymentModal';
import { Head, router, usePage } from '@inertiajs/react';
import { useTranslation } from '@/hooks/use-translation';
import { Calendar, SearchX, Users } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

interface Props {
    teachers: {
        data: any[];
        links?: any[];
        current_page?: number;
        last_page?: number;
        from?: number | null;
        to?: number | null;
        total?: number;
    };
    openGroupSessions?: any[];
    currentFilters?: FilterState;
    currentFilter?: string;
}

export default function Teachers({
    teachers,
    openGroupSessions = [],
    currentFilters,
    currentFilter = 'all',
}: Props) {
    const { t } = useTranslation();
    const { auth } = usePage<any>().props;
    const [enrollingId, setEnrollingId] = useState<string | null>(null);
    const [paymentEnrollment, setPaymentEnrollment] = useState<any | null>(null);

    const handleEnrollGroup = async (session: any) => {
        if (session.my_enrollment?.status === 'pending_payment') {
            setPaymentEnrollment({
                id: session.my_enrollment.id,
                title: session.title,
                amount: session.price_per_seat,
                teacherName: session.teacher?.full_name,
            });
            return;
        }
        setEnrollingId(session.id);
        try {
            const res = await axios.post(`/pupil/group-sessions/${session.id}/enroll`);
            const enrollment = res.data?.enrollment;
            toast.success('Seat reserved! Upload your receipt to confirm.');
            if (enrollment) {
                setPaymentEnrollment({
                    id: enrollment.id,
                    title: session.title,
                    amount: session.price_per_seat,
                    teacherName: session.teacher?.full_name,
                });
            }
            router.reload({ only: ['openGroupSessions'] });
        } catch (err: any) {
            toast.error(
                err?.response?.data?.message || 'Unable to reserve seat.',
            );
        } finally {
            setEnrollingId(null);
        }
    };

    const activeFilters: FilterState = currentFilters || {
        status: currentFilter,
    };

    return (
        <>
            <Head title={t('teachers.browse') || 'Find Teachers'} />
            <div className="mx-auto max-w-7xl space-y-8 p-6 md:p-8">
                {/* Header Section */}
                <div className="relative overflow-hidden rounded-3xl bg-brand-navy p-8 text-white shadow-lg shadow-brand-navy/10 dark:border dark:border-white/10 dark:bg-gradient-to-r dark:from-[#091334] dark:to-[#0d1b3e]">
                    <div className="pointer-events-none absolute -top-20 -right-20 h-44 w-44 rounded-full bg-brand-lightblue/10 blur-xl" />
                    <div className="pointer-events-none absolute -bottom-20 -left-20 h-44 w-44 rounded-full bg-brand-yellow/10 blur-xl" />

                    <div className="relative z-10 space-y-1.5">
                        <h1 className="text-2xl font-black tracking-tight md:text-3xl">
                            {t('teachers_directory.title') ||
                                'Find Your Ideal Teacher'}
                        </h1>
                        <p className="max-w-2xl text-xs font-medium text-white/80 md:text-sm dark:text-slate-300">
                            {t('teachers_directory.subtitle') ||
                                'Browse verified English tutors, filter by availability, level, and price to book your live 1-on-1 session.'}
                        </p>
                    </div>
                </div>

                {/* Filter Bar with Search Input */}
                <TeacherFilterBar
                    baseUrl="/pupil/teachers"
                    currentFilters={activeFilters}
                />

                {openGroupSessions.length > 0 && (
                    <section className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="flex items-center gap-2 text-lg font-extrabold text-[#1E2A5A] dark:text-white">
                                    <Users className="h-5 w-5 text-indigo-600 dark:text-brand-yellow" />
                                    Open Group Conversations
                                </h2>
                                <p className="text-xs text-muted-foreground">
                                    Join small-group speaking sessions hosted by verified teachers. Vouchers do not apply.
                                </p>
                            </div>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {openGroupSessions.map((gs: any) => (
                                <div
                                    key={gs.id}
                                    className="flex flex-col justify-between rounded-2xl border border-[#EAE4D2] bg-white p-5 shadow-xs dark:border-white/10 dark:bg-card"
                                >
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-[11px] font-bold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                                                {gs.target_level}
                                            </span>
                                            <span className="text-xs font-bold text-emerald-700 tabular-nums dark:text-emerald-400">
                                                {gs.available_seats ?? 0} / {gs.max_seats} seats left
                                            </span>
                                        </div>
                                        <h3 className="text-base font-bold text-[#1E2A5A] dark:text-white">
                                            {gs.title}
                                        </h3>
                                        <p className="text-xs font-medium text-muted-foreground">
                                            Hosted by {gs.teacher?.full_name} · {gs.duration_minutes} min
                                        </p>
                                        {gs.topic && (
                                            <p className="line-clamp-2 text-xs text-muted-foreground">
                                                {gs.topic}
                                            </p>
                                        )}
                                        <p className="flex items-center gap-1.5 text-xs font-semibold text-[#1E2A5A] tabular-nums dark:text-slate-200">
                                            <Calendar className="h-3.5 w-3.5" />
                                            {new Date(gs.start_at).toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="mt-4 flex items-center justify-between border-t pt-3 dark:border-white/10">
                                        <span className="text-sm font-extrabold text-[#1E2A5A] tabular-nums dark:text-brand-yellow">
                                            {Number(gs.price_per_seat).toLocaleString('ru-RU').replace(/,/g, ' ')} UZS
                                        </span>
                                        {gs.my_enrollment?.status === 'enrolled' ? (
                                            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                                                Enrolled
                                            </span>
                                        ) : (
                                            <button
                                                type="button"
                                                disabled={
                                                    enrollingId === gs.id ||
                                                    ((gs.available_seats ?? 0) <= 0 &&
                                                        gs.my_enrollment?.status !== 'pending_payment')
                                                }
                                                onClick={() => handleEnrollGroup(gs)}
                                                className="cursor-pointer rounded-xl bg-[#1E2A5A] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#1E2A5A]/90 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-brand-yellow dark:text-[#061445]"
                                            >
                                                {gs.my_enrollment?.status === 'pending_payment'
                                                    ? 'Upload Receipt'
                                                    : (gs.available_seats ?? 0) <= 0
                                                      ? 'Full'
                                                      : enrollingId === gs.id
                                                        ? 'Reserving...'
                                                        : 'Reserve Seat'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Teachers Grid */}
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {teachers.data.map((teacher) => (
                        <TeacherCard key={teacher.id} teacher={teacher} />
                    ))}
                </div>

                {/* Empty Search / Filter State */}
                {teachers.data.length === 0 && (
                    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-[#EAE4D2] bg-white py-16 text-center shadow-xs dark:border-white/10 dark:bg-card">
                        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FDF7E4] text-[#1E2A5A] dark:bg-brand-yellow/10 dark:text-brand-yellow">
                            <SearchX className="h-7 w-7 text-[#1E2A5A] dark:text-brand-yellow" />
                        </div>
                        <h3 className="text-lg font-bold text-[#1E2A5A] dark:text-white">
                            No teachers found
                        </h3>
                        <p className="mt-1 max-w-md text-xs font-medium text-[#5C6480] dark:text-gray-400">
                            {activeFilters.search
                                ? `We couldn't find any teachers matching "${activeFilters.search}". Try checking for spelling or clear search.`
                                : t('teachers_directory.no_teachers') ||
                                  'No teachers match the selected filter criteria.'}
                        </p>
                    </div>
                )}

                {/* Pagination Controls */}
                {teachers.links && (
                    <Pagination
                        links={teachers.links}
                        from={teachers.from}
                        to={teachers.to}
                        total={teachers.total}
                    />
                )}
            </div>

            {paymentEnrollment && (
                <PaymentModal
                    isOpen={!!paymentEnrollment}
                    onClose={() => setPaymentEnrollment(null)}
                    groupEnrollmentId={paymentEnrollment.id}
                    itemTitle={paymentEnrollment.title}
                    amount={paymentEnrollment.amount}
                    teacherName={paymentEnrollment.teacherName}
                    pupilId={auth?.user?.short_id || auth?.user?.id?.substring(0, 8).toUpperCase()}
                    pupilName={auth?.user?.full_name}
                    onSuccess={() => router.reload({ only: ['openGroupSessions'] })}
                />
            )}
        </>
    );
}

Teachers.layout = {
    breadcrumbs: [{ title: 'find teachers', href: '/pupil/teachers' }],
};

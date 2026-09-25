import { useState } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    CheckCircle2,
    XCircle,
    Clock,
    CreditCard,
    ShieldCheck,
    User,
    Calendar,
    AlertCircle,
    Package,
} from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';
import { formatDuration, formatRemainingBalance } from '@/lib/duration';

interface UserItem {
    id: string;
    full_name: string;
    email: string;
    avatar?: string;
    role: string;
}

interface Appointment {
    id: string;
    teacher_id: string;
    pupil_id: string;
    start_at: string;
    end_at: string;
    status: string;
    payment_status?: string;
    payment_rejection_reason?: string;
    cancellation_reason?: string;
    cancelled_by?: string;
    cancelled_by_user?: UserItem;
    cancelledBy?: UserItem;
    teacher?: UserItem;
    pupil?: UserItem;
    created_at: string;
}

interface PackageItem {
    id: string;
    pupil_id: string;
    teacher_id: string;
    teacher_package_id: string;
    package_title: string;
    total_minutes: number;
    remaining_minutes: number;
    price_paid: number;
    payment_status: 'pending' | 'verifying' | 'paid' | 'rejected';
    payment_rejection_reason?: string;
    status: string;
    teacher?: UserItem;
    pupil?: UserItem;
    created_at: string;
}

interface Props {
    appointments: {
        data: Appointment[];
        links: any[];
    };
    packages?: {
        data: PackageItem[];
        links: any[];
    };
    stats: {
        pending_verifications: number;
        total_confirmed: number;
        total_rejected: number;
        total_cancelled: number;
        pending_package_verifications?: number;
        total_package_confirmed?: number;
        total_package_rejected?: number;
    };
    currentFilter: string;
    currentTab?: string;
}

export default function AdminDashboard({
    appointments,
    packages,
    stats,
    currentFilter,
    currentTab = 'appointments',
}: Props) {
    const { locale, t } = useTranslation();
    const [activeTab, setActiveTab] = useState<'appointments' | 'packages'>(
        currentTab === 'packages' ? 'packages' : 'appointments',
    );
    const [selectedReject, setSelectedReject] = useState<{
        id: string;
        type: 'appointment' | 'package';
    } | null>(null);

    const { data, setData, post, processing, reset, errors } = useForm({
        reason: '',
    });

    const handleConfirm = (id: string) => {
        if (
            confirm(
                'Are you sure you want to confirm payment for this conversation?',
            )
        ) {
            router.post(`/admin/appointments/${id}/confirm-payment`);
        }
    };

    const handleConfirmPackage = (id: string) => {
        if (
            confirm(
                'Are you sure you want to confirm payment for this conversation package? The hours will be credited to the student immediately.',
            )
        ) {
            router.post(`/admin/packages/${id}/confirm-payment`);
        }
    };

    const handleRejectSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedReject) return;

        const endpoint =
            selectedReject.type === 'package'
                ? `/admin/packages/${selectedReject.id}/reject-payment`
                : `/admin/appointments/${selectedReject.id}/reject-payment`;

        post(endpoint, {
            onSuccess: () => {
                setSelectedReject(null);
                reset();
            },
        });
    };

    const setFilter = (filter: string) => {
        router.get(
            '/admin/dashboard',
            { status: filter, tab: activeTab },
            { preserveState: true },
        );
    };

    const handleTabChange = (tab: 'appointments' | 'packages') => {
        setActiveTab(tab);
        router.get(
            '/admin/dashboard',
            { status: currentFilter, tab },
            { preserveState: true },
        );
    };

    return (
        <>
            <Head title="Admin Dashboard - Payment Confirmations" />

            <div className="mx-auto max-w-7xl space-y-8 p-4 md:p-8">
                {/* Header Banner */}
                <div className="rounded-2xl border border-indigo-500/20 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white shadow-xl">
                    <div className="flex items-center gap-4">
                        <div className="rounded-xl border border-indigo-400/30 bg-indigo-600/30 p-3 backdrop-blur-md">
                            <CreditCard className="h-8 w-8 text-indigo-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold md:text-3xl">
                                Payment Verification Dashboard
                            </h1>
                            <p className="mt-1 text-sm text-indigo-200">
                                Verify pupil payment confirmations for
                                teacher-accepted booking requests.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card className="border-amber-200 bg-amber-50/40 dark:border-amber-900/50 dark:bg-amber-950/20">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-amber-900 dark:text-amber-300">
                                Pending Verifications
                            </CardTitle>
                            <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-amber-900 dark:text-amber-100">
                                {stats.pending_verifications + (stats.pending_package_verifications ?? 0)}
                            </div>
                            <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
                                {stats.pending_verifications} sessions · {stats.pending_package_verifications ?? 0} packages awaiting confirmation
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-emerald-200 bg-emerald-50/40 dark:border-emerald-900/50 dark:bg-emerald-950/20">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-emerald-900 dark:text-emerald-300">
                                Confirmed Payments
                            </CardTitle>
                            <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                                {stats.total_confirmed + (stats.total_package_confirmed ?? 0)}
                            </div>
                            <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-400">
                                {stats.total_confirmed} sessions · {stats.total_package_confirmed ?? 0} packages verified
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-red-200 bg-red-50/40 dark:border-red-900/50 dark:bg-red-950/20">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-red-900 dark:text-red-300">
                                Rejected Payments
                            </CardTitle>
                            <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-900 dark:text-red-100">
                                {stats.total_rejected + (stats.total_package_rejected ?? 0)}
                            </div>
                            <p className="mt-1 text-xs text-red-700 dark:text-red-400">
                                {stats.total_rejected} sessions · {stats.total_package_rejected ?? 0} packages rejected
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-gray-200 bg-gray-50/40 dark:border-gray-800 dark:bg-gray-900/40">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-gray-900 dark:text-gray-300">
                                Cancelled Bookings
                            </CardTitle>
                            <XCircle className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                {stats.total_cancelled ?? 0}
                            </div>
                            <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                                Sessions cancelled by pupils or teachers
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Section View Tabs (Appointments vs Conversation Packs) */}
                <div className="flex border-b border-gray-200 dark:border-gray-800 gap-4">
                    <button
                        type="button"
                        onClick={() => handleTabChange('appointments')}
                        className={`flex items-center gap-2 border-b-2 pb-3 px-2 text-sm font-semibold transition cursor-pointer ${
                            activeTab === 'appointments'
                                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <Calendar className="h-4 w-4" />
                        <span>Booked Conversations</span>
                        {stats.pending_verifications > 0 && (
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">
                                {stats.pending_verifications}
                            </span>
                        )}
                    </button>
                    <button
                        type="button"
                        onClick={() => handleTabChange('packages')}
                        className={`flex items-center gap-2 border-b-2 pb-3 px-2 text-sm font-semibold transition cursor-pointer ${
                            activeTab === 'packages'
                                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <Package className="h-4 w-4" />
                        <span>{t('packages.title') || 'Conversation Packs'}</span>
                        {(stats.pending_package_verifications ?? 0) > 0 && (
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">
                                {stats.pending_package_verifications}
                            </span>
                        )}
                    </button>
                </div>

                {/* Filter Tabs & Data Table */}
                {activeTab === 'appointments' ? (
                    <Card className="shadow-md">
                    <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <CardTitle className="text-lg">
                                Booked Conversations
                            </CardTitle>
                            <CardDescription>
                                Confirm payments to transition bookings from
                                'Accepted (Verifying)' to 'Confirmed'.
                            </CardDescription>
                        </div>
                        <div className="flex flex-wrap gap-2 rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
                            <Button
                                size="sm"
                                variant={
                                    currentFilter === 'accepted'
                                        ? 'default'
                                        : 'ghost'
                                }
                                onClick={() => setFilter('accepted')}
                                className={
                                    currentFilter === 'accepted'
                                        ? 'bg-indigo-600 text-white'
                                        : ''
                                }
                            >
                                Pending Verification (
                                {stats.pending_verifications})
                            </Button>
                            <Button
                                size="sm"
                                variant={
                                    currentFilter === 'confirmed'
                                        ? 'default'
                                        : 'ghost'
                                }
                                onClick={() => setFilter('confirmed')}
                                className={
                                    currentFilter === 'confirmed'
                                        ? 'bg-indigo-600 text-white'
                                        : ''
                                }
                            >
                                Confirmed ({stats.total_confirmed})
                            </Button>
                            <Button
                                size="sm"
                                variant={
                                    currentFilter === 'rejected'
                                        ? 'default'
                                        : 'ghost'
                                }
                                onClick={() => setFilter('rejected')}
                                className={
                                    currentFilter === 'rejected'
                                        ? 'bg-indigo-600 text-white'
                                        : ''
                                }
                            >
                                Rejected ({stats.total_rejected})
                            </Button>
                            <Button
                                size="sm"
                                variant={
                                    currentFilter === 'cancelled'
                                        ? 'default'
                                        : 'ghost'
                                }
                                onClick={() => setFilter('cancelled')}
                                className={
                                    currentFilter === 'cancelled'
                                        ? 'bg-indigo-600 text-white'
                                        : ''
                                }
                            >
                                Cancelled ({stats.total_cancelled ?? 0})
                            </Button>
                            <Button
                                size="sm"
                                variant={
                                    currentFilter === 'all'
                                        ? 'default'
                                        : 'ghost'
                                }
                                onClick={() => setFilter('all')}
                                className={
                                    currentFilter === 'all'
                                        ? 'bg-indigo-600 text-white'
                                        : ''
                                }
                            >
                                All
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {appointments.data.length === 0 ? (
                            <div className="py-12 text-center text-gray-500">
                                <AlertCircle className="mx-auto h-12 w-12 text-gray-300" />
                                <p className="mt-2 text-sm">
                                    No bookings found for the selected filter.
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="border-b bg-gray-50 text-xs text-gray-700 uppercase dark:bg-gray-800 dark:text-gray-300">
                                        <tr>
                                            <th className="px-4 py-3">Pupil</th>
                                            <th className="px-4 py-3">
                                                Teacher
                                            </th>
                                            <th className="px-4 py-3">
                                                Schedule Time
                                            </th>
                                            <th className="px-4 py-3">
                                                Status
                                            </th>
                                            <th className="px-4 py-3 text-right">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {appointments.data.map((appt) => (
                                            <tr
                                                key={appt.id}
                                                className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50"
                                            >
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-9 w-9">
                                                            <AvatarImage
                                                                src={
                                                                    appt.pupil
                                                                        ?.avatar
                                                                }
                                                            />
                                                            <AvatarFallback>
                                                                {appt.pupil?.full_name?.substring(
                                                                    0,
                                                                    2,
                                                                ) || 'P'}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <div className="flex flex-wrap items-center gap-1.5">
                                                                <Link
                                                                    href={`/profile/${appt.pupil_id}`}
                                                                    className="font-medium text-indigo-600 hover:underline"
                                                                >
                                                                    {
                                                                        appt
                                                                            .pupil
                                                                            ?.full_name
                                                                    }
                                                                </Link>
                                                                <span className="inline-flex items-center rounded border border-indigo-200 bg-indigo-50 px-1.5 py-0.5 font-mono text-[10px] font-bold text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                                                                    ID:{' '}
                                                                    {appt.pupil_id
                                                                        ? appt.pupil_id.substring(
                                                                              0,
                                                                              8,
                                                                          )
                                                                        : 'N/A'}
                                                                </span>
                                                            </div>
                                                            <p className="text-xs text-gray-500">
                                                                {
                                                                    appt.pupil
                                                                        ?.email
                                                                }
                                                            </p>
                                                            <p className="font-mono text-[11px] font-semibold text-indigo-600 select-all dark:text-indigo-400">
                                                                Full ID:{' '}
                                                                {appt.pupil_id}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-9 w-9">
                                                            <AvatarImage
                                                                src={
                                                                    appt.teacher
                                                                        ?.avatar
                                                                }
                                                            />
                                                            <AvatarFallback>
                                                                {appt.teacher?.full_name?.substring(
                                                                    0,
                                                                    2,
                                                                ) || 'T'}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <div className="flex flex-wrap items-center gap-1.5">
                                                                <Link
                                                                    href={`/profile/${appt.teacher_id}`}
                                                                    className="font-medium text-indigo-600 hover:underline"
                                                                >
                                                                    {
                                                                        appt
                                                                            .teacher
                                                                            ?.full_name
                                                                    }
                                                                </Link>
                                                                <span className="inline-flex items-center rounded border border-blue-200 bg-blue-50 px-1.5 py-0.5 font-mono text-[10px] font-bold text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300">
                                                                    ID:{' '}
                                                                    {appt.teacher_id
                                                                        ? appt.teacher_id.substring(
                                                                              0,
                                                                              8,
                                                                          )
                                                                        : 'N/A'}
                                                                </span>
                                                            </div>
                                                            <p className="text-xs text-gray-500">
                                                                {
                                                                    appt.teacher
                                                                        ?.email
                                                                }
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300">
                                                        <Calendar className="h-3.5 w-3.5 text-gray-400" />
                                                        {new Date(
                                                            appt.start_at,
                                                        ).toLocaleString([], {
                                                            month: 'short',
                                                            day: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                        })}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4">
                                                    {appt.status ===
                                                        'accepted' && (
                                                        <Badge className="flex w-fit items-center gap-1 bg-amber-500 text-white">
                                                            <Clock className="h-3 w-3" />
                                                            Accepted
                                                            (Verifying...)
                                                        </Badge>
                                                    )}
                                                    {appt.status ===
                                                        'confirmed' && (
                                                        <Badge className="flex w-fit items-center gap-1 bg-emerald-600 text-white">
                                                            <CheckCircle2 className="h-3 w-3" />
                                                            Confirmed
                                                        </Badge>
                                                    )}
                                                    {appt.status ===
                                                        'rejected' && (
                                                        <div className="space-y-1">
                                                            <Badge className="flex w-fit items-center gap-1 bg-red-600 text-white">
                                                                <XCircle className="h-3 w-3" />
                                                                Rejected
                                                            </Badge>
                                                            {appt.payment_rejection_reason && (
                                                                <p className="max-w-xs text-xs text-red-500">
                                                                    Reason:{' '}
                                                                    {
                                                                        appt.payment_rejection_reason
                                                                    }
                                                                </p>
                                                            )}
                                                        </div>
                                                    )}
                                                    {appt.status ===
                                                        'cancelled' && (
                                                        <div className="space-y-1">
                                                            <Badge className="flex w-fit items-center gap-1 bg-gray-600 text-white">
                                                                <XCircle className="h-3 w-3" />
                                                                Cancelled
                                                            </Badge>
                                                            {appt.cancelled_by && (
                                                                <p className="text-[11px] font-medium text-gray-500">
                                                                    By:{' '}
                                                                    {appt.cancelled_by ===
                                                                    appt.pupil_id
                                                                        ? 'Pupil'
                                                                        : appt.cancelled_by ===
                                                                            appt.teacher_id
                                                                          ? 'Teacher'
                                                                          : appt
                                                                                  .cancelledBy
                                                                                  ?.full_name ||
                                                                            'User'}
                                                                </p>
                                                            )}
                                                            {appt.cancellation_reason && (
                                                                <p className="max-w-xs text-xs text-gray-500 italic">
                                                                    "
                                                                    {
                                                                        appt.cancellation_reason
                                                                    }
                                                                    "
                                                                </p>
                                                            )}
                                                        </div>
                                                    )}
                                                    {appt.status ===
                                                        'pending' && (
                                                        <Badge className="flex w-fit items-center gap-1 bg-sky-600 text-white">
                                                            <Clock className="h-3 w-3" />
                                                            Pending Teacher
                                                        </Badge>
                                                    )}
                                                </td>
                                                <td className="px-4 py-4 text-right">
                                                    {appt.status ===
                                                    'accepted' ? (
                                                        <div className="flex items-center justify-end gap-2">
                                                            <Button
                                                                size="sm"
                                                                onClick={() =>
                                                                    handleConfirm(
                                                                        appt.id,
                                                                    )
                                                                }
                                                                className="bg-emerald-600 text-white hover:bg-emerald-700"
                                                            >
                                                                <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                                                                Confirm Payment
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="destructive"
                                                                onClick={() =>
                                                                    setSelectedReject({
                                                                        id: appt.id,
                                                                        type: 'appointment',
                                                                    })
                                                                }
                                                            >
                                                                <XCircle className="mr-1 h-3.5 w-3.5" />
                                                                Reject
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-gray-400">
                                                            —
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        {appointments.links && appointments.links.length > 3 && (
                            <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 dark:border-gray-800">
                                <div className="flex gap-1">
                                    {appointments.links.map((link, idx) => (
                                        <Link
                                            key={idx}
                                            href={link.url || '#'}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                            className={`rounded px-3 py-1 text-xs font-medium transition ${
                                                link.active
                                                    ? 'bg-indigo-600 text-white'
                                                    : link.url
                                                      ? 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                                                      : 'cursor-not-allowed text-gray-400'
                                            }`}
                                            preserveState
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            ) : (
                <Card className="shadow-md">
                    <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <CardTitle className="text-lg">
                                {t('packages.title') || 'Conversation Packs'}
                            </CardTitle>
                            <CardDescription>
                                {t('packages.admin_desc') || 'Confirm payments to activate conversation packages for pupils.'}
                            </CardDescription>
                        </div>
                        <div className="flex flex-wrap gap-2 rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
                            <Button
                                size="sm"
                                variant={
                                    currentFilter === 'accepted'
                                        ? 'default'
                                        : 'ghost'
                                }
                                onClick={() => setFilter('accepted')}
                                className={
                                    currentFilter === 'accepted'
                                        ? 'bg-indigo-600 text-white'
                                        : ''
                                }
                            >
                                Pending Verification (
                                {stats.pending_package_verifications ?? 0})
                            </Button>
                            <Button
                                size="sm"
                                variant={
                                    currentFilter === 'confirmed'
                                        ? 'default'
                                        : 'ghost'
                                }
                                onClick={() => setFilter('confirmed')}
                                className={
                                    currentFilter === 'confirmed'
                                        ? 'bg-indigo-600 text-white'
                                        : ''
                                }
                            >
                                Confirmed ({stats.total_package_confirmed ?? 0})
                            </Button>
                            <Button
                                size="sm"
                                variant={
                                    currentFilter === 'rejected'
                                        ? 'default'
                                        : 'ghost'
                                }
                                onClick={() => setFilter('rejected')}
                                className={
                                    currentFilter === 'rejected'
                                        ? 'bg-indigo-600 text-white'
                                        : ''
                                }
                            >
                                Rejected ({stats.total_package_rejected ?? 0})
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {!packages || packages.data.length === 0 ? (
                            <div className="py-12 text-center text-gray-500">
                                <Package className="mx-auto h-12 w-12 text-gray-300 stroke-1" />
                                <p className="mt-2 text-sm">
                                    No conversation package orders found for the selected filter.
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="border-b bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                                        <tr>
                                            <th className="px-4 py-3">Pupil</th>
                                            <th className="px-4 py-3">Teacher</th>
                                            <th className="px-4 py-3">Package Details</th>
                                            <th className="px-4 py-3">Price Paid</th>
                                            <th className="px-4 py-3">Status</th>
                                            <th className="px-4 py-3 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {packages.data.map((pkg) => (
                                            <tr
                                                key={pkg.id}
                                                className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50"
                                            >
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-9 w-9">
                                                            <AvatarImage
                                                                src={pkg.pupil?.avatar}
                                                            />
                                                            <AvatarFallback className="bg-indigo-100 text-xs font-semibold text-indigo-700">
                                                                {pkg.pupil?.full_name?.charAt(0) || 'P'}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                                {pkg.pupil?.full_name || 'Pupil'}
                                                            </p>
                                                            <p className="text-xs text-gray-500">
                                                                {pkg.pupil?.email}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-9 w-9">
                                                            <AvatarImage
                                                                src={pkg.teacher?.avatar}
                                                            />
                                                            <AvatarFallback className="bg-purple-100 text-xs font-semibold text-purple-700">
                                                                {pkg.teacher?.full_name?.charAt(0) || 'T'}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                                {pkg.teacher?.full_name || 'Teacher'}
                                                            </p>
                                                            <p className="text-xs text-gray-500">
                                                                {pkg.teacher?.email}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                                            {pkg.package_title}
                                                        </p>
                                                        <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                                                            <span className="font-medium text-indigo-600 dark:text-indigo-400">
                                                                {formatDuration(pkg.total_minutes, locale)}
                                                            </span>
                                                            <span>•</span>
                                                            <span>
                                                                {formatRemainingBalance(pkg.remaining_minutes, locale)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div>
                                                        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                                            {Number(pkg.price_paid).toLocaleString()} so'm
                                                        </span>
                                                        <p className="text-[11px] text-gray-400">
                                                            {new Date(pkg.created_at).toLocaleDateString([], {
                                                                month: 'short',
                                                                day: 'numeric',
                                                                year: 'numeric',
                                                            })}
                                                        </p>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4">
                                                    {pkg.payment_status === 'verifying' && (
                                                        <Badge className="flex w-fit items-center gap-1 bg-amber-500 text-white">
                                                            <Clock className="h-3 w-3" />
                                                            Verifying
                                                        </Badge>
                                                    )}
                                                    {pkg.payment_status === 'paid' && (
                                                        <Badge className="flex w-fit items-center gap-1 bg-emerald-600 text-white">
                                                            <CheckCircle2 className="h-3 w-3" />
                                                            Confirmed & Active
                                                        </Badge>
                                                    )}
                                                    {pkg.payment_status === 'rejected' && (
                                                        <div className="space-y-1">
                                                            <Badge className="flex w-fit items-center gap-1 bg-red-600 text-white">
                                                                <XCircle className="h-3 w-3" />
                                                                Rejected
                                                            </Badge>
                                                            {pkg.payment_rejection_reason && (
                                                                <p className="max-w-xs text-xs text-red-500">
                                                                    Reason: {pkg.payment_rejection_reason}
                                                                </p>
                                                            )}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-4 py-4 text-right">
                                                    {pkg.payment_status === 'verifying' ? (
                                                        <div className="flex items-center justify-end gap-2">
                                                            <Button
                                                                size="sm"
                                                                onClick={() =>
                                                                    handleConfirmPackage(pkg.id)
                                                                }
                                                                className="bg-emerald-600 text-white hover:bg-emerald-700"
                                                            >
                                                                <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                                                                Confirm Payment
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="destructive"
                                                                onClick={() =>
                                                                    setSelectedReject({
                                                                        id: pkg.id,
                                                                        type: 'package',
                                                                    })
                                                                }
                                                            >
                                                                <XCircle className="mr-1 h-3.5 w-3.5" />
                                                                Reject
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-gray-400">
                                                            —
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        {packages && packages.links && packages.links.length > 3 && (
                            <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 dark:border-gray-800">
                                <div className="flex gap-1">
                                    {packages.links.map((link, idx) => (
                                        <Link
                                            key={idx}
                                            href={link.url || '#'}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                            className={`rounded px-3 py-1 text-xs font-medium transition ${
                                                link.active
                                                    ? 'bg-indigo-600 text-white'
                                                    : link.url
                                                      ? 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                                                      : 'cursor-not-allowed text-gray-400'
                                            }`}
                                            preserveState
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

                {/* Reject Reason Modal */}
                <Dialog
                    open={Boolean(selectedReject)}
                    onOpenChange={() => setSelectedReject(null)}
                >
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-red-600">
                                <XCircle className="h-5 w-5" />{' '}
                                {selectedReject?.type === 'package'
                                    ? 'Reject Conversation Pack Payment'
                                    : 'Reject Payment'}
                            </DialogTitle>
                            <DialogDescription>
                                {selectedReject?.type === 'package'
                                    ? 'Please enter the reason for rejecting this conversation pack payment. This will cancel the order.'
                                    : 'Please enter the reason for rejecting this payment. This reason will be displayed to both teacher and pupil.'}
                            </DialogDescription>
                        </DialogHeader>

                        <form
                            onSubmit={handleRejectSubmit}
                            className="space-y-4"
                        >
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Rejection Reason{' '}
                                    <span className="text-red-500">*</span>
                                </label>
                                <Textarea
                                    rows={4}
                                    placeholder="e.g., Payment screenshot unreadable or missing..."
                                    value={data.reason}
                                    onChange={(e) =>
                                        setData('reason', e.target.value)
                                    }
                                    className="mt-1"
                                    required
                                />
                                {errors.reason && (
                                    <p className="mt-1 text-xs text-red-500">
                                        {errors.reason}
                                    </p>
                                )}
                            </div>

                            <DialogFooter className="gap-2 sm:gap-0">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setSelectedReject(null)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    variant="destructive"
                                    disabled={processing}
                                >
                                    Confirm Rejection
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}

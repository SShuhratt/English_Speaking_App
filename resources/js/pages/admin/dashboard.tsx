import { useState } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { CheckCircle2, XCircle, Clock, CreditCard, ShieldCheck, User, Calendar, AlertCircle } from 'lucide-react';

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
    teacher?: UserItem;
    pupil?: UserItem;
    created_at: string;
}

interface Props {
    appointments: {
        data: Appointment[];
        links: any[];
    };
    stats: {
        pending_verifications: number;
        total_confirmed: number;
        total_rejected: number;
    };
    currentFilter: string;
}

export default function AdminDashboard({ appointments, stats, currentFilter }: Props) {
    const [selectedRejectId, setSelectedRejectId] = useState<string | null>(null);

    const { data, setData, post, processing, reset, errors } = useForm({
        reason: '',
    });

    const handleConfirm = (id: string) => {
        if (confirm('Are you sure you want to confirm payment for this conversation?')) {
            router.post(`/admin/appointments/${id}/confirm-payment`);
        }
    };

    const handleRejectSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedRejectId) return;

        post(`/admin/appointments/${selectedRejectId}/reject-payment`, {
            onSuccess: () => {
                setSelectedRejectId(null);
                reset();
            },
        });
    };

    const setFilter = (filter: string) => {
        router.get('/admin/dashboard', { status: filter }, { preserveState: true });
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Admin Payment Verification', href: '/admin/dashboard' }]}>
            <Head title="Admin Dashboard - Payment Confirmations" />

            <div className="mx-auto max-w-7xl space-y-8 p-4 md:p-8">
                {/* Header Banner */}
                <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white shadow-xl border border-indigo-500/20">
                    <div className="flex items-center gap-4">
                        <div className="rounded-xl bg-indigo-600/30 p-3 backdrop-blur-md border border-indigo-400/30">
                            <CreditCard className="h-8 w-8 text-indigo-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold md:text-3xl">Payment Verification Dashboard</h1>
                            <p className="mt-1 text-sm text-indigo-200">
                                Verify pupil payment confirmations for teacher-accepted booking requests.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card className="border-amber-200 bg-amber-50/40 dark:border-amber-900/50 dark:bg-amber-950/20">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-amber-900 dark:text-amber-300">
                                Pending Verifications
                            </CardTitle>
                            <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-amber-900 dark:text-amber-100">
                                {stats.pending_verifications}
                            </div>
                            <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                                Bookings accepted by teachers waiting for payment proof confirmation
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
                                {stats.total_confirmed}
                            </div>
                            <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1">
                                Verified sessions ready for active video call
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
                                {stats.total_rejected}
                            </div>
                            <p className="text-xs text-red-700 dark:text-red-400 mt-1">
                                Payments rejected with reason communicated to users
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Filter Tabs & Data Table */}
                <Card className="shadow-md">
                    <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <CardTitle className="text-lg">Booked Conversations</CardTitle>
                            <CardDescription>
                                Confirm payments to transition bookings from 'Accepted (Verifying)' to 'Confirmed'.
                            </CardDescription>
                        </div>
                        <div className="flex gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                            <Button
                                size="sm"
                                variant={currentFilter === 'accepted' ? 'default' : 'ghost'}
                                onClick={() => setFilter('accepted')}
                                className={currentFilter === 'accepted' ? 'bg-indigo-600 text-white' : ''}
                            >
                                Pending Verification ({stats.pending_verifications})
                            </Button>
                            <Button
                                size="sm"
                                variant={currentFilter === 'confirmed' ? 'default' : 'ghost'}
                                onClick={() => setFilter('confirmed')}
                                className={currentFilter === 'confirmed' ? 'bg-indigo-600 text-white' : ''}
                            >
                                Confirmed ({stats.total_confirmed})
                            </Button>
                            <Button
                                size="sm"
                                variant={currentFilter === 'rejected' ? 'default' : 'ghost'}
                                onClick={() => setFilter('rejected')}
                                className={currentFilter === 'rejected' ? 'bg-indigo-600 text-white' : ''}
                            >
                                Rejected ({stats.total_rejected})
                            </Button>
                            <Button
                                size="sm"
                                variant={currentFilter === 'all' ? 'default' : 'ghost'}
                                onClick={() => setFilter('all')}
                                className={currentFilter === 'all' ? 'bg-indigo-600 text-white' : ''}
                            >
                                All
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {appointments.data.length === 0 ? (
                            <div className="py-12 text-center text-gray-500">
                                <AlertCircle className="mx-auto h-12 w-12 text-gray-300" />
                                <p className="mt-2 text-sm">No bookings found for the selected filter.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="border-b bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                                        <tr>
                                            <th className="px-4 py-3">Pupil</th>
                                            <th className="px-4 py-3">Teacher</th>
                                            <th className="px-4 py-3">Schedule Time</th>
                                            <th className="px-4 py-3">Status</th>
                                            <th className="px-4 py-3 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {appointments.data.map((appt) => (
                                            <tr key={appt.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50">
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-9 w-9">
                                                            <AvatarImage src={appt.pupil?.avatar} />
                                                            <AvatarFallback>{appt.pupil?.full_name?.substring(0, 2) || 'P'}</AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                                <Link
                                                                    href={`/profile/${appt.pupil_id}`}
                                                                    className="font-medium text-indigo-600 hover:underline"
                                                                >
                                                                    {appt.pupil?.full_name}
                                                                </Link>
                                                                <span className="inline-flex items-center rounded bg-indigo-50 dark:bg-indigo-950 px-1.5 py-0.5 text-[10px] font-mono font-bold text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                                                                    ID: {appt.pupil_id ? appt.pupil_id.substring(0, 8) : 'N/A'}
                                                                </span>
                                                            </div>
                                                            <p className="text-xs text-gray-500">{appt.pupil?.email}</p>
                                                            <p className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400 font-semibold select-all">
                                                                Full ID: {appt.pupil_id}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-9 w-9">
                                                            <AvatarImage src={appt.teacher?.avatar} />
                                                            <AvatarFallback>{appt.teacher?.full_name?.substring(0, 2) || 'T'}</AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                                <Link
                                                                    href={`/profile/${appt.teacher_id}`}
                                                                    className="font-medium text-indigo-600 hover:underline"
                                                                >
                                                                    {appt.teacher?.full_name}
                                                                </Link>
                                                                <span className="inline-flex items-center rounded bg-blue-50 dark:bg-blue-950 px-1.5 py-0.5 text-[10px] font-mono font-bold text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                                                    ID: {appt.teacher_id ? appt.teacher_id.substring(0, 8) : 'N/A'}
                                                                </span>
                                                            </div>
                                                            <p className="text-xs text-gray-500">{appt.teacher?.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300">
                                                        <Calendar className="h-3.5 w-3.5 text-gray-400" />
                                                        {new Date(appt.start_at).toLocaleString([], {
                                                            month: 'short',
                                                            day: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                        })}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4">
                                                    {appt.status === 'accepted' && (
                                                        <Badge className="bg-amber-500 text-white flex w-fit items-center gap-1">
                                                            <Clock className="h-3 w-3" />
                                                            Accepted (Verifying...)
                                                        </Badge>
                                                    )}
                                                    {appt.status === 'confirmed' && (
                                                        <Badge className="bg-emerald-600 text-white flex w-fit items-center gap-1">
                                                            <CheckCircle2 className="h-3 w-3" />
                                                            Confirmed
                                                        </Badge>
                                                    )}
                                                    {appt.status === 'rejected' && (
                                                        <div className="space-y-1">
                                                            <Badge className="bg-red-600 text-white flex w-fit items-center gap-1">
                                                                <XCircle className="h-3 w-3" />
                                                                Rejected
                                                            </Badge>
                                                            {appt.payment_rejection_reason && (
                                                                <p className="text-xs text-red-500 max-w-xs">
                                                                    Reason: {appt.payment_rejection_reason}
                                                                </p>
                                                            )}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-4 py-4 text-right">
                                                    {appt.status === 'accepted' && (
                                                        <div className="flex items-center justify-end gap-2">
                                                            <Button
                                                                size="sm"
                                                                onClick={() => handleConfirm(appt.id)}
                                                                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                                            >
                                                                <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                                                                Confirm Payment
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="destructive"
                                                                onClick={() => setSelectedRejectId(appt.id)}
                                                            >
                                                                <XCircle className="mr-1 h-3.5 w-3.5" />
                                                                Reject
                                                            </Button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Reject Reason Modal */}
                <Dialog open={Boolean(selectedRejectId)} onOpenChange={() => setSelectedRejectId(null)}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-red-600 flex items-center gap-2">
                                <XCircle className="h-5 w-5" /> Reject Payment
                            </DialogTitle>
                            <DialogDescription>
                                Please enter the reason for rejecting this payment. This reason will be displayed to both teacher and pupil.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleRejectSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Rejection Reason <span className="text-red-500">*</span>
                                </label>
                                <Textarea
                                    rows={4}
                                    placeholder="e.g., Payment screenshot unreadable or missing..."
                                    value={data.reason}
                                    onChange={(e) => setData('reason', e.target.value)}
                                    className="mt-1"
                                    required
                                />
                                {errors.reason && (
                                    <p className="mt-1 text-xs text-red-500">{errors.reason}</p>
                                )}
                            </div>

                            <DialogFooter className="gap-2 sm:gap-0">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setSelectedRejectId(null)}
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
        </AppLayout>
    );
}

import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    ShieldAlert,
    CheckCircle2,
    XCircle,
    Clock,
    Copy,
    ExternalLink,
    Send,
    AlertTriangle,
} from 'lucide-react';
import AdminPagination, { PaginationLink } from '@/components/AdminPagination';
import { toast } from 'sonner';

interface Pupil {
    id: string;
    full_name: string;
    email: string;
    avatar?: string;
}

interface Teacher {
    id: string;
    full_name: string;
    email: string;
    avatar?: string;
    teacher_profile?: {
        id: string;
        phone_number?: string;
    };
}

interface Voucher {
    id: string;
    voucher_code: string;
    is_redeemed: boolean;
    discount_percent: number;
}

interface Report {
    id: string;
    reported_contact: string;
    description: string;
    status: 'pending' | 'verified' | 'rejected';
    admin_notes?: string;
    created_at: string;
    pupil: Pupil;
    teacher: Teacher;
    reviewer?: { id: string; full_name: string };
    rewarded_voucher?: Voucher;
    appointment?: {
        id: string;
        start_at: string;
        end_at: string;
        duration_minutes: number;
    };
}

interface Props {
    reports: {
        data: Report[];
        links: PaginationLink[];
        from?: number | null;
        to?: number | null;
        total: number;
        current_page?: number;
        last_page?: number;
    };
    filters: {
        status: string;
    };
    stats: {
        pending: number;
        verified: number;
        rejected: number;
        all: number;
    };
}

export default function AdminReports({ reports, filters, stats }: Props) {
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [actionNote, setActionNote] = useState<string>('');
    const [activeModal, setActiveModal] = useState<{
        report: Report;
        type: 'verify' | 'reject';
    } | null>(null);

    const handleFilterChange = (newStatus: string) => {
        router.get(
            '/admin/off-platform-reports',
            { status: newStatus },
            { preserveState: true, replace: true },
        );
    };

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success('Copied to clipboard');
    };

    const handleConfirmAction = () => {
        if (!activeModal) return;

        const { report, type } = activeModal;
        setProcessingId(report.id);

        const endpoint =
            type === 'verify'
                ? `/admin/off-platform-reports/${report.id}/verify`
                : `/admin/off-platform-reports/${report.id}/reject`;

        router.post(
            endpoint,
            { admin_notes: actionNote },
            {
                onSuccess: () => {
                    toast.success(
                        type === 'verify'
                            ? 'Report verified! 100% Free Lesson Voucher awarded to pupil.'
                            : 'Report rejected.',
                    );
                    setActiveModal(null);
                    setActionNote('');
                },
                onError: (errors: any) => {
                    toast.error(errors.message || 'Operation failed');
                },
                onFinish: () => {
                    setProcessingId(null);
                },
            },
        );
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Dashboard', href: '/admin/dashboard' },
                { title: 'Violation Reports', href: '/admin/off-platform-reports' },
            ]}
        >
            <Head title="Violation Reports & Anti-Poaching" />

            <div className="mx-auto max-w-7xl space-y-8 p-4 md:p-8">
                {/* Header Banner */}
                <div className="relative overflow-hidden rounded-3xl bg-brand-navy p-8 text-white shadow-xl shadow-brand-navy/10">
                    <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center gap-4">
                            <div className="rounded-2xl bg-white/10 p-3.5 backdrop-blur-md">
                                <ShieldAlert className="h-8 w-8 text-brand-yellow" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black md:text-3xl text-white">
                                    Off-Platform Solicitation Reports
                                </h1>
                                <p className="mt-1 text-sm text-brand-pale-blue/90">
                                    Investigate students reporting teachers attempting to bypass ConvoMate. Verifying a report automatically grants the student a single-use 100% Free Lesson Voucher.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 rounded-2xl bg-white/10 p-2 backdrop-blur-md">
                            <div className="px-4 py-2 text-center">
                                <span className="block text-2xl font-black text-brand-yellow">
                                    {stats.pending}
                                </span>
                                <span className="text-[11px] font-bold text-brand-pale-blue uppercase">
                                    Pending Review
                                </span>
                            </div>
                            <div className="h-8 w-px bg-white/20" />
                            <div className="px-4 py-2 text-center">
                                <span className="block text-2xl font-black text-emerald-300">
                                    {stats.verified}
                                </span>
                                <span className="text-[11px] font-bold text-brand-pale-blue uppercase">
                                    Verified
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex flex-wrap gap-2 border-b border-border pb-4">
                    {[
                        { key: 'all', label: 'All Reports', count: stats.all },
                        { key: 'pending', label: 'Pending', count: stats.pending },
                        { key: 'verified', label: 'Verified & Rewarded', count: stats.verified },
                        { key: 'rejected', label: 'Rejected', count: stats.rejected },
                    ].map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => handleFilterChange(tab.key)}
                            className={`cursor-pointer flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                                (filters.status || 'all') === tab.key
                                    ? 'bg-brand-navy text-white shadow-md shadow-brand-navy/20 dark:bg-brand-yellow dark:text-brand-navy'
                                    : 'border border-border bg-card text-muted-foreground hover:bg-muted'
                            }`}
                        >
                            <span>{tab.label}</span>
                            <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
                                    (filters.status || 'all') === tab.key
                                        ? 'bg-white/20 text-white'
                                        : 'bg-muted text-foreground'
                                }`}
                            >
                                {tab.count}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Reports List */}
                <div className="space-y-4">
                    {reports.data.length === 0 ? (
                        <Card className="rounded-3xl border border-dashed p-12 text-center">
                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                                <CheckCircle2 className="h-7 w-7 text-emerald-500" />
                            </div>
                            <h3 className="mt-4 text-base font-bold">No reports found</h3>
                            <p className="mt-1 text-xs text-muted-foreground">
                                There are no violation reports matching this filter.
                            </p>
                        </Card>
                    ) : (
                        reports.data.map((report) => (
                            <Card
                                key={report.id}
                                className="overflow-hidden rounded-3xl border border-border shadow-xs transition-all hover:shadow-md"
                            >
                                <div className="border-b border-border bg-muted/20 p-5">
                                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                        <div className="flex items-center gap-3">
                                            {report.status === 'pending' && (
                                                <Badge className="bg-amber-500/10 text-amber-700 border-amber-500/30 dark:text-amber-400">
                                                    <Clock className="mr-1 h-3 w-3" /> Pending Review
                                                </Badge>
                                            )}
                                            {report.status === 'verified' && (
                                                <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:text-emerald-400">
                                                    <CheckCircle2 className="mr-1 h-3 w-3" /> Verified & Rewarded
                                                </Badge>
                                            )}
                                            {report.status === 'rejected' && (
                                                <Badge className="bg-slate-500/10 text-slate-700 border-slate-500/30 dark:text-slate-400">
                                                    <XCircle className="mr-1 h-3 w-3" /> Rejected
                                                </Badge>
                                            )}
                                            <span className="text-xs text-muted-foreground">
                                                Reported on{' '}
                                                {new Date(report.created_at).toLocaleDateString()}
                                            </span>
                                        </div>

                                        {report.rewarded_voucher && (
                                            <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                                                <span>Bounty Voucher:</span>
                                                <code className="rounded bg-emerald-500/20 px-1.5 py-0.5 font-mono text-[11px]">
                                                    {report.rewarded_voucher.voucher_code}
                                                </code>
                                                <span>
                                                    {report.rewarded_voucher.is_redeemed
                                                        ? '(Used)'
                                                        : '(Active)'}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <CardContent className="space-y-6 p-6">
                                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                        {/* Pupil & Teacher Profiles */}
                                        <div className="space-y-4 rounded-2xl border border-border bg-card p-4">
                                            <div>
                                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                                    Reporting Student
                                                </span>
                                                <div className="mt-2 flex items-center gap-3">
                                                    <Avatar className="h-10 w-10">
                                                        <AvatarImage src={report.pupil.avatar} />
                                                        <AvatarFallback>
                                                            {report.pupil.full_name?.charAt(0) || 'P'}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <div className="font-bold text-sm">
                                                            {report.pupil.full_name}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {report.pupil.email}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="border-t border-border pt-3">
                                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                                    Reported Teacher
                                                </span>
                                                <div className="mt-2 flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-10 w-10">
                                                            <AvatarImage src={report.teacher.avatar} />
                                                            <AvatarFallback>
                                                                {report.teacher.full_name?.charAt(0) || 'T'}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <div className="font-bold text-sm">
                                                                {report.teacher.full_name}
                                                            </div>
                                                            <div className="text-xs text-muted-foreground">
                                                                {report.teacher.email}
                                                                {report.teacher.teacher_profile?.phone_number &&
                                                                    ` • ${report.teacher.teacher_profile.phone_number}`}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <a
                                                        href={`/admin/teachers/${report.teacher.id}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="cursor-pointer inline-flex items-center gap-1 text-xs font-bold text-brand-blue hover:text-brand-navy hover:underline"
                                                    >
                                                        View Profile <ExternalLink className="h-3 w-3" />
                                                    </a>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Solicitated Contact & Description */}
                                        <div className="space-y-4 rounded-2xl border border-border bg-card p-4">
                                            <div>
                                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                                    Offered External Contact / Handle
                                                </span>
                                                <div className="mt-1.5 flex items-center gap-2">
                                                    <span className="rounded-xl border border-brand-pale-blue bg-brand-pale-blue/30 px-3 py-1.5 font-mono text-sm font-bold text-brand-navy dark:border-white/10 dark:bg-white/5 dark:text-brand-pale-blue">
                                                        {report.reported_contact}
                                                    </span>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleCopy(report.reported_contact)}
                                                        className="h-8 w-8 p-0"
                                                    >
                                                        <Copy className="h-3.5 w-3.5" />
                                                    </Button>
                                                    {report.reported_contact.startsWith('@') && (
                                                        <a
                                                            href={`https://t.me/${report.reported_contact.replace('@', '')}`}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="inline-flex h-8 items-center gap-1 rounded-lg bg-sky-500/10 px-2.5 text-xs font-bold text-sky-600 hover:bg-sky-500/20"
                                                        >
                                                            <Send className="h-3 w-3" /> Test in Telegram
                                                        </a>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="border-t border-border pt-3">
                                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                                    Student Statement & Description
                                                </span>
                                                <p className="mt-1.5 text-sm text-foreground bg-muted/30 rounded-xl p-3">
                                                    "{report.description}"
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {report.admin_notes && (
                                        <div className="rounded-xl border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
                                            <span className="font-bold text-foreground">Admin Notes: </span>
                                            {report.admin_notes}
                                            {report.reviewer && ` (Reviewed by ${report.reviewer.full_name})`}
                                        </div>
                                    )}

                                    {report.status === 'pending' && (
                                        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-border pt-4">
                                            <Button
                                                variant="outline"
                                                onClick={() => {
                                                    setActiveModal({ report, type: 'reject' });
                                                    setActionNote('');
                                                }}
                                                disabled={processingId === report.id}
                                                className="cursor-pointer text-xs font-bold hover:text-destructive hover:border-destructive/30"
                                            >
                                                <XCircle className="mr-1.5 h-4 w-4 text-muted-foreground" />
                                                Reject Report
                                            </Button>

                                            <Button
                                                onClick={() => {
                                                    setActiveModal({ report, type: 'verify' });
                                                    setActionNote('Verified off-platform solicitation via test inquiry.');
                                                }}
                                                disabled={processingId === report.id}
                                                className="cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                                            >
                                                <CheckCircle2 className="mr-1.5 h-4 w-4" />
                                                Verify & Award 100% Free Lesson Voucher
                                            </Button>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>

                {/* Pagination */}
                {reports.links && reports.links.length > 3 && (
                    <div className="mt-6">
                        <AdminPagination links={reports.links} />
                    </div>
                )}
            </div>

            {/* Action Confirmation Modal */}
            {activeModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
                    <div className="w-full max-w-md space-y-4 rounded-3xl border border-border bg-card p-6 shadow-2xl">
                        <div className="flex items-center gap-3">
                            <div
                                className={`rounded-xl p-2.5 ${
                                    activeModal.type === 'verify'
                                        ? 'bg-emerald-500/10 text-emerald-600'
                                        : 'bg-destructive/10 text-destructive'
                                }`}
                            >
                                {activeModal.type === 'verify' ? (
                                    <CheckCircle2 className="h-6 w-6" />
                                ) : (
                                    <AlertTriangle className="h-6 w-6" />
                                )}
                            </div>
                            <div>
                                <h3 className="text-lg font-bold">
                                    {activeModal.type === 'verify'
                                        ? 'Verify Violation & Reward Student'
                                        : 'Reject Report'}
                                </h3>
                                <p className="text-xs text-muted-foreground">
                                    {activeModal.type === 'verify'
                                        ? `A single-use 100% Free Lesson Voucher will be credited to ${activeModal.report.pupil.full_name}.`
                                        : 'No reward will be issued. The report will be closed.'}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-muted-foreground">
                                Admin Review Notes (Optional)
                            </label>
                            <textarea
                                value={actionNote}
                                onChange={(e) => setActionNote(e.target.value)}
                                placeholder="Explain resolution or notes for audit trail..."
                                className="min-h-[80px] w-full rounded-xl border border-border bg-background p-2.5 text-xs focus:ring-2 focus:ring-brand-navy focus:outline-none"
                            />
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2">
                            <Button
                                variant="outline"
                                onClick={() => setActiveModal(null)}
                                className="cursor-pointer text-xs font-bold"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleConfirmAction}
                                disabled={processingId === activeModal.report.id}
                                className={`cursor-pointer text-xs font-bold text-white ${
                                    activeModal.type === 'verify'
                                        ? 'bg-emerald-600 hover:bg-emerald-700'
                                        : 'bg-destructive hover:bg-destructive/90'
                                }`}
                            >
                                {activeModal.type === 'verify'
                                    ? 'Confirm & Award Voucher'
                                    : 'Confirm Rejection'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}

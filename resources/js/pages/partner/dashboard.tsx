import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    ArrowRight,
    Building2,
    CheckCircle2,
    Copy,
    Crown,
    Download,
    Ticket,
    Users,
    Wallet,
} from 'lucide-react';
import { toast } from 'sonner';
import {
    codes as codesRoute,
    exportLedgerCsv,
    exportStudentsCsv,
    payouts as payoutsRoute,
    students as studentsRoute,
} from '@/actions/App/Http/Controllers/PartnerPortalController';

interface CommissionEntryItem {
    id: string;
    entry_source: 'direct_lesson' | 'package_lesson' | 'b2c_partner_pass';
    meeting_started: boolean;
    gross_lesson_value: number;
    net_cash_basis: number;
    partner_amount: number;
    status: 'accrued' | 'included_in_payout' | 'paid' | 'voided';
    accrued_at: string;
    pupil?: { id: string; full_name: string; email: string } | null;
    teacher?: { id: string; full_name: string } | null;
}

interface StaffMemberItem {
    id: string;
    staff_role: 'director' | 'manager' | 'accountant';
    is_active: boolean;
    user?: {
        id: string;
        full_name: string;
        email: string;
        phone_number?: string | null;
    } | null;
}

interface Props {
    organization: {
        id: string;
        name: string;
        legal_name: string;
        legal_type: string;
        inn_stir?: string | null;
        partner_code: string;
        referral_url: string;
        commission_rate_bps: number;
        commission_rate_percent: number;
        contract_number?: string | null;
        contract_signed_at?: string | null;
        status: string;
    };
    metrics: {
        attributed_students_count: number;
        active_pass_holders_count: number;
        completed_lessons_count: number;
        total_net_cash_gmv_uzs: number;
        accrued_balance_uzs: number;
        in_payout_balance_uzs: number;
        paid_total_uzs: number;
        total_earned_uzs: number;
        voided_entries_count: number;
        minimum_payout_uzs: number;
        payout_progress_percent: number;
        remaining_to_threshold_uzs: number;
        attributed_daily_p2p_minutes: number;
    };
    vouchers_summary: {
        total: number;
        available: number;
        redeemed: number;
        expired: number;
    };
    passes_summary: {
        total_b2b: number;
        unclaimed: number;
        active_b2b: number;
        expired_b2b: number;
    };
    recent_entries: CommissionEntryItem[];
    staff_members: StaffMemberItem[];
    staffRole?: string | null;
}

const formatUzs = (amount: number | null | undefined): string =>
    `${new Intl.NumberFormat('en-US').format(amount ?? 0)} UZS`;

const sourceLabel = (source: CommissionEntryItem['entry_source']): string => {
    if (source === 'package_lesson') return 'Package Lesson';
    if (source === 'b2c_partner_pass') return 'Retail Partner Pass';
    return '1-on-1 Lesson';
};

const statusLabel = (status: CommissionEntryItem['status']): string => {
    if (status === 'accrued') return 'Pending Payout';
    if (status === 'included_in_payout') return 'In Monthly Batch';
    if (status === 'paid') return 'Paid';
    return 'Voided';
};

export default function PartnerDashboard({
    organization,
    metrics,
    vouchers_summary,
    passes_summary,
    recent_entries,
    staff_members,
    staffRole,
}: Props) {
    const copyText = (value: string, label: string) => {
        navigator.clipboard?.writeText(value);
        toast.success(`${label} copied to clipboard`);
    };

    return (
        <AppLayout>
            <Head title={`${organization.name} — Partner Portal`} />

            <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
                {/* Header */}
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <div className="flex flex-wrap items-center gap-2">
                            <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
                                <Building2 className="h-6 w-6 text-primary" />
                                {organization.name}
                            </h1>
                            <Badge variant="default">Active Partner</Badge>
                            {staffRole && (
                                <Badge variant="outline" className="capitalize">
                                    {staffRole} View
                                </Badge>
                            )}
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {organization.legal_name} ({organization.legal_type.toUpperCase()})
                            {organization.inn_stir ? ` · INN ${organization.inn_stir}` : ''}
                            {organization.contract_number ? ` · Contract #${organization.contract_number}` : ''} · Partner Share:{' '}
                            <span className="font-medium text-foreground">{organization.commission_rate_percent}% of Net Cash</span>
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <Button variant="outline" asChild className="gap-1.5">
                            <a href={exportStudentsCsv.url()}>
                                <Download className="h-4 w-4" />
                                Export Students CSV
                            </a>
                        </Button>
                        <Button variant="default" asChild className="gap-1.5">
                            <a href={exportLedgerCsv.url()}>
                                <Download className="h-4 w-4" />
                                Export Ledger CSV
                            </a>
                        </Button>
                    </div>
                </div>

                {/* Referral Link & Attribution Tools */}
                <Card className="border-primary/20 bg-primary/5">
                    <CardContent className="flex flex-col justify-between gap-4 p-4 sm:flex-row sm:items-center">
                        <div className="space-y-1">
                            <div className="text-sm font-semibold">
                                Center Referral Code: <span className="font-mono text-primary">{organization.partner_code}</span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                                Students who sign up via your link or enter this code within 24 hours unlock{' '}
                                <span className="font-medium text-foreground">{metrics.attributed_daily_p2p_minutes} min/day</span>{' '}
                                P2P speaking (2x standard) and attribute lifetime commissions to your center.
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => copyText(organization.partner_code, 'Partner code')}
                                className="gap-1.5"
                            >
                                <Copy className="h-3.5 w-3.5" />
                                Copy Code
                            </Button>
                            <Button
                                size="sm"
                                variant="default"
                                onClick={() => copyText(organization.referral_url, 'Referral link')}
                                className="gap-1.5"
                            >
                                <Copy className="h-3.5 w-3.5" />
                                Copy Referral Link
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Primary KPI Cards */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription className="flex items-center justify-between">
                                <span>Attributed Students</span>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardDescription>
                            <CardTitle className="text-2xl">{metrics.attributed_students_count}</CardTitle>
                        </CardHeader>
                        <CardContent className="text-xs text-muted-foreground">
                            {metrics.active_pass_holders_count} active Unlimited Partner Pass holders
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription className="flex items-center justify-between">
                                <span>Completed Lessons</span>
                                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                            </CardDescription>
                            <CardTitle className="text-2xl">{metrics.completed_lessons_count}</CardTitle>
                        </CardHeader>
                        <CardContent className="text-xs text-muted-foreground">
                            Net Cash GMV: {formatUzs(metrics.total_net_cash_gmv_uzs)}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription className="flex items-center justify-between">
                                <span>Unpaid Accrued Balance</span>
                                <Wallet className="h-4 w-4 text-muted-foreground" />
                            </CardDescription>
                            <CardTitle className="text-2xl">{formatUzs(metrics.accrued_balance_uzs)}</CardTitle>
                        </CardHeader>
                        <CardContent className="text-xs text-muted-foreground">
                            In monthly draft batch: {formatUzs(metrics.in_payout_balance_uzs)}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription className="flex items-center justify-between">
                                <span>Settled Corporate Payouts</span>
                                <Crown className="h-4 w-4 text-muted-foreground" />
                            </CardDescription>
                            <CardTitle className="text-2xl">{formatUzs(metrics.paid_total_uzs)}</CardTitle>
                        </CardHeader>
                        <CardContent className="text-xs text-muted-foreground">
                            Lifetime earned: {formatUzs(metrics.total_earned_uzs)}
                        </CardContent>
                    </Card>
                </div>

                {/* Monthly Payout Threshold Progress + Code Utilization */}
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle className="text-base">Monthly Payout Threshold Progress</CardTitle>
                            <CardDescription>
                                Monthly corporate bank transfers trigger once unpaid accrued commission reaches{' '}
                                <span className="font-medium text-foreground">{formatUzs(metrics.minimum_payout_uzs)}</span>. Balances
                                below the threshold roll over automatically.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center justify-between text-sm">
                                <span className="font-medium">
                                    {formatUzs(metrics.accrued_balance_uzs)} / {formatUzs(metrics.minimum_payout_uzs)}
                                </span>
                                <span className="font-semibold text-primary">{metrics.payout_progress_percent}%</span>
                            </div>
                            <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
                                <div
                                    className="h-full rounded-full bg-primary transition-all"
                                    style={{ width: `${metrics.payout_progress_percent}%` }}
                                />
                            </div>
                            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                                <span>
                                    {metrics.remaining_to_threshold_uzs === 0
                                        ? 'Threshold met — eligible for the next monthly payout batch.'
                                        : `${formatUzs(metrics.remaining_to_threshold_uzs)} remaining to qualify for next payout run.`}
                                </span>
                                <Link href={payoutsRoute.url()} className="inline-flex items-center gap-1 font-medium text-primary hover:underline">
                                    View full ledger & payouts <ArrowRight className="h-3.5 w-3.5" />
                                </Link>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Ticket className="h-4 w-4 text-primary" />
                                B2B Inventory Utilization
                            </CardTitle>
                            <CardDescription>Wholesale vouchers & Partner Pass seats</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <div className="flex items-center justify-between rounded-lg border p-2.5">
                                <div>
                                    <div className="font-medium">Lesson Vouchers</div>
                                    <div className="text-xs text-muted-foreground">
                                        {vouchers_summary.available} available · {vouchers_summary.redeemed} redeemed
                                    </div>
                                </div>
                                <Badge variant="secondary">{vouchers_summary.total}</Badge>
                            </div>
                            <div className="flex items-center justify-between rounded-lg border p-2.5">
                                <div>
                                    <div className="font-medium">Partner Pass Seats</div>
                                    <div className="text-xs text-muted-foreground">
                                        {passes_summary.unclaimed} unclaimed · {passes_summary.active_b2b} active
                                    </div>
                                </div>
                                <Badge variant="secondary">{passes_summary.total_b2b}</Badge>
                            </div>
                            <Link href={codesRoute.url()} className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                                Distribute & track codes <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                        </CardContent>
                    </Card>
                </div>

                {/* Recent Commission Entries + Portal Staff */}
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                    <Card className="lg:col-span-2">
                        <CardHeader className="flex flex-row items-center justify-between gap-2">
                            <div>
                                <CardTitle className="text-base">Recent Commission Activity</CardTitle>
                                <CardDescription>Latest completed lessons and retail Partner Pass accruals</CardDescription>
                            </div>
                            <Button variant="outline" size="sm" asChild>
                                <Link href={studentsRoute.url()}>View Students</Link>
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {recent_entries.length === 0 ? (
                                <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                                    No commission events recorded yet. Share your referral link to onboard students.
                                </p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead>
                                            <tr className="border-b text-xs text-muted-foreground">
                                                <th className="pb-2 font-medium">Student</th>
                                                <th className="pb-2 font-medium">Type</th>
                                                <th className="pb-2 font-medium">Net Cash</th>
                                                <th className="pb-2 font-medium">Partner Share</th>
                                                <th className="pb-2 font-medium">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {recent_entries.map((entry) => (
                                                <tr key={entry.id}>
                                                    <td className="py-2.5 pr-3">
                                                        <div className="font-medium">{entry.pupil?.full_name || 'Student'}</div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {entry.teacher?.full_name
                                                                ? `with ${entry.teacher.full_name}`
                                                                : new Date(entry.accrued_at).toLocaleDateString()}
                                                        </div>
                                                    </td>
                                                    <td className="py-2.5 pr-3 text-xs text-muted-foreground">
                                                        {sourceLabel(entry.entry_source)}
                                                    </td>
                                                    <td className="py-2.5 pr-3 text-xs">{formatUzs(entry.net_cash_basis)}</td>
                                                    <td className="py-2.5 pr-3 font-semibold text-emerald-600 dark:text-emerald-400">
                                                        {formatUzs(entry.partner_amount)}
                                                    </td>
                                                    <td className="py-2.5">
                                                        <Badge variant={entry.status === 'voided' ? 'destructive' : 'secondary'}>
                                                            {statusLabel(entry.status)}
                                                        </Badge>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Authorized Center Staff</CardTitle>
                            <CardDescription>Team logins linked to {organization.name}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2.5">
                            {staff_members.length === 0 ? (
                                <p className="text-sm text-muted-foreground">Managed via primary center director access.</p>
                            ) : (
                                staff_members.map((member) => (
                                    <div key={member.id} className="rounded-lg border p-2.5 text-sm">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="font-medium">{member.user?.full_name || 'Staff'}</span>
                                            <Badge variant={member.is_active ? 'outline' : 'secondary'} className="capitalize">
                                                {member.staff_role}
                                            </Badge>
                                        </div>
                                        <div className="text-xs text-muted-foreground">{member.user?.email}</div>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}


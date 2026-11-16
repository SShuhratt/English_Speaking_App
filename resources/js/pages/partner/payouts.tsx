import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AdminPagination, { PaginationLink } from '@/components/AdminPagination';
import { Download, Filter, Wallet } from 'lucide-react';
import {
    exportLedgerCsv,
    payouts as payoutsRoute,
} from '@/actions/App/Http/Controllers/PartnerPortalController';

interface CommissionEntryItem {
    id: string;
    entry_source: 'direct_lesson' | 'package_lesson' | 'b2c_partner_pass';
    meeting_started: boolean;
    gross_lesson_value: number;
    gateway_fee_amount: number;
    net_cash_basis: number;
    partner_rate_bps: number;
    partner_amount: number;
    status: 'accrued' | 'included_in_payout' | 'paid' | 'voided';
    accrued_at: string;
    void_reason?: string | null;
    pupil?: { id: string; full_name: string; email: string } | null;
    teacher?: { id: string; full_name: string } | null;
    payout?: { id: string; period_year: number; period_month: number; didox_document_id?: string | null } | null;
}

interface PayoutItem {
    id: string;
    period_year: number;
    period_month: number;
    total_lessons_count: number;
    total_net_cash_gmv: number;
    total_commission_amount: number;
    didox_document_id?: string | null;
    payment_reference?: string | null;
    status: 'draft' | 'invoiced' | 'paid' | 'cancelled';
    paid_at?: string | null;
}

interface Paginated<T> {
    data: T[];
    links: PaginationLink[];
    from: number | null;
    to: number | null;
    total: number;
    per_page: number;
}

interface Props {
    organization: {
        id: string;
        name: string;
        partner_code: string;
    };
    metrics: {
        accrued_balance_uzs: number;
        in_payout_balance_uzs: number;
        paid_total_uzs: number;
        minimum_payout_uzs: number;
    };
    commissionEntries: Paginated<CommissionEntryItem>;
    payouts: Paginated<PayoutItem>;
    filters: {
        status: string;
        from: string;
        to: string;
    };
}

const formatUzs = (amount: number | null | undefined): string =>
    `${new Intl.NumberFormat('en-US').format(amount ?? 0)} UZS`;

export default function PartnerPayouts({
    organization,
    metrics,
    commissionEntries,
    payouts,
    filters,
}: Props) {
    const [status, setStatus] = useState(filters.status || 'all');
    const [fromDate, setFromDate] = useState(filters.from || '');
    const [toDate, setToDate] = useState(filters.to || '');

    const buildQueryParams = () => {
        const params: Record<string, string> = {};
        if (status && status !== 'all') params.status = status;
        if (fromDate) params.from = fromDate;
        if (toDate) params.to = toDate;
        return params;
    };

    const handleFilter = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(payoutsRoute.url(), buildQueryParams(), { preserveState: true });
    };

    const queryString = new URLSearchParams(buildQueryParams()).toString();
    const csvHref = queryString ? `${exportLedgerCsv.url()}?${queryString}` : exportLedgerCsv.url();

    return (
        <AppLayout>
            <Head title={`Commissions & Payouts — ${organization.name}`} />

            <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
                            <Wallet className="h-6 w-6 text-primary" />
                            Commissions & Monthly Payouts
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Transparent Net Cash commission ledger and Didox corporate settlement history for {organization.name}.
                        </p>
                    </div>
                    <Button asChild className="gap-1.5">
                        <a href={csvHref}>
                            <Download className="h-4 w-4" />
                            Export Filtered Ledger CSV
                        </a>
                    </Button>
                </div>

                {/* Balance Summary */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>Accrued (Next Payout Cycle)</CardDescription>
                            <CardTitle className="text-xl">{formatUzs(metrics.accrued_balance_uzs)}</CardTitle>
                        </CardHeader>
                        <CardContent className="text-xs text-muted-foreground">
                            Minimum transfer threshold: {formatUzs(metrics.minimum_payout_uzs)}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>Pending Transfer (In Monthly Batch)</CardDescription>
                            <CardTitle className="text-xl">{formatUzs(metrics.in_payout_balance_uzs)}</CardTitle>
                        </CardHeader>
                        <CardContent className="text-xs text-muted-foreground">
                            Awaiting Didox Act & bank confirmation
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>Total Settled</CardDescription>
                            <CardTitle className="text-xl">{formatUzs(metrics.paid_total_uzs)}</CardTitle>
                        </CardHeader>
                        <CardContent className="text-xs text-muted-foreground">
                            Transferred to center corporate bank account
                        </CardContent>
                    </Card>
                </div>

                {/* Monthly Payout Batches */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Monthly Corporate Payouts ({payouts.total})</CardTitle>
                        <CardDescription>Monthly aggregated statements, Didox E-Faktura IDs, and payment references</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {payouts.data.length === 0 ? (
                            <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                                No monthly corporate payout batches generated yet.
                            </p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead>
                                        <tr className="border-b text-xs text-muted-foreground">
                                            <th className="pb-2 font-medium">Period</th>
                                            <th className="pb-2 font-medium">Events</th>
                                            <th className="pb-2 font-medium">Net Cash GMV</th>
                                            <th className="pb-2 font-medium">Payout Amount</th>
                                            <th className="pb-2 font-medium">Didox / Transfer Ref</th>
                                            <th className="pb-2 font-medium">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {payouts.data.map((payout) => (
                                            <tr key={payout.id}>
                                                <td className="py-3 pr-3 font-medium">
                                                    {payout.period_year}-{String(payout.period_month).padStart(2, '0')}
                                                </td>
                                                <td className="py-3 pr-3">{payout.total_lessons_count}</td>
                                                <td className="py-3 pr-3 text-xs">{formatUzs(payout.total_net_cash_gmv)}</td>
                                                <td className="py-3 pr-3 font-semibold">{formatUzs(payout.total_commission_amount)}</td>
                                                <td className="py-3 pr-3 text-xs text-muted-foreground">
                                                    {payout.didox_document_id || 'Pending Didox'}
                                                    {payout.payment_reference ? ` · ${payout.payment_reference}` : ''}
                                                </td>
                                                <td className="py-3">
                                                    <Badge variant={payout.status === 'paid' ? 'default' : 'secondary'}>
                                                        {payout.status}
                                                    </Badge>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        <AdminPagination
                            links={payouts.links}
                            from={payouts.from}
                            to={payouts.to}
                            total={payouts.total}
                            perPage={payouts.per_page}
                            itemLabel="payouts"
                        />
                    </CardContent>
                </Card>

                {/* Detailed Commission Ledger */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Detailed Commission Ledger ({commissionEntries.total})</CardTitle>
                        <CardDescription>Filter by commission status and accrual date range</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <form onSubmit={handleFilter} className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                            <div>
                                <Label>Status</Label>
                                <select
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                                >
                                    <option value="all">All Statuses</option>
                                    <option value="accrued">Pending Payout</option>
                                    <option value="included_in_payout">In Monthly Batch</option>
                                    <option value="paid">Paid</option>
                                    <option value="voided">Voided</option>
                                </select>
                            </div>
                            <div>
                                <Label>From Date</Label>
                                <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
                            </div>
                            <div>
                                <Label>To Date</Label>
                                <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
                            </div>
                            <div className="flex items-end">
                                <Button type="submit" variant="outline" className="w-full gap-1.5">
                                    <Filter className="h-4 w-4" />
                                    Apply Filters
                                </Button>
                            </div>
                        </form>

                        {commissionEntries.data.length === 0 ? (
                            <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                                No commission entries match your selected filters.
                            </p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead>
                                        <tr className="border-b text-xs text-muted-foreground">
                                            <th className="pb-2 font-medium">Date</th>
                                            <th className="pb-2 font-medium">Student & Teacher</th>
                                            <th className="pb-2 font-medium">Gross / Fee</th>
                                            <th className="pb-2 font-medium">Net Cash Basis</th>
                                            <th className="pb-2 font-medium">Partner Share</th>
                                            <th className="pb-2 font-medium">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {commissionEntries.data.map((entry) => (
                                            <tr key={entry.id}>
                                                <td className="py-2.5 pr-3 text-xs text-muted-foreground">
                                                    {new Date(entry.accrued_at).toLocaleDateString()}
                                                </td>
                                                <td className="py-2.5 pr-3">
                                                    <div className="font-medium">{entry.pupil?.full_name || 'Student'}</div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {entry.teacher?.full_name ? `with ${entry.teacher.full_name}` : entry.entry_source}
                                                    </div>
                                                </td>
                                                <td className="py-2.5 pr-3 text-xs text-muted-foreground">
                                                    {formatUzs(entry.gross_lesson_value)} (-{formatUzs(entry.gateway_fee_amount)})
                                                </td>
                                                <td className="py-2.5 pr-3 text-xs">{formatUzs(entry.net_cash_basis)}</td>
                                                <td className="py-2.5 pr-3 font-semibold text-emerald-600 dark:text-emerald-400">
                                                    {formatUzs(entry.partner_amount)}
                                                </td>
                                                <td className="py-2.5">
                                                    <Badge variant={entry.status === 'voided' ? 'destructive' : 'secondary'}>
                                                        {entry.status}
                                                    </Badge>
                                                    {entry.void_reason && (
                                                        <div className="mt-0.5 text-[11px] text-destructive">{entry.void_reason}</div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        <AdminPagination
                            links={commissionEntries.links}
                            from={commissionEntries.from}
                            to={commissionEntries.to}
                            total={commissionEntries.total}
                            perPage={commissionEntries.per_page}
                            itemLabel="entries"
                        />
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}


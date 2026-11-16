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
import {
    Building2,
    CheckCircle2,
    Copy,
    Crown,
    Download,
    Plus,
    RefreshCw,
    Ticket,
    Trash2,
    Users,
    Wallet,
    XCircle,
    AlertTriangle,
} from 'lucide-react';
import AdminPagination, { PaginationLink } from '@/components/AdminPagination';
import {
    activatePassBatch,
    activateVoucherBatch,
    confirmRetailPass,
    destroyStaff,
    exportPayoutCsv,
    generatePayouts,
    index as partnersIndex,
    markPayoutPaid,
    rejectRetailPass,
    storePartner,
    storePassBatch,
    storeStaff,
    storeVoucherBatch,
    syncCompletedAppointments,
    toggleStaffStatus,
    updateMonetizationSettings,
    updatePartner,
    voidUnstartedAppointment,
} from '@/actions/App/Http/Controllers/AdminPartnerController';
import { toast } from 'sonner';

interface PartnerOrg {
    id: string;
    name: string;
    legal_name: string;
    legal_type: 'mchj' | 'yatt';
    inn_stir?: string | null;
    bank_account?: string | null;
    bank_mfo?: string | null;
    bank_name?: string | null;
    contact_phone?: string | null;
    contact_email?: string | null;
    partner_code: string;
    commission_rate_bps: number;
    contract_number?: string | null;
    status: 'active' | 'paused' | 'terminated';
    attributions_count: number;
    voucher_batches_count: number;
    staff_memberships_count?: number;
    staff_memberships?: StaffMembership[];
    accrued_balance_uzs?: number | null;
    paid_total_uzs?: number | null;
}

interface StaffMembership {
    id: string;
    staff_role: 'director' | 'manager' | 'accountant';
    is_active: boolean;
    user?: {
        id: string;
        full_name: string;
        email: string;
        phone_number?: string | null;
    };
}

interface PartnerVoucherItem {
    id: string;
    code: string;
    status: 'available' | 'redeemed' | 'expired' | 'voided';
}

interface VoucherBatch {
    id: string;
    title: string;
    bundle_type: 'mock_speaking' | 'lesson_1on1';
    lesson_duration_minutes: number;
    max_lesson_price_uzs: number;
    unit_face_value_uzs: number;
    wholesale_discount_percent: number;
    unit_wholesale_price_uzs: number;
    quantity: number;
    total_paid_upfront_uzs: number;
    payment_status: 'pending' | 'paid' | 'cancelled';
    valid_until: string;
    available_count: number;
    redeemed_count: number;
    expired_count: number;
    partner_organization?: { id: string; name: string; partner_code: string };
    vouchers: PartnerVoucherItem[];
}

interface CommissionEntry {
    id: string;
    entry_source: 'direct_lesson' | 'package_lesson' | 'b2c_partner_pass';
    meeting_started: boolean;
    gross_lesson_value: number;
    gateway_fee_bps: number;
    gateway_fee_amount: number;
    net_cash_basis: number;
    teacher_amount: number;
    platform_amount: number;
    partner_amount: number;
    status: 'accrued' | 'included_in_payout' | 'paid' | 'voided';
    accrued_at: string;
    partner_organization?: { id: string; name: string; partner_code: string };
    pupil?: { id: string; full_name: string; email: string };
    teacher?: { id: string; full_name: string };
    appointment?: {
        id: string;
        start_at: string;
        end_at: string;
        duration_minutes: number;
        meeting_started: boolean;
        status: string;
        completion_voided_at?: string | null;
    };
}

interface UnstartedAppointment {
    id: string;
    start_at: string;
    end_at: string;
    duration_minutes: number;
    price: number;
    is_package_booking: boolean;
    pupil?: { id: string; full_name: string; email: string };
    teacher?: { id: string; full_name: string; email: string };
    partner_commission_entry?: {
        id: string;
        partner_amount: number;
        status: string;
    } | null;
}

interface PartnerPayoutItem {
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
    partner_organization?: {
        id: string;
        name: string;
        legal_name: string;
        inn_stir?: string | null;
        bank_account?: string | null;
        bank_mfo?: string | null;
    };
}

interface Paginated<T> {
    data: T[];
    links: PaginationLink[];
    from?: number | null;
    to?: number | null;
    total: number;
    per_page?: number;
    current_page?: number;
    last_page?: number;
}

interface PartnerPassItem {
    id: string;
    activation_code?: string | null;
    status: string;
    source: string;
    gross_amount: number;
    net_cash_amount: number;
    duration_days: number;
    payment_status: string;
    receipt_path?: string | null;
    receipt_data?: { note?: string; submitted_at?: string } | null;
    created_at: string;
    user?: { id: string; full_name: string; email: string; phone_number?: string };
    partner_organization?: { id: string; name: string; partner_code: string };
}

interface PartnerPassBatchItem {
    id: string;
    title: string;
    duration_days: number;
    unit_retail_price_uzs: number;
    unit_wholesale_price_uzs: number;
    quantity: number;
    total_paid_upfront_uzs: number;
    payment_status: 'pending' | 'paid' | 'cancelled';
    unclaimed_count: number;
    active_count: number;
    expired_count: number;
    partner_organization?: { id: string; name: string; partner_code: string };
    passes: PartnerPassItem[];
}

interface PricingConfig {
    partner_pass_b2c_price_uzs: number;
    partner_pass_b2b_default_price_uzs: number;
    partner_pass_b2b_min_price_uzs: number;
    partner_pass_default_days: number;
    p2p_free_daily_minutes: number;
    p2p_attributed_daily_minutes: number;
}

interface Props {
    partners: PartnerOrg[];
    batches: VoucherBatch[];
    passBatches: PartnerPassBatchItem[];
    pendingRetailPasses: PartnerPassItem[];
    pricingConfig: PricingConfig;
    commissionEntries: Paginated<CommissionEntry>;
    unstartedReviewAppointments: UnstartedAppointment[];
    payouts: Paginated<PartnerPayoutItem>;
    summary: {
        active_partners: number;
        attributed_pupils: number;
        total_accrued_uzs: number;
        total_paid_uzs: number;
        unstarted_completed_count: number;
        track_b2_upfront_uzs: number;
        track_b1_upfront_uzs: number;
        active_partner_passes: number;
        pending_retail_passes_count: number;
        minimum_payout_uzs: number;
        gateway_fee_percent: number;
    };
    meetingFilter: 'all' | 'started' | 'unstarted';
}

const formatUzs = (amount: number | null | undefined): string =>
    `${new Intl.NumberFormat('en-US').format(amount ?? 0)} UZS`;

export default function AdminPartners({
    partners,
    batches,
    passBatches = [],
    pendingRetailPasses = [],
    pricingConfig,
    commissionEntries,
    unstartedReviewAppointments,
    payouts,
    summary,
    meetingFilter,
}: Props) {
    const [activeTab, setActiveTab] = useState<'partners' | 'ledger' | 'payouts' | 'vouchers' | 'passes'>('partners');
    const [showPartnerForm, setShowPartnerForm] = useState(false);
    const [batchTargetPartner, setBatchTargetPartner] = useState<PartnerOrg | null>(null);
    const [passTargetPartner, setPassTargetPartner] = useState<PartnerOrg | null>(null);
    const [voidTarget, setVoidTarget] = useState<UnstartedAppointment | null>(null);
    const [voidReason, setVoidReason] = useState('Teacher did not start the lesson on time');
    const [payoutModal, setPayoutModal] = useState<PartnerPayoutItem | null>(null);
    const [didoxId, setDidoxId] = useState('');
    const [paymentRef, setPaymentRef] = useState('');
    const [staffPartnerId, setStaffPartnerId] = useState<string | null>(null);
    const [staffForm, setStaffForm] = useState({
        full_name: '',
        email: '',
        phone_number: '',
        staff_role: 'manager' as 'director' | 'manager' | 'accountant',
        password: '',
    });

    const staffTargetPartner = staffPartnerId
        ? partners.find((p) => p.id === staffPartnerId) || null
        : null;

    const now = new Date();
    const [payoutYear, setPayoutYear] = useState(String(now.getFullYear()));
    const [payoutMonth, setPayoutMonth] = useState(String(now.getMonth() + 1));

    const [partnerForm, setPartnerForm] = useState({
        name: '',
        legal_name: '',
        legal_type: 'mchj',
        inn_stir: '',
        bank_account: '',
        bank_mfo: '',
        bank_name: '',
        contact_phone: '',
        contact_email: '',
        partner_code: '',
        contract_number: '',
    });

    const [batchForm, setBatchForm] = useState({
        title: 'Official Speaking Mock Pack',
        bundle_type: 'mock_speaking',
        lesson_duration_minutes: '30',
        max_lesson_price_uzs: '60000',
        unit_face_value_uzs: '60000',
        wholesale_discount_percent: '15',
        quantity: '50',
        validity_days: '60',
        mark_paid: true,
    });

    const [settingsForm, setSettingsForm] = useState({
        partner_pass_b2c_price_uzs: String(pricingConfig?.partner_pass_b2c_price_uzs ?? 30000),
        partner_pass_b2b_default_price_uzs: String(pricingConfig?.partner_pass_b2b_default_price_uzs ?? 25000),
        partner_pass_b2b_min_price_uzs: String(pricingConfig?.partner_pass_b2b_min_price_uzs ?? 20000),
        partner_pass_default_days: String(pricingConfig?.partner_pass_default_days ?? 30),
        p2p_free_daily_minutes: String(pricingConfig?.p2p_free_daily_minutes ?? 60),
        p2p_attributed_daily_minutes: String(pricingConfig?.p2p_attributed_daily_minutes ?? 120),
    });

    const [passBatchForm, setPassBatchForm] = useState({
        title: 'Monthly Partner Pass Cohort',
        duration_days: String(pricingConfig?.partner_pass_default_days ?? 30),
        unit_wholesale_price_uzs: String(pricingConfig?.partner_pass_b2b_default_price_uzs ?? 25000),
        quantity: '30',
        mark_paid: true,
    });

    const copyText = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast.success(`${label} copied`);
    };

    const handleCreatePartner = (e: React.FormEvent) => {
        e.preventDefault();
        router.post(storePartner.url(), partnerForm, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Partner learning center registered');
                setShowPartnerForm(false);
                setPartnerForm({
                    name: '',
                    legal_name: '',
                    legal_type: 'mchj',
                    inn_stir: '',
                    bank_account: '',
                    bank_mfo: '',
                    bank_name: '',
                    contact_phone: '',
                    contact_email: '',
                    partner_code: '',
                    contract_number: '',
                });
            },
            onError: (errors) => {
                toast.error(Object.values(errors)[0] || 'Could not register partner center');
            },
        });
    };

    const handleTogglePartnerStatus = (partner: PartnerOrg) => {
        const nextStatus = partner.status === 'active' ? 'paused' : 'active';
        router.put(
            updatePartner.url(partner.id),
            { status: nextStatus },
            {
                preserveScroll: true,
                onSuccess: () => toast.success(`Partner marked ${nextStatus}`),
            },
        );
    };

    const handleCreateBatch = (e: React.FormEvent) => {
        e.preventDefault();
        if (!batchTargetPartner) return;

        router.post(
            storeVoucherBatch.url(batchTargetPartner.id),
            {
                ...batchForm,
                lesson_duration_minutes: Number(batchForm.lesson_duration_minutes),
                max_lesson_price_uzs: Number(batchForm.max_lesson_price_uzs),
                unit_face_value_uzs: Number(batchForm.unit_face_value_uzs),
                wholesale_discount_percent: Number(batchForm.wholesale_discount_percent),
                quantity: Number(batchForm.quantity),
                validity_days: Number(batchForm.validity_days),
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Wholesale voucher batch created');
                    setBatchTargetPartner(null);
                },
                onError: (errors) => {
                    toast.error(Object.values(errors)[0] || 'Could not create voucher batch');
                },
            },
        );
    };

    const handleVoidSubmit = () => {
        if (!voidTarget) return;
        router.post(
            voidUnstartedAppointment.url(voidTarget.id),
            { reason: voidReason },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Session voided as teacher no-show');
                    setVoidTarget(null);
                },
                onError: (errors) => {
                    toast.error(Object.values(errors)[0] || 'Could not void session');
                },
            },
        );
    };

    const handleGeneratePayouts = () => {
        router.post(
            generatePayouts.url(),
            { year: Number(payoutYear), month: Number(payoutMonth) },
            {
                preserveScroll: true,
                onSuccess: () => toast.success('Monthly payout run completed'),
            },
        );
    };

    const handleCreateStaff = (e: React.FormEvent) => {
        e.preventDefault();
        if (!staffTargetPartner) return;
        router.post(
            storeStaff.url(staffTargetPartner.id),
            {
                ...staffForm,
                password: staffForm.password.trim() || null,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Partner staff login provisioned');
                    setStaffForm({
                        full_name: '',
                        email: '',
                        phone_number: '',
                        staff_role: 'manager',
                        password: '',
                    });
                },
                onError: (errors) => {
                    toast.error(Object.values(errors)[0] || 'Could not add partner staff account');
                },
            },
        );
    };

    const handleToggleStaff = (membershipId: string) => {
        router.patch(
            toggleStaffStatus.url(membershipId),
            {},
            {
                preserveScroll: true,
                onSuccess: () => toast.success('Staff login status updated'),
            },
        );
    };

    const handleRemoveStaff = (membershipId: string) => {
        router.delete(destroyStaff.url(membershipId), {
            preserveScroll: true,
            onSuccess: () => toast.success('Staff login removed'),
        });
    };

    const handleSaveSettings = (e: React.FormEvent) => {
        e.preventDefault();
        router.post(
            updateMonetizationSettings.url(),
            {
                partner_pass_b2c_price_uzs: Number(settingsForm.partner_pass_b2c_price_uzs),
                partner_pass_b2b_default_price_uzs: Number(settingsForm.partner_pass_b2b_default_price_uzs),
                partner_pass_b2b_min_price_uzs: Number(settingsForm.partner_pass_b2b_min_price_uzs),
                partner_pass_default_days: Number(settingsForm.partner_pass_default_days),
                p2p_free_daily_minutes: Number(settingsForm.p2p_free_daily_minutes),
                p2p_attributed_daily_minutes: Number(settingsForm.p2p_attributed_daily_minutes),
            },
            {
                preserveScroll: true,
                onSuccess: () => toast.success('Partner Pass pricing & P2P limits updated'),
                onError: (errors) => toast.error(Object.values(errors)[0] || 'Could not update settings'),
            },
        );
    };

    const handleCreatePassBatch = (e: React.FormEvent) => {
        e.preventDefault();
        if (!passTargetPartner) return;
        router.post(
            storePassBatch.url(passTargetPartner.id),
            {
                title: passBatchForm.title,
                duration_days: Number(passBatchForm.duration_days),
                unit_wholesale_price_uzs: Number(passBatchForm.unit_wholesale_price_uzs),
                quantity: Number(passBatchForm.quantity),
                payment_status: passBatchForm.mark_paid ? 'paid' : 'pending',
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Partner Pass batch created');
                    setPassTargetPartner(null);
                },
                onError: (errors) => toast.error(Object.values(errors)[0] || 'Could not create Partner Pass batch'),
            },
        );
    };

    const handleMarkPayoutPaid = (e: React.FormEvent) => {
        e.preventDefault();
        if (!payoutModal) return;

        router.post(
            markPayoutPaid.url(payoutModal.id),
            {
                didox_document_id: didoxId,
                payment_reference: paymentRef || null,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Corporate payout marked as paid');
                    setPayoutModal(null);
                    setDidoxId('');
                    setPaymentRef('');
                },
                onError: (errors) => toast.error(Object.values(errors)[0] || 'Failed to mark paid'),
            },
        );
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Overview', href: '/admin/overview' },
                { title: 'Partner Centers', href: partnersIndex.url() },
            ]}
        >
            <Head title="Partner Learning Centers & Commissions" />

            <div className="mx-auto max-w-7xl space-y-8 p-4 md:p-8">
                <div className="relative overflow-hidden rounded-3xl bg-brand-navy p-8 text-white shadow-xl shadow-brand-navy/10">
                    <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center gap-4">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
                                <Building2 className="h-7 w-7 text-amber-300" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                                    B2B2C Partner Centers & Ledger
                                </h1>
                                <p className="mt-1 text-sm text-white/80">
                                    80% Teacher / 15% ConvoMate / 5% Partner Center on Net Cash after {summary.gateway_fee_percent}% gateway fee. Min payout: {formatUzs(summary.minimum_payout_uzs)}.
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Button
                                variant="secondary"
                                onClick={() => router.post(syncCompletedAppointments.url(), {}, { preserveScroll: true, onSuccess: () => toast.success('Past sessions synced') })}
                                className="gap-2"
                            >
                                <RefreshCw className="h-4 w-4" />
                                Sync Completed Sessions
                            </Button>
                            <Button
                                onClick={() => {
                                    setActiveTab('partners');
                                    setShowPartnerForm((prev) => !prev);
                                }}
                                className="gap-2 bg-amber-400 text-slate-950 hover:bg-amber-300"
                            >
                                <Plus className="h-4 w-4" />
                                New Partner Center
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Summary KPI Grid */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>Active Centers</CardDescription>
                            <CardTitle className="text-2xl">{summary.active_partners}</CardTitle>
                        </CardHeader>
                        <CardContent className="text-xs text-muted-foreground">
                            {summary.attributed_pupils} attributed students
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>Unpaid Accrued Balance</CardDescription>
                            <CardTitle className="text-2xl">{formatUzs(summary.total_accrued_uzs)}</CardTitle>
                        </CardHeader>
                        <CardContent className="text-xs text-muted-foreground">
                            Monthly transfers &ge; {formatUzs(summary.minimum_payout_uzs)}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>Paid to Partners</CardDescription>
                            <CardTitle className="text-2xl">{formatUzs(summary.total_paid_uzs)}</CardTitle>
                        </CardHeader>
                        <CardContent className="text-xs text-muted-foreground">
                            Settled via corporate bank & Didox
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>Track B2 Upfront Cash</CardDescription>
                            <CardTitle className="text-2xl">{formatUzs(summary.track_b2_upfront_uzs)}</CardTitle>
                        </CardHeader>
                        <CardContent className="text-xs text-muted-foreground">
                            Prepaid wholesale bulk packs
                        </CardContent>
                    </Card>
                    <Card className={summary.unstarted_completed_count > 0 ? 'border-amber-400' : ''}>
                        <CardHeader className="pb-2">
                            <CardDescription>Unstarted Completed</CardDescription>
                            <CardTitle className="text-2xl">{summary.unstarted_completed_count}</CardTitle>
                        </CardHeader>
                        <CardContent className="text-xs text-muted-foreground">
                            Flagged for teacher no-show check
                        </CardContent>
                    </Card>
                </div>

                {/* Navigation Tabs */}
                <div className="flex flex-wrap gap-2 border-b pb-3">
                    {[
                        { key: 'partners', label: 'Partner Centers', icon: Building2 },
                        { key: 'ledger', label: 'Track A Ledger & Unstarted Check', icon: CheckCircle2 },
                        { key: 'payouts', label: 'Monthly Corporate Payouts', icon: Wallet },
                        { key: 'vouchers', label: 'Track B2 Bulk Vouchers', icon: Ticket },
                        { key: 'passes', label: `Track B1 Partner Pass (${summary.active_partner_passes ?? 0})`, icon: Crown },
                    ].map(({ key, label, icon: Icon }) => (
                        <Button
                            key={key}
                            variant={activeTab === key ? 'default' : 'outline'}
                            onClick={() => setActiveTab(key as typeof activeTab)}
                            className="gap-2"
                        >
                            <Icon className="h-4 w-4" />
                            {label}
                        </Button>
                    ))}
                </div>

                {/* TAB 1: Partner Organizations */}
                {activeTab === 'partners' && (
                    <div className="space-y-6">
                        {showPartnerForm && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Register Partner Learning Center</CardTitle>
                                    <CardDescription>
                                        Agency/Commission Agreement details for corporate payouts and referral attribution.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={handleCreatePartner} className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                        <div>
                                            <Label>Display Name *</Label>
                                            <Input
                                                required
                                                value={partnerForm.name}
                                                onChange={(e) => setPartnerForm({ ...partnerForm, name: e.target.value })}
                                                placeholder="Cambridge Learning Center"
                                            />
                                        </div>
                                        <div>
                                            <Label>Registered Legal Name *</Label>
                                            <Input
                                                required
                                                value={partnerForm.legal_name}
                                                onChange={(e) => setPartnerForm({ ...partnerForm, legal_name: e.target.value })}
                                                placeholder="Cambridge Education MChJ"
                                            />
                                        </div>
                                        <div>
                                            <Label>Legal Entity Type *</Label>
                                            <select
                                                value={partnerForm.legal_type}
                                                onChange={(e) => setPartnerForm({ ...partnerForm, legal_type: e.target.value })}
                                                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                                            >
                                                <option value="mchj">MChJ (LLC)</option>
                                                <option value="yatt">YaTT (Sole Proprietor)</option>
                                            </select>
                                        </div>
                                        <div>
                                            <Label>INN / STIR</Label>
                                            <Input
                                                value={partnerForm.inn_stir}
                                                onChange={(e) => setPartnerForm({ ...partnerForm, inn_stir: e.target.value })}
                                                placeholder="309123456"
                                            />
                                        </div>
                                        <div>
                                            <Label>Corporate Bank Account</Label>
                                            <Input
                                                value={partnerForm.bank_account}
                                                onChange={(e) => setPartnerForm({ ...partnerForm, bank_account: e.target.value })}
                                                placeholder="20208000..."
                                            />
                                        </div>
                                        <div>
                                            <Label>Bank MFO</Label>
                                            <Input
                                                value={partnerForm.bank_mfo}
                                                onChange={(e) => setPartnerForm({ ...partnerForm, bank_mfo: e.target.value })}
                                                placeholder="00444"
                                            />
                                        </div>
                                        <div>
                                            <Label>Partner Code (optional)</Label>
                                            <Input
                                                value={partnerForm.partner_code}
                                                onChange={(e) => setPartnerForm({ ...partnerForm, partner_code: e.target.value.toUpperCase() })}
                                                placeholder="Auto-generated if empty"
                                            />
                                        </div>
                                        <div>
                                            <Label>Contract Number</Label>
                                            <Input
                                                value={partnerForm.contract_number}
                                                onChange={(e) => setPartnerForm({ ...partnerForm, contract_number: e.target.value })}
                                                placeholder="AG-2026-001"
                                            />
                                        </div>
                                        <div>
                                            <Label>Contact Phone</Label>
                                            <Input
                                                value={partnerForm.contact_phone}
                                                onChange={(e) => setPartnerForm({ ...partnerForm, contact_phone: e.target.value })}
                                                placeholder="+998 90 123 45 67"
                                            />
                                        </div>
                                        <div className="flex items-end gap-2 md:col-span-3">
                                            <Button type="submit">Save Partner Center</Button>
                                            <Button type="button" variant="outline" onClick={() => setShowPartnerForm(false)}>
                                                Cancel
                                            </Button>
                                        </div>
                                    </form>
                                </CardContent>
                            </Card>
                        )}

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            {partners.map((partner) => {
                                const referralLink =
                                    typeof window !== 'undefined'
                                        ? `${window.location.origin}/register?partner=${partner.partner_code}`
                                        : `/register?partner=${partner.partner_code}`;

                                return (
                                    <Card key={partner.id}>
                                        <CardHeader>
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <CardTitle className="text-lg">{partner.name}</CardTitle>
                                                    <CardDescription>
                                                        {partner.legal_name} ({partner.legal_type.toUpperCase()})
                                                        {partner.inn_stir ? ` · INN ${partner.inn_stir}` : ''}
                                                    </CardDescription>
                                                </div>
                                                <Badge variant={partner.status === 'active' ? 'default' : 'secondary'}>
                                                    {partner.status}
                                                </Badge>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="grid grid-cols-3 gap-2 rounded-xl bg-muted/50 p-3 text-sm">
                                                <div>
                                                    <div className="text-xs text-muted-foreground">Students</div>
                                                    <div className="font-semibold">{partner.attributions_count}</div>
                                                </div>
                                                <div>
                                                    <div className="text-xs text-muted-foreground">Unpaid Accrued</div>
                                                    <div className="font-semibold">{formatUzs(partner.accrued_balance_uzs)}</div>
                                                </div>
                                                <div>
                                                    <div className="text-xs text-muted-foreground">Paid Total</div>
                                                    <div className="font-semibold">{formatUzs(partner.paid_total_uzs)}</div>
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                                                <span>
                                                    Code: <strong className="text-foreground">{partner.partner_code}</strong> · Share: {partner.commission_rate_bps / 100}%
                                                </span>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => copyText(referralLink, 'Referral link')}
                                                    className="h-7 gap-1 px-2"
                                                >
                                                    <Copy className="h-3.5 w-3.5" />
                                                    Copy Referral Link
                                                </Button>
                                            </div>

                                            <div className="flex flex-wrap gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => {
                                                        setBatchTargetPartner(partner);
                                                        setActiveTab('vouchers');
                                                    }}
                                                    className="gap-1.5"
                                                >
                                                    <Ticket className="h-3.5 w-3.5" />
                                                    Issue Track B2 Batch
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => {
                                                        setPassTargetPartner(partner);
                                                        setActiveTab('passes');
                                                    }}
                                                    className="gap-1.5"
                                                >
                                                    <Crown className="h-3.5 w-3.5" />
                                                    Issue Partner Pass
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleTogglePartnerStatus(partner)}
                                                >
                                                    {partner.status === 'active' ? 'Pause Partner' : 'Activate Partner'}
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => setStaffPartnerId(partner.id)}
                                                    className="gap-1.5"
                                                >
                                                    <Users className="h-3.5 w-3.5" />
                                                    Staff Logins ({partner.staff_memberships_count ?? partner.staff_memberships?.length ?? 0})
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* TAB 2: Track A Ledger & Unstarted Completed Review */}
                {activeTab === 'ledger' && (
                    <div className="space-y-6">
                        {unstartedReviewAppointments.length > 0 && (
                            <Card className="border-amber-300 bg-amber-50/40 dark:bg-amber-950/10">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <AlertTriangle className="h-5 w-5 text-amber-600" />
                                        Completed Sessions Where Meeting Never Started ({unstartedReviewAppointments.length})
                                    </CardTitle>
                                    <CardDescription>
                                        Auto-completed after end time. Void and refund if the teacher failed to start while the student waited.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    {unstartedReviewAppointments.map((apt) => (
                                        <div
                                            key={apt.id}
                                            className="flex flex-col justify-between gap-2 rounded-xl border bg-background p-3 sm:flex-row sm:items-center"
                                        >
                                            <div className="text-sm">
                                                <div className="font-medium">
                                                    {apt.pupil?.full_name || 'Student'} with {apt.teacher?.full_name || 'Teacher'}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {new Date(apt.start_at).toLocaleString()} · {apt.duration_minutes} min ·{' '}
                                                    {apt.partner_commission_entry
                                                        ? `Accrued partner fee: ${formatUzs(apt.partner_commission_entry.partner_amount)}`
                                                        : 'Organic / Non-commission session'}
                                                </div>
                                            </div>
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                onClick={() => setVoidTarget(apt)}
                                            >
                                                Void & Refund Teacher No-Show
                                            </Button>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        )}

                        <Card>
                            <CardHeader>
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <CardTitle>Track A Net-Cash Commission Ledger</CardTitle>
                                        <CardDescription>
                                            Accrues strictly on completed non-trial paid lessons after 2% gateway fee deduction.
                                        </CardDescription>
                                    </div>
                                    <div className="flex gap-2">
                                        {(['all', 'started', 'unstarted'] as const).map((filter) => (
                                            <Button
                                                key={filter}
                                                size="sm"
                                                variant={meetingFilter === filter ? 'default' : 'outline'}
                                                onClick={() =>
                                                    router.get(
                                                        partnersIndex.url(),
                                                        { meeting: filter },
                                                        { preserveState: true, replace: true },
                                                    )
                                                }
                                            >
                                                {filter === 'all' ? 'All' : filter === 'started' ? 'Started' : 'Never Started'}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead>
                                            <tr className="border-b text-xs text-muted-foreground">
                                                <th className="py-2 pr-3">Center</th>
                                                <th className="py-2 pr-3">Student / Teacher</th>
                                                <th className="py-2 pr-3">Source</th>
                                                <th className="py-2 pr-3">Meeting</th>
                                                <th className="py-2 pr-3">Net Basis</th>
                                                <th className="py-2 pr-3">5% Partner</th>
                                                <th className="py-2">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {commissionEntries.data.map((entry) => (
                                                <tr key={entry.id} className="border-b last:border-0">
                                                    <td className="py-3 pr-3 font-medium">
                                                        {entry.partner_organization?.name}
                                                    </td>
                                                    <td className="py-3 pr-3">
                                                        <div>{entry.pupil?.full_name}</div>
                                                        <div className="text-xs text-muted-foreground">{entry.teacher?.full_name}</div>
                                                    </td>
                                                    <td className="py-3 pr-3 text-xs">
                                                        {entry.entry_source === 'package_lesson' ? 'Package Pro-Rata' : 'Direct Lesson'}
                                                    </td>
                                                    <td className="py-3 pr-3">
                                                        {entry.meeting_started ? (
                                                            <Badge className="bg-emerald-600">Started</Badge>
                                                        ) : (
                                                            <Badge variant="destructive">Never Started</Badge>
                                                        )}
                                                    </td>
                                                    <td className="py-3 pr-3">
                                                        <div>{formatUzs(entry.net_cash_basis)}</div>
                                                        <div className="text-xs text-muted-foreground">
                                                            Gross {formatUzs(entry.gross_lesson_value)} (-{formatUzs(entry.gateway_fee_amount)})
                                                        </div>
                                                    </td>
                                                    <td className="py-3 pr-3 font-semibold">{formatUzs(entry.partner_amount)}</td>
                                                    <td className="py-3">
                                                        <Badge variant={entry.status === 'voided' ? 'destructive' : 'secondary'}>
                                                            {entry.status}
                                                        </Badge>
                                                    </td>
                                                </tr>
                                            ))}
                                            {commissionEntries.data.length === 0 && (
                                                <tr>
                                                    <td colSpan={7} className="py-8 text-center text-muted-foreground">
                                                        No Track A commission entries recorded yet.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                <AdminPagination
                                    links={commissionEntries.links}
                                    from={commissionEntries.from}
                                    to={commissionEntries.to}
                                    total={commissionEntries.total}
                                    perPage={commissionEntries.per_page ?? 15}
                                />
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* TAB 3: Monthly Corporate Payouts */}
                {activeTab === 'payouts' && (
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Generate Monthly Corporate Payouts</CardTitle>
                                <CardDescription>
                                    Centers with at least {formatUzs(summary.minimum_payout_uzs)} accrued receive a payout draft; smaller balances roll over automatically.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex flex-wrap items-end gap-3">
                                <div>
                                    <Label>Year</Label>
                                    <Input
                                        type="number"
                                        value={payoutYear}
                                        onChange={(e) => setPayoutYear(e.target.value)}
                                        className="w-28"
                                    />
                                </div>
                                <div>
                                    <Label>Month</Label>
                                    <Input
                                        type="number"
                                        min={1}
                                        max={12}
                                        value={payoutMonth}
                                        onChange={(e) => setPayoutMonth(e.target.value)}
                                        className="w-24"
                                    />
                                </div>
                                <Button onClick={handleGeneratePayouts}>Run Monthly Payout Batch</Button>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Payout Statements</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {payouts.data.map((payout) => (
                                    <div
                                        key={payout.id}
                                        className="flex flex-col justify-between gap-3 rounded-xl border p-4 sm:flex-row sm:items-center"
                                    >
                                        <div>
                                            <div className="flex items-center gap-2 font-semibold">
                                                <span>{payout.partner_organization?.name}</span>
                                                <Badge variant={payout.status === 'paid' ? 'default' : 'secondary'}>
                                                    {payout.status}
                                                </Badge>
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                Period {payout.period_year}-{String(payout.period_month).padStart(2, '0')} · {payout.total_lessons_count} lessons · Net GMV {formatUzs(payout.total_net_cash_gmv)}
                                            </div>
                                            {payout.didox_document_id && (
                                                <div className="mt-1 text-xs text-emerald-700 dark:text-emerald-400">
                                                    Didox: {payout.didox_document_id}
                                                    {payout.payment_reference ? ` · Ref: ${payout.payment_reference}` : ''}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <div className="mr-2 text-lg font-bold">{formatUzs(payout.total_commission_amount)}</div>
                                            <a href={exportPayoutCsv.url(payout.id)}>
                                                <Button size="sm" variant="outline" className="gap-1.5">
                                                    <Download className="h-3.5 w-3.5" />
                                                    CSV
                                                </Button>
                                            </a>
                                            {payout.status !== 'paid' && payout.status !== 'cancelled' && (
                                                <Button size="sm" onClick={() => setPayoutModal(payout)}>
                                                    Mark Paid (Didox)
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {payouts.data.length === 0 && (
                                    <div className="py-8 text-center text-sm text-muted-foreground">
                                        No corporate payout batches generated yet.
                                    </div>
                                )}
                                <AdminPagination
                                    links={payouts.links}
                                    from={payouts.from}
                                    to={payouts.to}
                                    total={payouts.total}
                                    perPage={payouts.per_page ?? 12}
                                />
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* TAB 4: Track B2 Wholesale Bulk Vouchers */}
                {activeTab === 'vouchers' && (
                    <div className="space-y-6">
                        {batchTargetPartner && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Issue Track B2 Wholesale Batch for {batchTargetPartner.name}</CardTitle>
                                    <CardDescription>
                                        Single-use codes (1 voucher = 1 lesson), 10–15% wholesale discount, 30–90 day validity.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={handleCreateBatch} className="grid grid-cols-1 gap-4 md:grid-cols-4">
                                        <div className="md:col-span-2">
                                            <Label>Batch Title *</Label>
                                            <Input
                                                required
                                                value={batchForm.title}
                                                onChange={(e) => setBatchForm({ ...batchForm, title: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <Label>Bundle Type</Label>
                                            <select
                                                value={batchForm.bundle_type}
                                                onChange={(e) => setBatchForm({ ...batchForm, bundle_type: e.target.value })}
                                                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                                            >
                                                <option value="mock_speaking">Speaking Mock Interview</option>
                                                <option value="lesson_1on1">1-on-1 Speaking Lesson</option>
                                            </select>
                                        </div>
                                        <div>
                                            <Label>Duration (minutes)</Label>
                                            <select
                                                value={batchForm.lesson_duration_minutes}
                                                onChange={(e) => setBatchForm({ ...batchForm, lesson_duration_minutes: e.target.value })}
                                                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                                            >
                                                <option value="20">20 min</option>
                                                <option value="30">30 min</option>
                                                <option value="45">45 min</option>
                                                <option value="60">60 min</option>
                                            </select>
                                        </div>
                                        <div>
                                            <Label>Unit Face Value (UZS)</Label>
                                            <Input
                                                type="number"
                                                required
                                                value={batchForm.unit_face_value_uzs}
                                                onChange={(e) => setBatchForm({ ...batchForm, unit_face_value_uzs: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <Label>Max Teacher Lesson Cap (UZS)</Label>
                                            <Input
                                                type="number"
                                                required
                                                value={batchForm.max_lesson_price_uzs}
                                                onChange={(e) => setBatchForm({ ...batchForm, max_lesson_price_uzs: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <Label>Wholesale Discount (10–15%)</Label>
                                            <Input
                                                type="number"
                                                min={10}
                                                max={15}
                                                required
                                                value={batchForm.wholesale_discount_percent}
                                                onChange={(e) => setBatchForm({ ...batchForm, wholesale_discount_percent: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <Label>Quantity</Label>
                                            <Input
                                                type="number"
                                                min={1}
                                                max={1000}
                                                required
                                                value={batchForm.quantity}
                                                onChange={(e) => setBatchForm({ ...batchForm, quantity: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <Label>Validity (30–90 days)</Label>
                                            <Input
                                                type="number"
                                                min={30}
                                                max={90}
                                                required
                                                value={batchForm.validity_days}
                                                onChange={(e) => setBatchForm({ ...batchForm, validity_days: e.target.value })}
                                            />
                                        </div>
                                        <div className="flex items-center gap-2 pt-6">
                                            <input
                                                id="mark_paid_batch"
                                                type="checkbox"
                                                checked={batchForm.mark_paid}
                                                onChange={(e) => setBatchForm({ ...batchForm, mark_paid: e.target.checked })}
                                            />
                                            <Label htmlFor="mark_paid_batch">Paid Upfront (generate codes now)</Label>
                                        </div>
                                        <div className="flex items-end gap-2 md:col-span-2">
                                            <Button type="submit">Create Wholesale Batch</Button>
                                            <Button type="button" variant="outline" onClick={() => setBatchTargetPartner(null)}>
                                                Cancel
                                            </Button>
                                        </div>
                                    </form>
                                </CardContent>
                            </Card>
                        )}

                        <div className="space-y-4">
                            {batches.map((batch) => (
                                <Card key={batch.id}>
                                    <CardHeader>
                                        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                                            <div>
                                                <CardTitle className="text-base">
                                                    {batch.title} — {batch.partner_organization?.name}
                                                </CardTitle>
                                                <CardDescription>
                                                    {batch.quantity} × {batch.lesson_duration_minutes}m · Max cap {formatUzs(batch.max_lesson_price_uzs)} ·{' '}
                                                    {batch.wholesale_discount_percent}% wholesale ({formatUzs(batch.unit_wholesale_price_uzs)}/ea ={' '}
                                                    {formatUzs(batch.total_paid_upfront_uzs)} total) · Expires{' '}
                                                    {new Date(batch.valid_until).toLocaleDateString()}
                                                </CardDescription>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge variant={batch.payment_status === 'paid' ? 'default' : 'secondary'}>
                                                    {batch.payment_status}
                                                </Badge>
                                                {batch.payment_status === 'pending' && (
                                                    <Button
                                                        size="sm"
                                                        onClick={() =>
                                                            router.post(activateVoucherBatch.url(batch.id), {}, {
                                                                preserveScroll: true,
                                                                onSuccess: () => toast.success('Voucher codes generated'),
                                                            })
                                                        }
                                                    >
                                                        Confirm Payment & Generate Codes
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <div className="flex flex-wrap gap-4 text-xs">
                                            <span>Available: <strong>{batch.available_count}</strong></span>
                                            <span>Redeemed: <strong>{batch.redeemed_count}</strong></span>
                                            <span>Expired (Breakage): <strong>{batch.expired_count}</strong></span>
                                        </div>
                                        {batch.vouchers.length > 0 && (
                                            <div className="flex flex-wrap gap-2">
                                                {batch.vouchers.map((voucher) => (
                                                    <button
                                                        key={voucher.id}
                                                        type="button"
                                                        onClick={() => copyText(voucher.code, 'Voucher code')}
                                                        className="inline-flex items-center gap-1 rounded-md border px-2 py-1 font-mono text-xs hover:bg-muted"
                                                    >
                                                        <span>{voucher.code}</span>
                                                        <span className="text-[10px] uppercase text-muted-foreground">
                                                            ({voucher.status})
                                                        </span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                            {batches.length === 0 && (
                                <Card>
                                    <CardContent className="py-10 text-center text-sm text-muted-foreground">
                                        No wholesale voucher batches issued yet. Select "Issue Track B2 Batch" on any active partner center.
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </div>
                )}

                {/* TAB 5: Track B1 Partner Pass & Configurable Pricing */}
                {activeTab === 'passes' && (
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Partner Pass Pricing & Daily P2P Quotas</CardTitle>
                                <CardDescription>
                                    Configure retail B2C price, B2B wholesale pricing, pass validity, and daily peer speaking minutes.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSaveSettings} className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                    <div>
                                        <Label>B2C Retail Price (UZS)</Label>
                                        <Input
                                            type="number"
                                            value={settingsForm.partner_pass_b2c_price_uzs}
                                            onChange={(e) => setSettingsForm({ ...settingsForm, partner_pass_b2c_price_uzs: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <Label>B2B Default Seat Price (UZS)</Label>
                                        <Input
                                            type="number"
                                            value={settingsForm.partner_pass_b2b_default_price_uzs}
                                            onChange={(e) => setSettingsForm({ ...settingsForm, partner_pass_b2b_default_price_uzs: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <Label>B2B Wholesale Floor (UZS)</Label>
                                        <Input
                                            type="number"
                                            value={settingsForm.partner_pass_b2b_min_price_uzs}
                                            onChange={(e) => setSettingsForm({ ...settingsForm, partner_pass_b2b_min_price_uzs: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <Label>Default Pass Duration (days)</Label>
                                        <Input
                                            type="number"
                                            value={settingsForm.partner_pass_default_days}
                                            onChange={(e) => setSettingsForm({ ...settingsForm, partner_pass_default_days: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <Label>Standard Daily P2P Limit (min)</Label>
                                        <Input
                                            type="number"
                                            value={settingsForm.p2p_free_daily_minutes}
                                            onChange={(e) => setSettingsForm({ ...settingsForm, p2p_free_daily_minutes: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <Label>Attributed Center Pupil Limit (min)</Label>
                                        <Input
                                            type="number"
                                            value={settingsForm.p2p_attributed_daily_minutes}
                                            onChange={(e) => setSettingsForm({ ...settingsForm, p2p_attributed_daily_minutes: e.target.value })}
                                        />
                                    </div>
                                    <div className="md:col-span-3 flex justify-end">
                                        <Button type="submit">Save Pricing & Quota Settings</Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>

                        {pendingRetailPasses.length > 0 && (
                            <Card className="border-amber-500/40">
                                <CardHeader>
                                    <CardTitle>Pending B2C Partner Pass Verifications ({pendingRetailPasses.length})</CardTitle>
                                    <CardDescription>
                                        Confirm student Humo receipts to activate unlimited P2P access and accrue 5% partner share where attributed.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {pendingRetailPasses.map((item) => (
                                        <div
                                            key={item.id}
                                            className="flex flex-col justify-between gap-3 rounded-xl border p-3 sm:flex-row sm:items-center"
                                        >
                                            <div className="space-y-1 text-sm">
                                                <div className="font-semibold">
                                                    {item.user?.full_name} ({item.user?.email}) · {formatUzs(item.gross_amount)}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {item.duration_days} days ·{' '}
                                                    {item.partner_organization
                                                        ? `Attributed to ${item.partner_organization.name} (5% on Net Cash)`
                                                        : 'Direct student purchase'}
                                                </div>
                                                {item.receipt_data?.note && (
                                                    <div className="text-xs text-muted-foreground">Ref: {item.receipt_data.note}</div>
                                                )}
                                                {item.receipt_path && (
                                                    <a
                                                        href={`/storage/${item.receipt_path}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="inline-block text-xs font-medium text-primary underline"
                                                    >
                                                        View Uploaded Receipt
                                                    </a>
                                                )}
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    onClick={() =>
                                                        router.post(confirmRetailPass.url(item.id), {}, {
                                                            preserveScroll: true,
                                                            onSuccess: () => toast.success('Partner Pass activated'),
                                                        })
                                                    }
                                                >
                                                    Confirm & Activate
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={() =>
                                                        router.post(rejectRetailPass.url(item.id), {}, {
                                                            preserveScroll: true,
                                                            onSuccess: () => toast.success('Partner Pass order rejected'),
                                                        })
                                                    }
                                                >
                                                    Reject
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        )}

                        {passTargetPartner && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Issue Track B1 Partner Pass Seats for {passTargetPartner.name}</CardTitle>
                                    <CardDescription>
                                        Generate wholesale PASS codes (0% extra Track A commission; wholesale discount priced upfront).
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={handleCreatePassBatch} className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                        <div>
                                            <Label>Cohort / Batch Title *</Label>
                                            <Input
                                                required
                                                value={passBatchForm.title}
                                                onChange={(e) => setPassBatchForm({ ...passBatchForm, title: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <Label>Pass Duration (days)</Label>
                                            <Input
                                                type="number"
                                                value={passBatchForm.duration_days}
                                                onChange={(e) => setPassBatchForm({ ...passBatchForm, duration_days: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <Label>Wholesale Unit Price (UZS)</Label>
                                            <Input
                                                type="number"
                                                value={passBatchForm.unit_wholesale_price_uzs}
                                                onChange={(e) =>
                                                    setPassBatchForm({ ...passBatchForm, unit_wholesale_price_uzs: e.target.value })
                                                }
                                            />
                                        </div>
                                        <div>
                                            <Label>Seats Quantity</Label>
                                            <Input
                                                type="number"
                                                value={passBatchForm.quantity}
                                                onChange={(e) => setPassBatchForm({ ...passBatchForm, quantity: e.target.value })}
                                            />
                                        </div>
                                        <div className="flex items-end gap-2">
                                            <input
                                                id="pass-mark-paid"
                                                type="checkbox"
                                                checked={passBatchForm.mark_paid}
                                                onChange={(e) => setPassBatchForm({ ...passBatchForm, mark_paid: e.target.checked })}
                                            />
                                            <Label htmlFor="pass-mark-paid">Payment received — generate codes now</Label>
                                        </div>
                                        <div className="md:col-span-3 flex justify-end gap-2">
                                            <Button type="button" variant="outline" onClick={() => setPassTargetPartner(null)}>
                                                Cancel
                                            </Button>
                                            <Button type="submit">Create Partner Pass Batch</Button>
                                        </div>
                                    </form>
                                </CardContent>
                            </Card>
                        )}

                        <div className="space-y-4">
                            {passBatches.map((batch) => (
                                <Card key={batch.id}>
                                    <CardHeader className="flex flex-row items-center justify-between gap-4 pb-3">
                                        <div>
                                            <CardTitle className="text-base">{batch.title}</CardTitle>
                                            <CardDescription>
                                                {batch.partner_organization?.name} · {batch.quantity} seats ×{' '}
                                                {formatUzs(batch.unit_wholesale_price_uzs)} = {formatUzs(batch.total_paid_upfront_uzs)} ·{' '}
                                                {batch.duration_days} days
                                            </CardDescription>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant={batch.payment_status === 'paid' ? 'default' : 'secondary'}>
                                                {batch.payment_status}
                                            </Badge>
                                            {batch.payment_status === 'pending' && (
                                                <Button
                                                    size="sm"
                                                    onClick={() =>
                                                        router.post(activatePassBatch.url(batch.id), {}, {
                                                            preserveScroll: true,
                                                            onSuccess: () => toast.success('Partner Pass codes generated'),
                                                        })
                                                    }
                                                >
                                                    Mark Paid & Issue Codes
                                                </Button>
                                            )}
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                                            <span>Unclaimed: {batch.unclaimed_count}</span>
                                            <span>Active: {batch.active_count}</span>
                                            <span>Expired: {batch.expired_count}</span>
                                        </div>
                                        {batch.passes.length > 0 && (
                                            <div className="flex flex-wrap gap-2">
                                                {batch.passes.map((p) => (
                                                    <button
                                                        type="button"
                                                        key={p.id}
                                                        onClick={() => p.activation_code && copyText(p.activation_code, 'Pass code')}
                                                        className="inline-flex items-center gap-1.5 rounded-md border bg-muted/40 px-2.5 py-1 font-mono text-xs hover:bg-muted"
                                                    >
                                                        <span>{p.activation_code}</span>
                                                        <span className="text-[10px] uppercase text-muted-foreground">
                                                            ({p.status})
                                                        </span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                            {passBatches.length === 0 && (
                                <Card>
                                    <CardContent className="py-10 text-center text-sm text-muted-foreground">
                                        No B2B Partner Pass batches issued yet. Select "Issue Partner Pass" on any active center.
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Void Unstarted Session Modal */}
            {voidTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <Card className="w-full max-w-md">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <XCircle className="h-5 w-5 text-destructive" />
                                Void Teacher No-Show Session
                            </CardTitle>
                            <CardDescription>
                                Cancels payment and voids any accrued 5% partner commission for {voidTarget.pupil?.full_name}.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label>Reason</Label>
                                <Input value={voidReason} onChange={(e) => setVoidReason(e.target.value)} />
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setVoidTarget(null)}>
                                    Cancel
                                </Button>
                                <Button variant="destructive" onClick={handleVoidSubmit}>
                                    Confirm Void & Refund
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Mark Payout Paid Modal */}
            {payoutModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <Card className="w-full max-w-md">
                        <CardHeader>
                            <CardTitle>Record Corporate Transfer & Didox Act</CardTitle>
                            <CardDescription>
                                {payoutModal.partner_organization?.legal_name} · {formatUzs(payoutModal.total_commission_amount)}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleMarkPayoutPaid} className="space-y-4">
                                <div>
                                    <Label>Didox E-Faktura / Act ID *</Label>
                                    <Input
                                        required
                                        value={didoxId}
                                        onChange={(e) => setDidoxId(e.target.value)}
                                        placeholder="DIDOX-2026-88412"
                                    />
                                </div>
                                <div>
                                    <Label>Bank Payment Order Reference</Label>
                                    <Input
                                        value={paymentRef}
                                        onChange={(e) => setPaymentRef(e.target.value)}
                                        placeholder="PP-99102"
                                    />
                                </div>
                                <div className="flex justify-end gap-2">
                                    <Button type="button" variant="outline" onClick={() => setPayoutModal(null)}>
                                        Cancel
                                    </Button>
                                    <Button type="submit">Confirm Paid</Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Partner Staff Logins Modal */}
            {staffTargetPartner && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <Card className="max-h-[90vh] w-full max-w-2xl overflow-y-auto">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5" />
                                Staff Portal Logins — {staffTargetPartner.name}
                            </CardTitle>
                            <CardDescription>
                                Provision director, manager, or accountant logins scoped strictly to this partner center.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <h4 className="text-sm font-medium">Current Staff Access</h4>
                                {!staffTargetPartner.staff_memberships?.length ? (
                                    <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
                                        No staff logins assigned yet. Add a director or coordinator below.
                                    </p>
                                ) : (
                                    <div className="space-y-2">
                                        {staffTargetPartner.staff_memberships.map((member) => (
                                            <div
                                                key={member.id}
                                                className="flex flex-col justify-between gap-2 rounded-lg border p-3 sm:flex-row sm:items-center"
                                            >
                                                <div className="text-sm">
                                                    <div className="flex items-center gap-2 font-medium">
                                                        <span>{member.user?.full_name || 'Staff Member'}</span>
                                                        <Badge variant="outline" className="capitalize">
                                                            {member.staff_role}
                                                        </Badge>
                                                        <Badge variant={member.is_active ? 'default' : 'secondary'}>
                                                            {member.is_active ? 'Active' : 'Suspended'}
                                                        </Badge>
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {member.user?.email}
                                                        {member.user?.phone_number ? ` · ${member.user.phone_number}` : ''}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleToggleStaff(member.id)}
                                                    >
                                                        {member.is_active ? 'Suspend' : 'Enable'}
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => handleRemoveStaff(member.id)}
                                                        className="text-destructive hover:text-destructive"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <form onSubmit={handleCreateStaff} className="space-y-4 border-t pt-4">
                                <h4 className="text-sm font-medium">Add or Link Partner Staff</h4>
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <div>
                                        <Label>Full Name *</Label>
                                        <Input
                                            required
                                            value={staffForm.full_name}
                                            onChange={(e) => setStaffForm({ ...staffForm, full_name: e.target.value })}
                                            placeholder="Dilshod Karimov"
                                        />
                                    </div>
                                    <div>
                                        <Label>Staff Role *</Label>
                                        <select
                                            value={staffForm.staff_role}
                                            onChange={(e) =>
                                                setStaffForm({
                                                    ...staffForm,
                                                    staff_role: e.target.value as 'director' | 'manager' | 'accountant',
                                                })
                                            }
                                            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                                        >
                                            <option value="director">Director</option>
                                            <option value="manager">Coordinator / Manager</option>
                                            <option value="accountant">Accountant</option>
                                        </select>
                                    </div>
                                    <div>
                                        <Label>Email *</Label>
                                        <Input
                                            type="email"
                                            required
                                            value={staffForm.email}
                                            onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                                            placeholder="director@center.uz"
                                        />
                                    </div>
                                    <div>
                                        <Label>Phone Number</Label>
                                        <Input
                                            value={staffForm.phone_number}
                                            onChange={(e) => setStaffForm({ ...staffForm, phone_number: e.target.value })}
                                            placeholder="+998901234567"
                                        />
                                    </div>
                                    <div className="sm:col-span-2">
                                        <Label>Initial Password (optional — leave blank to send password setup email)</Label>
                                        <Input
                                            type="password"
                                            minLength={8}
                                            value={staffForm.password}
                                            onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })}
                                            placeholder="Minimum 8 characters (optional)"
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2">
                                    <Button type="button" variant="outline" onClick={() => setStaffPartnerId(null)}>
                                        Close
                                    </Button>
                                    <Button type="submit">Save Staff Login</Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )}
        </AppLayout>
    );
}

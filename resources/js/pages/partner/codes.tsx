import { Head } from '@inertiajs/react';
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
import { Copy, Crown, Ticket } from 'lucide-react';
import { toast } from 'sonner';

interface VoucherCodeItem {
    id: string;
    code: string;
    status: 'available' | 'redeemed' | 'expired' | 'voided';
    redeemed_at?: string | null;
    claimed_by_user?: { id: string; full_name: string; email: string } | null;
}

interface VoucherBatchItem {
    id: string;
    title: string;
    bundle_type: string;
    lesson_duration_minutes: number;
    unit_face_value_uzs: number;
    wholesale_discount_percent: number;
    quantity: number;
    total_paid_upfront_uzs: number;
    payment_status: 'pending' | 'paid' | 'cancelled';
    valid_until: string;
    available_count: number;
    redeemed_count: number;
    expired_count: number;
    vouchers: VoucherCodeItem[];
}

interface PassCodeItem {
    id: string;
    activation_code: string;
    status: 'unclaimed' | 'active' | 'expired' | 'revoked';
    activated_at?: string | null;
    expires_at?: string | null;
    user?: { id: string; full_name: string; email: string } | null;
}

interface PassBatchItem {
    id: string;
    title: string;
    duration_days: number;
    unit_wholesale_price_uzs: number;
    quantity: number;
    total_paid_upfront_uzs: number;
    payment_status: 'pending' | 'paid' | 'cancelled';
    unclaimed_count: number;
    active_count: number;
    expired_count: number;
    passes: PassCodeItem[];
}

interface Props {
    organization: {
        id: string;
        name: string;
        partner_code: string;
    };
    voucherBatches: VoucherBatchItem[];
    passBatches: PassBatchItem[];
}

const formatUzs = (amount: number | null | undefined): string =>
    `${new Intl.NumberFormat('en-US').format(amount ?? 0)} UZS`;

export default function PartnerCodes({ organization, voucherBatches, passBatches }: Props) {
    const copyCode = (code: string, label: string) => {
        navigator.clipboard?.writeText(code);
        toast.success(`${label} ${code} copied`);
    };

    return (
        <AppLayout>
            <Head title={`Vouchers & Passes — ${organization.name}`} />

            <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
                <div>
                    <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
                        <Ticket className="h-6 w-6 text-primary" />
                        Allocated Vouchers & Partner Pass Seats
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Track B2 lesson vouchers and Track B1 Unlimited Partner Pass activation codes assigned to {organization.name}.
                    </p>
                </div>

                {/* Track B1 Partner Pass Batches */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Crown className="h-5 w-5 text-amber-500" />
                            Track B1 Partner Pass Seat Batches ({passBatches.length})
                        </CardTitle>
                        <CardDescription>
                            Distribute unclaimed <span className="font-mono">PASS-...</span> codes to your enrolled students so they can
                            activate unlimited daily P2P speaking from their ConvoMate settings.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {passBatches.length === 0 ? (
                            <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                                No Partner Pass batches allocated to your center yet. Contact ConvoMate Admin to purchase wholesale seats.
                            </p>
                        ) : (
                            passBatches.map((batch) => (
                                <div key={batch.id} className="space-y-3 rounded-xl border p-4">
                                    <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                                        <div>
                                            <div className="flex flex-wrap items-center gap-2 font-semibold">
                                                <span>{batch.title}</span>
                                                <Badge variant={batch.payment_status === 'paid' ? 'default' : 'secondary'}>
                                                    {batch.payment_status === 'paid' ? 'Paid & Active' : 'Awaiting Payment'}
                                                </Badge>
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {batch.quantity} seats · {batch.duration_days} days each ·{' '}
                                                {formatUzs(batch.unit_wholesale_price_uzs)}/seat ({formatUzs(batch.total_paid_upfront_uzs)} total)
                                            </div>
                                        </div>
                                        <div className="flex gap-2 text-xs">
                                            <Badge variant="outline">{batch.unclaimed_count} Available</Badge>
                                            <Badge variant="default">{batch.active_count} Active</Badge>
                                            <Badge variant="secondary">{batch.expired_count} Expired</Badge>
                                        </div>
                                    </div>

                                    {batch.passes.length > 0 && (
                                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                            {batch.passes.map((pass) => (
                                                <div
                                                    key={pass.id}
                                                    className="flex items-center justify-between gap-2 rounded-lg bg-muted/40 px-3 py-2 text-xs"
                                                >
                                                    <div className="min-w-0">
                                                        <div className="font-mono font-semibold">{pass.activation_code}</div>
                                                        <div className="truncate text-muted-foreground">
                                                            {pass.user
                                                                ? `${pass.user.full_name} (${pass.expires_at ? `exp ${new Date(pass.expires_at).toLocaleDateString()}` : 'active'})`
                                                                : 'Unclaimed — ready to hand out'}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <Badge variant={pass.status === 'unclaimed' ? 'outline' : 'secondary'}>
                                                            {pass.status}
                                                        </Badge>
                                                        {pass.status === 'unclaimed' && (
                                                            <Button
                                                                type="button"
                                                                size="sm"
                                                                variant="ghost"
                                                                className="h-7 w-7 p-0"
                                                                onClick={() => copyCode(pass.activation_code, 'Pass code')}
                                                            >
                                                                <Copy className="h-3.5 w-3.5" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>

                {/* Track B2 Voucher Batches */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Ticket className="h-5 w-5 text-primary" />
                            Track B2 Lesson Voucher Batches ({voucherBatches.length})
                        </CardTitle>
                        <CardDescription>
                            Single-use prepaid 1-on-1 or mock speaking vouchers issued for your students.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {voucherBatches.length === 0 ? (
                            <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                                No lesson voucher batches assigned to your center yet.
                            </p>
                        ) : (
                            voucherBatches.map((batch) => (
                                <div key={batch.id} className="space-y-3 rounded-xl border p-4">
                                    <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                                        <div>
                                            <div className="flex flex-wrap items-center gap-2 font-semibold">
                                                <span>{batch.title}</span>
                                                <Badge variant={batch.payment_status === 'paid' ? 'default' : 'secondary'}>
                                                    {batch.payment_status === 'paid' ? 'Paid & Issued' : 'Pending Payment'}
                                                </Badge>
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {batch.lesson_duration_minutes} min · Face value {formatUzs(batch.unit_face_value_uzs)} · Valid until{' '}
                                                {new Date(batch.valid_until).toLocaleDateString()}
                                            </div>
                                        </div>
                                        <div className="flex gap-2 text-xs">
                                            <Badge variant="outline">{batch.available_count} Available</Badge>
                                            <Badge variant="default">{batch.redeemed_count} Redeemed</Badge>
                                            <Badge variant="secondary">{batch.expired_count} Expired</Badge>
                                        </div>
                                    </div>

                                    {batch.vouchers.length > 0 && (
                                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                            {batch.vouchers.map((voucher) => (
                                                <div
                                                    key={voucher.id}
                                                    className="flex items-center justify-between gap-2 rounded-lg bg-muted/40 px-3 py-2 text-xs"
                                                >
                                                    <div className="min-w-0">
                                                        <div className="font-mono font-semibold">{voucher.code}</div>
                                                        <div className="truncate text-muted-foreground">
                                                            {voucher.claimed_by_user
                                                                ? `${voucher.claimed_by_user.full_name}`
                                                                : 'Available for booking'}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <Badge variant={voucher.status === 'available' ? 'outline' : 'secondary'}>
                                                            {voucher.status}
                                                        </Badge>
                                                        {voucher.status === 'available' && (
                                                            <Button
                                                                type="button"
                                                                size="sm"
                                                                variant="ghost"
                                                                className="h-7 w-7 p-0"
                                                                onClick={() => copyCode(voucher.code, 'Voucher code')}
                                                            >
                                                                <Copy className="h-3.5 w-3.5" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}


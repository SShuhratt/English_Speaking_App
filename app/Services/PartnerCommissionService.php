<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\GroupSessionEnrollment;
use App\Models\PartnerAttribution;
use App\Models\PartnerCommissionEntry;
use App\Models\PartnerOrganization;
use App\Models\PartnerPass;
use App\Models\PartnerPayout;
use App\Models\PartnerVoucher;
use App\Models\PupilPackage;
use App\Models\User;
use App\Models\UserDiscountVoucher;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class PartnerCommissionService
{
    public function __construct(
        protected MonetizationCalculator $calculator
    ) {}

    /**
     * Mark a past confirmed appointment as completed and accrue partner commission if eligible.
     */
    public function completeAppointment(Appointment $appointment, ?Carbon $completedAt = null): Appointment
    {
        return DB::transaction(function () use ($appointment, $completedAt) {
            $locked = Appointment::lockForUpdate()->findOrFail($appointment->id);

            if ($locked->status === 'confirmed') {
                $locked->update([
                    'status' => 'completed',
                    'completed_at' => $completedAt ?? now(),
                ]);
            }

            if ($locked->status === 'completed' && $locked->completion_voided_at === null) {
                $this->accrueForCompletedAppointment($locked);
            }

            return $locked->fresh();
        });
    }

    /**
     * Idempotently accrue Track A net-cash commission on a completed appointment.
     */
    public function accrueForCompletedAppointment(Appointment $appointment): ?PartnerCommissionEntry
    {
        return DB::transaction(function () use ($appointment) {
            $locked = Appointment::with(['pupilPackage'])
                ->lockForUpdate()
                ->findOrFail($appointment->id);

            if ($locked->status !== 'completed' || $locked->completion_voided_at !== null) {
                return null;
            }

            if (PartnerCommissionEntry::where('appointment_id', $locked->id)->exists()) {
                return PartnerCommissionEntry::where('appointment_id', $locked->id)->first();
            }

            // Exclude Trial lessons and wholesale Track B2 voucher bookings
            if ((bool) config('monetization.exclude_trial_lessons', true) && $locked->is_trial) {
                return null;
            }

            if ($locked->partner_voucher_id !== null || $locked->is_promotional_zero_cash) {
                return null;
            }

            $attribution = PartnerAttribution::with('partnerOrganization')
                ->where('pupil_id', $locked->pupil_id)
                ->first();

            if (! $attribution || ! $attribution->partnerOrganization?->isActive()) {
                return null;
            }

            $partnerOrg = $attribution->partnerOrganization;

            $entrySource = 'direct_lesson';
            $grossValue = 0;
            $gatewayProvider = $locked->gateway_provider ?: 'humo_p2p';
            $gatewayFeeBps = null;

            if ($locked->is_package_booking && $locked->pupil_package_id) {
                $package = $locked->pupilPackage;
                if (! $package || $package->payment_status !== 'paid') {
                    return null;
                }

                $entrySource = 'package_lesson';
                $grossValue = $this->calculator->calculatePackageLessonGross($package, $locked);
                $gatewayProvider = $package->gateway_provider ?: 'humo_p2p';
                $gatewayFeeBps = $package->gateway_fee_bps;
            } else {
                if ($locked->payment_status !== 'paid') {
                    return null;
                }

                $grossValue = (int) ($locked->gross_amount ?? $locked->price ?? 0);
                $gatewayFeeBps = $locked->gateway_fee_bps;
            }

            if ($grossValue <= 0) {
                return null;
            }

            $useSafeDiscount = $entrySource === 'direct_lesson'
                && $locked->discount_voucher_id !== null
                && $locked->original_price !== null
                && (int) $locked->original_price > $grossValue;

            $breakdown = $useSafeDiscount
                ? $this->calculator->calculateSafeSingleLessonBreakdown(
                    originalGross: (int) $locked->original_price,
                    discountedGross: $grossValue,
                    gatewayProvider: $gatewayProvider,
                    gatewayFeeBps: $gatewayFeeBps,
                    partnerRateBps: (int) $partnerOrg->commission_rate_bps,
                )
                : $this->calculator->calculateBreakdown(
                    grossAmount: $grossValue,
                    gatewayProvider: $gatewayProvider,
                    gatewayFeeBps: $gatewayFeeBps,
                    partnerRateBps: (int) $partnerOrg->commission_rate_bps,
                );

            if ($breakdown['net_cash_amount'] <= 0 || $breakdown['partner_amount'] <= 0) {
                return null;
            }

            return PartnerCommissionEntry::create([
                'partner_organization_id' => $partnerOrg->id,
                'pupil_id' => $locked->pupil_id,
                'teacher_id' => $locked->teacher_id,
                'appointment_id' => $locked->id,
                'pupil_package_id' => $locked->pupil_package_id,
                'entry_source' => $entrySource,
                'meeting_started' => (bool) $locked->meeting_started,
                'gross_lesson_value' => $breakdown['gross_amount'],
                'gateway_fee_bps' => $breakdown['gateway_fee_bps'],
                'gateway_fee_amount' => $breakdown['gateway_fee_amount'],
                'net_cash_basis' => $breakdown['net_cash_amount'],
                'teacher_rate_bps' => $breakdown['teacher_rate_bps'],
                'teacher_amount' => $breakdown['teacher_amount'],
                'platform_rate_bps' => $breakdown['platform_rate_bps'],
                'platform_amount' => $breakdown['platform_amount'],
                'partner_rate_bps' => $breakdown['partner_rate_bps'],
                'partner_amount' => $breakdown['partner_amount'],
                'status' => 'accrued',
                'accrued_at' => $locked->completed_at ?? now(),
            ]);
        });
    }

    /**
     * Idempotently accrue Track A net-cash commission on a completed group session seat enrollment.
     */
    public function accrueForCompletedGroupEnrollment(GroupSessionEnrollment $enrollment): ?PartnerCommissionEntry
    {
        return DB::transaction(function () use ($enrollment) {
            $locked = GroupSessionEnrollment::with('groupSession')
                ->lockForUpdate()
                ->findOrFail($enrollment->id);

            $session = $locked->groupSession;
            if (! $session || $locked->status !== 'completed' || $locked->payment_status !== 'paid') {
                return null;
            }

            if (PartnerCommissionEntry::where('group_session_enrollment_id', $locked->id)->exists()) {
                return PartnerCommissionEntry::where('group_session_enrollment_id', $locked->id)->first();
            }

            $attribution = PartnerAttribution::with('partnerOrganization')
                ->where('pupil_id', $locked->pupil_id)
                ->first();

            if (! $attribution || ! $attribution->partnerOrganization?->isActive()) {
                return null;
            }

            $partnerOrg = $attribution->partnerOrganization;
            $grossValue = (int) ($locked->gross_amount ?? $locked->price_paid);
            if ($grossValue <= 0) {
                return null;
            }

            $breakdown = $this->calculator->calculateBreakdown(
                grossAmount: $grossValue,
                gatewayProvider: $locked->gateway_provider ?: 'humo_p2p',
                gatewayFeeBps: $locked->gateway_fee_bps,
                partnerRateBps: (int) $partnerOrg->commission_rate_bps,
            );

            if ($breakdown['net_cash_amount'] <= 0 || $breakdown['partner_amount'] <= 0) {
                return null;
            }

            return PartnerCommissionEntry::create([
                'partner_organization_id' => $partnerOrg->id,
                'pupil_id' => $locked->pupil_id,
                'teacher_id' => $session->teacher_id,
                'appointment_id' => null,
                'group_session_enrollment_id' => $locked->id,
                'entry_source' => 'group_session',
                'meeting_started' => (bool) $session->meeting_started,
                'gross_lesson_value' => $breakdown['gross_amount'],
                'gateway_fee_bps' => $breakdown['gateway_fee_bps'],
                'gateway_fee_amount' => $breakdown['gateway_fee_amount'],
                'net_cash_basis' => $breakdown['net_cash_amount'],
                'teacher_rate_bps' => $breakdown['teacher_rate_bps'],
                'teacher_amount' => $breakdown['teacher_amount'],
                'platform_rate_bps' => $breakdown['platform_rate_bps'],
                'platform_amount' => $breakdown['platform_amount'],
                'partner_rate_bps' => $breakdown['partner_rate_bps'],
                'partner_amount' => $breakdown['partner_amount'],
                'status' => 'accrued',
                'accrued_at' => $locked->completed_at ?? now(),
            ]);
        });
    }

    /**
     * Accrue 5% Track A commission when an attributed pupil self-purchases a B2C Partner Pass at retail price.
     * B2B wholesale Partner Passes generate 0 extra Track A commission (gross = 0).
     */
    public function accrueForRetailPartnerPass(PartnerPass $pass): ?PartnerCommissionEntry
    {
        return DB::transaction(function () use ($pass) {
            $locked = PartnerPass::lockForUpdate()->findOrFail($pass->id);

            if ($locked->source !== 'b2c_retail' || $locked->payment_status !== 'paid' || $locked->gross_amount <= 0) {
                return null;
            }

            if (PartnerCommissionEntry::where('partner_pass_id', $locked->id)->exists()) {
                return PartnerCommissionEntry::where('partner_pass_id', $locked->id)->first();
            }

            $attribution = PartnerAttribution::with('partnerOrganization')
                ->where('pupil_id', $locked->user_id)
                ->first();

            if (! $attribution || ! $attribution->partnerOrganization?->isActive()) {
                return null;
            }

            $partnerOrg = $attribution->partnerOrganization;
            $feeBps = (int) $locked->gateway_fee_bps;
            $feeAmount = (int) $locked->gateway_fee_amount;
            $netCash = (int) $locked->net_cash_amount;

            if ($netCash <= 0) {
                $breakdown = $this->calculator->calculateBreakdown(
                    grossAmount: (int) $locked->gross_amount,
                    gatewayProvider: $locked->gateway_provider ?: 'humo_p2p',
                    gatewayFeeBps: $feeBps ?: null,
                    partnerRateBps: (int) $partnerOrg->commission_rate_bps,
                );
                $feeBps = $breakdown['gateway_fee_bps'];
                $feeAmount = $breakdown['gateway_fee_amount'];
                $netCash = $breakdown['net_cash_amount'];
            }

            $partnerBps = (int) $partnerOrg->commission_rate_bps;
            $partnerAmount = (int) round(($netCash * $partnerBps) / 10000);
            $platformAmount = max(0, $netCash - $partnerAmount);

            if ($partnerAmount <= 0) {
                return null;
            }

            return PartnerCommissionEntry::create([
                'partner_organization_id' => $partnerOrg->id,
                'pupil_id' => $locked->user_id,
                'teacher_id' => null,
                'appointment_id' => null,
                'pupil_package_id' => null,
                'partner_pass_id' => $locked->id,
                'entry_source' => 'b2c_partner_pass',
                'meeting_started' => true,
                'gross_lesson_value' => (int) $locked->gross_amount,
                'gateway_fee_bps' => $feeBps,
                'gateway_fee_amount' => $feeAmount,
                'net_cash_basis' => $netCash,
                'teacher_rate_bps' => 0,
                'teacher_amount' => 0,
                'platform_rate_bps' => max(0, 10000 - $partnerBps),
                'platform_amount' => $platformAmount,
                'partner_rate_bps' => $partnerBps,
                'partner_amount' => $partnerAmount,
                'status' => 'accrued',
                'accrued_at' => $locked->activated_at ?? now(),
            ]);
        });
    }

    /**
     * Admin voids/refunds an unstarted past session (teacher no-show) and claws back accrued commission.
     */
    public function voidForTeacherNoShow(Appointment $appointment, User $admin, string $reason): Appointment
    {
        return DB::transaction(function () use ($appointment, $admin, $reason) {
            $locked = Appointment::lockForUpdate()->findOrFail($appointment->id);

            $locked->update([
                'status' => 'cancelled',
                'payment_status' => 'refunded',
                'cancellation_reason' => $reason,
                'cancelled_by' => $admin->id,
                'completion_voided_at' => now(),
                'completion_void_reason' => $reason,
            ]);

            if ($locked->is_package_booking && $locked->pupil_package_id) {
                $pkg = PupilPackage::lockForUpdate()->find($locked->pupil_package_id);
                if ($pkg) {
                    $pkg->increment('remaining_minutes', $locked->duration_minutes);
                    if ($pkg->status === 'exhausted' && $pkg->fresh()->remaining_minutes > 0) {
                        $pkg->update(['status' => 'active']);
                    }
                }
            }

            if ($locked->discount_voucher_id) {
                $voucher = UserDiscountVoucher::lockForUpdate()->find($locked->discount_voucher_id);
                if ($voucher && $voucher->appointment_id === $locked->id) {
                    $voucher->update([
                        'is_redeemed' => false,
                        'redeemed_at' => null,
                        'appointment_id' => null,
                    ]);
                }
            }

            if ($locked->partner_voucher_id) {
                $partnerVoucher = PartnerVoucher::lockForUpdate()->find($locked->partner_voucher_id);
                if ($partnerVoucher && $partnerVoucher->redeemed_appointment_id === $locked->id) {
                    $partnerVoucher->update([
                        'status' => 'available',
                        'redeemed_at' => null,
                        'redeemed_appointment_id' => null,
                    ]);
                }
            }

            $entry = PartnerCommissionEntry::where('appointment_id', $locked->id)
                ->lockForUpdate()
                ->first();

            if ($entry && $entry->status !== 'paid') {
                $payoutId = $entry->payout_id;
                $entry->update([
                    'status' => 'voided',
                    'voided_at' => now(),
                    'void_reason' => $reason,
                    'payout_id' => null,
                ]);

                if ($payoutId) {
                    $payout = PartnerPayout::lockForUpdate()->find($payoutId);
                    if ($payout && $payout->status === 'draft') {
                        $this->recalculatePayoutTotals($payout);
                    }
                }
            }

            return $locked->fresh();
        });
    }

    /**
     * Generate monthly draft corporate payouts for organizations meeting the minimum threshold.
     *
     * @return array{created_payouts: Collection<int, PartnerPayout>, rolled_over_partners: array<int, array{partner_id: string, partner_name: string, accrued_amount: int}>}
     */
    public function generateMonthlyPayouts(int $year, int $month): array
    {
        $periodStart = Carbon::create($year, $month, 1)->startOfMonth();
        $periodEnd = $periodStart->copy()->endOfMonth();
        $minPayout = (int) config('monetization.minimum_payout_uzs', 100000);

        $createdPayouts = collect();
        $rolledOver = [];

        $partners = PartnerOrganization::where('status', 'active')->get();

        foreach ($partners as $partner) {
            DB::transaction(function () use ($partner, $year, $month, $periodStart, $periodEnd, $minPayout, &$createdPayouts, &$rolledOver) {
                $entries = PartnerCommissionEntry::where('partner_organization_id', $partner->id)
                    ->where('status', 'accrued')
                    ->whereNull('payout_id')
                    ->where('accrued_at', '<=', $periodEnd)
                    ->lockForUpdate()
                    ->get();

                if ($entries->isEmpty()) {
                    return;
                }

                $totalCommission = (int) $entries->sum('partner_amount');

                if ($totalCommission < $minPayout) {
                    $rolledOver[] = [
                        'partner_id' => $partner->id,
                        'partner_name' => $partner->name,
                        'accrued_amount' => $totalCommission,
                    ];

                    return;
                }

                $payout = PartnerPayout::create([
                    'partner_organization_id' => $partner->id,
                    'period_year' => $year,
                    'period_month' => $month,
                    'period_start' => $periodStart->toDateString(),
                    'period_end' => $periodEnd->toDateString(),
                    'total_lessons_count' => $entries->count(),
                    'total_net_cash_gmv' => (int) $entries->sum('net_cash_basis'),
                    'total_commission_amount' => $totalCommission,
                    'status' => 'draft',
                ]);

                PartnerCommissionEntry::whereIn('id', $entries->pluck('id'))
                    ->update([
                        'payout_id' => $payout->id,
                        'status' => 'included_in_payout',
                    ]);

                $createdPayouts->push($payout->fresh(['partnerOrganization']));
            });
        }

        return [
            'created_payouts' => $createdPayouts,
            'rolled_over_partners' => $rolledOver,
        ];
    }

    /**
     * Mark a draft/invoiced monthly payout as settled via Didox & corporate bank transfer.
     */
    public function markPayoutPaid(
        PartnerPayout $payout,
        string $didoxDocumentId,
        ?string $paymentReference = null,
    ): PartnerPayout {
        return DB::transaction(function () use ($payout, $didoxDocumentId, $paymentReference) {
            $locked = PartnerPayout::lockForUpdate()->findOrFail($payout->id);

            $locked->update([
                'didox_document_id' => trim($didoxDocumentId),
                'payment_reference' => $paymentReference ? trim($paymentReference) : null,
                'status' => 'paid',
                'paid_at' => now(),
            ]);

            PartnerCommissionEntry::where('payout_id', $locked->id)
                ->where('status', '!=', 'voided')
                ->update(['status' => 'paid']);

            return $locked->fresh(['partnerOrganization']);
        });
    }

    protected function recalculatePayoutTotals(PartnerPayout $payout): void
    {
        $activeEntries = PartnerCommissionEntry::where('payout_id', $payout->id)
            ->where('status', '!=', 'voided')
            ->get();

        if ($activeEntries->isEmpty()) {
            $payout->update([
                'total_lessons_count' => 0,
                'total_net_cash_gmv' => 0,
                'total_commission_amount' => 0,
                'status' => 'cancelled',
            ]);

            return;
        }

        $payout->update([
            'total_lessons_count' => $activeEntries->count(),
            'total_net_cash_gmv' => (int) $activeEntries->sum('net_cash_basis'),
            'total_commission_amount' => (int) $activeEntries->sum('partner_amount'),
        ]);
    }
}

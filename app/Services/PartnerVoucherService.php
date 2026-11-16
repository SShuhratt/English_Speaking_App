<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\PartnerOrganization;
use App\Models\PartnerVoucher;
use App\Models\PartnerVoucherBatch;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class PartnerVoucherService
{
    /**
     * Create a Track B2 wholesale prepaid voucher batch and generate codes immediately if marked paid.
     *
     * @param  array{
     *     title: string,
     *     bundle_type?: string,
     *     lesson_duration_minutes?: int,
     *     max_lesson_price_uzs: int,
     *     unit_face_value_uzs: int,
     *     wholesale_discount_percent?: int,
     *     quantity: int,
     *     validity_days?: int,
     *     payment_status?: string,
     *     notes?: ?string,
     * }  $data
     */
    public function createBatch(PartnerOrganization $partner, array $data): PartnerVoucherBatch
    {
        $minDiscount = (int) config('monetization.voucher_min_wholesale_discount_percent', 10);
        $maxDiscount = (int) config('monetization.voucher_max_wholesale_discount_percent', 15);
        $discountPercent = max($minDiscount, min($maxDiscount, (int) ($data['wholesale_discount_percent'] ?? 15)));

        $minDays = (int) config('monetization.voucher_validity_min_days', 30);
        $maxDays = (int) config('monetization.voucher_validity_max_days', 90);
        $defaultDays = (int) config('monetization.voucher_default_validity_days', 60);
        $validityDays = max($minDays, min($maxDays, (int) ($data['validity_days'] ?? $defaultDays)));

        $unitFace = (int) $data['unit_face_value_uzs'];
        $unitWholesale = (int) round($unitFace * (100 - $discountPercent) / 100);
        $quantity = (int) $data['quantity'];
        $totalPaidUpfront = $unitWholesale * $quantity;
        $paymentStatus = $data['payment_status'] ?? 'pending';

        return DB::transaction(function () use ($partner, $data, $discountPercent, $validityDays, $unitFace, $unitWholesale, $quantity, $totalPaidUpfront, $paymentStatus) {
            $batch = PartnerVoucherBatch::create([
                'partner_organization_id' => $partner->id,
                'title' => trim($data['title']),
                'bundle_type' => $data['bundle_type'] ?? 'mock_speaking',
                'lesson_duration_minutes' => (int) ($data['lesson_duration_minutes'] ?? 30),
                'max_lesson_price_uzs' => (int) $data['max_lesson_price_uzs'],
                'unit_face_value_uzs' => $unitFace,
                'wholesale_discount_percent' => $discountPercent,
                'unit_wholesale_price_uzs' => $unitWholesale,
                'quantity' => $quantity,
                'total_paid_upfront_uzs' => $totalPaidUpfront,
                'payment_status' => 'pending',
                'valid_until' => now()->addDays($validityDays),
                'notes' => $data['notes'] ?? null,
            ]);

            if ($paymentStatus === 'paid') {
                $this->activatePaidBatch($batch);
            }

            return $batch->fresh(['vouchers', 'partnerOrganization']);
        });
    }

    /**
     * Mark a wholesale batch as paid and generate single-use voucher codes.
     */
    public function activatePaidBatch(PartnerVoucherBatch $batch): int
    {
        return DB::transaction(function () use ($batch) {
            $locked = PartnerVoucherBatch::lockForUpdate()->findOrFail($batch->id);

            $locked->update([
                'payment_status' => 'paid',
                'paid_at' => $locked->paid_at ?? now(),
            ]);

            $existingCount = PartnerVoucher::where('batch_id', $locked->id)->count();
            $toGenerate = max(0, $locked->quantity - $existingCount);

            for ($i = 0; $i < $toGenerate; $i++) {
                PartnerVoucher::create([
                    'batch_id' => $locked->id,
                    'partner_organization_id' => $locked->partner_organization_id,
                    'code' => $this->generateUniqueVoucherCode(),
                    'status' => 'available',
                ]);
            }

            return $toGenerate;
        });
    }

    /**
     * Validate a Track B2 bulk voucher code for single-lesson booking redemption.
     */
    public function validateForBooking(
        string $code,
        User $pupil,
        User $teacher,
        int $durationMinutes,
        int $lessonPrice,
        bool $isTrial = false,
    ): PartnerVoucher {
        $normalized = strtoupper(trim($code));

        /** @var PartnerVoucher|null $voucher */
        $voucher = PartnerVoucher::with(['batch', 'partnerOrganization'])
            ->where('code', $normalized)
            ->lockForUpdate()
            ->first();

        if (! $voucher) {
            throw ValidationException::withMessages([
                'voucher_code' => ['This voucher code is invalid.'],
            ]);
        }

        if ($voucher->status !== 'available' || $voucher->redeemed_appointment_id !== null) {
            throw ValidationException::withMessages([
                'voucher_code' => ['This institutional voucher has already been redeemed or voided.'],
            ]);
        }

        $batch = $voucher->batch;
        if (! $batch || ! $batch->isPaidAndValid()) {
            if ($batch && $batch->valid_until && $batch->valid_until->isPast()) {
                $voucher->update(['status' => 'expired']);
            }

            throw ValidationException::withMessages([
                'voucher_code' => ['This institutional voucher has expired or is not active yet.'],
            ]);
        }

        if ($voucher->claimed_by_user_id && $voucher->claimed_by_user_id !== $pupil->id) {
            throw ValidationException::withMessages([
                'voucher_code' => ['This voucher code is already claimed by another student.'],
            ]);
        }

        if ($isTrial) {
            throw ValidationException::withMessages([
                'voucher_code' => ['Institutional bulk vouchers cannot be applied to trial sessions.'],
            ]);
        }

        $teacherProfile = $teacher->teacherProfile;
        if (! $teacherProfile || ! $teacherProfile->accepts_institutional_vouchers) {
            throw ValidationException::withMessages([
                'voucher_code' => ['This teacher has not opted into institutional bulk voucher lessons.'],
            ]);
        }

        if ($durationMinutes > $batch->lesson_duration_minutes) {
            throw ValidationException::withMessages([
                'voucher_code' => ["This voucher covers up to {$batch->lesson_duration_minutes}-minute sessions."],
            ]);
        }

        if ($lessonPrice > $batch->max_lesson_price_uzs) {
            throw ValidationException::withMessages([
                'voucher_code' => ["This voucher is valid for lessons up to {$batch->max_lesson_price_uzs} UZS."],
            ]);
        }

        return $voucher;
    }

    /**
     * Redeem a validated voucher for a single appointment (never carries over to subsequent lessons).
     */
    public function redeemForAppointment(PartnerVoucher $voucher, User $pupil, Appointment $appointment): PartnerVoucher
    {
        $voucher->update([
            'claimed_by_user_id' => $voucher->claimed_by_user_id ?? $pupil->id,
            'claimed_at' => $voucher->claimed_at ?? now(),
            'redeemed_appointment_id' => $appointment->id,
            'redeemed_at' => now(),
            'status' => 'redeemed',
        ]);

        return $voucher->fresh();
    }

    /**
     * Refund a Track B2 voucher when an appointment is cancelled/rejected prior to start.
     */
    public function refundIfEligible(PartnerVoucher $voucher): void
    {
        $voucher->loadMissing('batch');
        $isExpired = $voucher->batch?->valid_until?->isPast() ?? false;

        $voucher->update([
            'status' => $isExpired ? 'expired' : 'available',
            'redeemed_appointment_id' => null,
            'redeemed_at' => null,
        ]);
    }

    /**
     * Expire stale available vouchers past their batch valid_until timestamp.
     */
    public function expireStaleVouchers(): int
    {
        $expiredBatchIds = PartnerVoucherBatch::where('valid_until', '<=', now())->pluck('id');
        if ($expiredBatchIds->isEmpty()) {
            return 0;
        }

        return PartnerVoucher::whereIn('batch_id', $expiredBatchIds)
            ->where('status', 'available')
            ->update(['status' => 'expired']);
    }

    protected function generateUniqueVoucherCode(): string
    {
        do {
            $code = 'B2-'.strtoupper(Str::random(4)).'-'.strtoupper(Str::random(4));
        } while (PartnerVoucher::where('code', $code)->exists());

        return $code;
    }
}

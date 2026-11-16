<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\PupilPackage;

class MonetizationCalculator
{
    /**
     * Resolve the configured gateway fee in basis points (100 bps = 1%).
     */
    public function resolveGatewayFeeBps(string $gatewayProvider = 'humo_p2p'): int
    {
        $providers = config('monetization.gateway_providers', []);

        if (array_key_exists($gatewayProvider, $providers)) {
            return (int) $providers[$gatewayProvider];
        }

        return (int) config('monetization.gateway_fee_bps', 200);
    }

    /**
     * Compute gateway fee deduction and 80 / 15 / 5 net cash revenue split.
     *
     * @return array{
     *     gross_amount: int,
     *     gateway_fee_bps: int,
     *     gateway_fee_amount: int,
     *     net_cash_amount: int,
     *     teacher_rate_bps: int,
     *     teacher_amount: int,
     *     platform_rate_bps: int,
     *     platform_amount: int,
     *     partner_rate_bps: int,
     *     partner_amount: int,
     * }
     */
    public function calculateBreakdown(
        int $grossAmount,
        string $gatewayProvider = 'humo_p2p',
        ?int $gatewayFeeBps = null,
        ?int $partnerRateBps = null,
    ): array {
        $gross = max(0, $grossAmount);
        $feeBps = $gatewayFeeBps ?? $this->resolveGatewayFeeBps($gatewayProvider);
        $feeAmount = (int) round(($gross * $feeBps) / 10000);
        $netCash = max(0, $gross - $feeAmount);

        $partnerBps = $partnerRateBps ?? (int) config('monetization.shares.partner_bps', 500);
        $teacherBps = (int) config('monetization.shares.teacher_bps', 8000);
        $platformBps = (int) config('monetization.shares.platform_bps', 1500);

        $partnerAmount = (int) round(($netCash * $partnerBps) / 10000);
        $teacherAmount = (int) round(($netCash * $teacherBps) / 10000);
        $platformAmount = max(0, $netCash - $teacherAmount - $partnerAmount);

        return [
            'gross_amount' => $gross,
            'gateway_fee_bps' => $feeBps,
            'gateway_fee_amount' => $feeAmount,
            'net_cash_amount' => $netCash,
            'teacher_rate_bps' => $teacherBps,
            'teacher_amount' => $teacherAmount,
            'platform_rate_bps' => $platformBps,
            'platform_amount' => $platformAmount,
            'partner_rate_bps' => $partnerBps,
            'partner_amount' => $partnerAmount,
        ];
    }

    /**
     * Compute Option A Safe Discount split for a single non-pack lesson with a platform XP/promo voucher.
     * The 2% gateway fee runs on actual cash collected, partner receives 5% of collected net cash, and
     * ConvoMate absorbs the promo subsidy from its platform margin so the teacher keeps their full 80% net share.
     *
     * @return array{
     *     original_gross_amount: int,
     *     gross_amount: int,
     *     gateway_fee_bps: int,
     *     gateway_fee_amount: int,
     *     net_cash_amount: int,
     *     teacher_rate_bps: int,
     *     teacher_amount: int,
     *     platform_rate_bps: int,
     *     platform_amount: int,
     *     partner_rate_bps: int,
     *     partner_amount: int,
     *     platform_subsidy_amount: int,
     * }
     */
    public function calculateSafeSingleLessonBreakdown(
        int $originalGross,
        int $discountedGross,
        string $gatewayProvider = 'humo_p2p',
        ?int $gatewayFeeBps = null,
        ?int $partnerRateBps = null,
    ): array {
        $origGross = max(0, $originalGross);
        $paidGross = max(0, $discountedGross);

        if ($paidGross >= $origGross || $origGross === 0) {
            return [
                'original_gross_amount' => $origGross ?: $paidGross,
                ...$this->calculateBreakdown($paidGross, $gatewayProvider, $gatewayFeeBps, $partnerRateBps),
                'platform_subsidy_amount' => 0,
            ];
        }

        $feeBps = $gatewayFeeBps ?? $this->resolveGatewayFeeBps($gatewayProvider);
        $feeAmount = (int) round(($paidGross * $feeBps) / 10000);
        $netCash = max(0, $paidGross - $feeAmount);

        $partnerBps = $partnerRateBps ?? (int) config('monetization.shares.partner_bps', 500);
        $teacherBps = (int) config('monetization.shares.teacher_bps', 8000);
        $platformBps = (int) config('monetization.shares.platform_bps', 1500);

        $partnerAmount = (int) round(($netCash * $partnerBps) / 10000);

        // Protect Teacher's 80% based on undiscounted net cash without allowing platform balance to go negative
        $undiscountedNet = max(0, $origGross - (int) round(($origGross * $feeBps) / 10000));
        $protectedTeacher = (int) round(($undiscountedNet * $teacherBps) / 10000);
        $maxDistributableToTeacher = max(0, $netCash - $partnerAmount);
        $teacherAmount = min($protectedTeacher, $maxDistributableToTeacher);
        $platformAmount = max(0, $netCash - $teacherAmount - $partnerAmount);

        return [
            'original_gross_amount' => $origGross,
            'gross_amount' => $paidGross,
            'gateway_fee_bps' => $feeBps,
            'gateway_fee_amount' => $feeAmount,
            'net_cash_amount' => $netCash,
            'teacher_rate_bps' => $teacherBps,
            'teacher_amount' => $teacherAmount,
            'platform_rate_bps' => $platformBps,
            'platform_amount' => $platformAmount,
            'partner_rate_bps' => $partnerBps,
            'partner_amount' => $partnerAmount,
            'platform_subsidy_amount' => max(0, $origGross - $paidGross),
        ];
    }

    /**
     * Calculate pro-rata gross value for a single lesson delivered from a PupilPackage.
     */
    public function calculatePackageLessonGross(PupilPackage $package, Appointment $appointment): int
    {
        $totalMinutes = (int) $package->total_minutes;
        $lessonMinutes = (int) $appointment->duration_minutes;

        if ($totalMinutes <= 0 || $lessonMinutes <= 0) {
            return 0;
        }

        $packageGross = (int) ($package->gross_amount ?? $package->price_paid);
        if ($packageGross <= 0) {
            return 0;
        }

        return (int) round(($packageGross * $lessonMinutes) / $totalMinutes);
    }
}

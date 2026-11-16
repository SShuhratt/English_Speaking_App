<?php

namespace App\Services;

use App\Models\PartnerOrganization;
use App\Models\PartnerPass;
use App\Models\PartnerPassBatch;
use App\Models\PlatformSetting;
use App\Models\User;
use Carbon\Carbon;
use Carbon\CarbonInterface;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class PartnerPassService
{
    public function __construct(
        protected MonetizationCalculator $calculator,
        protected PartnerCommissionService $commissionService,
    ) {}

    /**
     * @return array{
     *     partner_pass_b2c_price_uzs: int,
     *     partner_pass_b2b_default_price_uzs: int,
     *     partner_pass_b2b_min_price_uzs: int,
     *     partner_pass_default_days: int,
     *     p2p_free_daily_minutes: int,
     *     p2p_attributed_daily_minutes: int,
     * }
     */
    public function getPricingConfig(): array
    {
        return PlatformSetting::monetizationConfig();
    }

    /**
     * Persist Admin-configurable Partner Pass & P2P quota settings.
     */
    public function updatePricingConfig(array $data, ?string $updatedBy = null): array
    {
        $mapping = [
            'partner_pass_b2c_price_uzs',
            'partner_pass_b2b_default_price_uzs',
            'partner_pass_b2b_min_price_uzs',
            'partner_pass_default_days',
            'p2p_free_daily_minutes',
            'p2p_attributed_daily_minutes',
        ];

        foreach ($mapping as $key) {
            if (array_key_exists($key, $data)) {
                PlatformSetting::setValue($key, (int) $data[$key], 'integer', $updatedBy);
            }
        }

        return $this->getPricingConfig();
    }

    /**
     * Create a B2B wholesale Partner Pass batch for an organization and issue activation codes if marked paid.
     */
    public function createB2bBatch(PartnerOrganization $partner, array $data): PartnerPassBatch
    {
        $config = $this->getPricingConfig();
        $retailPrice = $config['partner_pass_b2c_price_uzs'];
        $minWholesale = $config['partner_pass_b2b_min_price_uzs'];
        $unitWholesale = (int) ($data['unit_wholesale_price_uzs'] ?? $config['partner_pass_b2b_default_price_uzs']);

        if ($unitWholesale < $minWholesale) {
            throw ValidationException::withMessages([
                'unit_wholesale_price_uzs' => ["Wholesale price per seat cannot be below the configured floor ({$minWholesale} UZS)."],
            ]);
        }

        $quantity = (int) $data['quantity'];
        $durationDays = (int) ($data['duration_days'] ?? $config['partner_pass_default_days']);
        $paymentStatus = $data['payment_status'] ?? 'pending';

        return DB::transaction(function () use ($partner, $data, $retailPrice, $unitWholesale, $quantity, $durationDays, $paymentStatus) {
            $batch = PartnerPassBatch::create([
                'partner_organization_id' => $partner->id,
                'title' => trim($data['title']),
                'duration_days' => $durationDays,
                'unit_retail_price_uzs' => $retailPrice,
                'unit_wholesale_price_uzs' => $unitWholesale,
                'quantity' => $quantity,
                'total_paid_upfront_uzs' => $unitWholesale * $quantity,
                'payment_status' => 'pending',
                'notes' => $data['notes'] ?? null,
            ]);

            if ($paymentStatus === 'paid') {
                $this->activatePaidBatch($batch);
            }

            return $batch->fresh(['passes', 'partnerOrganization']);
        });
    }

    /**
     * Mark a Partner Pass wholesale batch paid and mint single-use PASS-XXXXXX activation codes.
     */
    public function activatePaidBatch(PartnerPassBatch $batch): int
    {
        return DB::transaction(function () use ($batch) {
            $locked = PartnerPassBatch::lockForUpdate()->findOrFail($batch->id);

            $locked->update([
                'payment_status' => 'paid',
                'paid_at' => $locked->paid_at ?? now(),
            ]);

            $existingCount = PartnerPass::where('batch_id', $locked->id)->count();
            $toGenerate = max(0, $locked->quantity - $existingCount);

            for ($i = 0; $i < $toGenerate; $i++) {
                PartnerPass::create([
                    'batch_id' => $locked->id,
                    'partner_organization_id' => $locked->partner_organization_id,
                    'activation_code' => $this->generateUniquePassCode(),
                    'source' => 'b2b_wholesale',
                    'duration_days' => $locked->duration_days,
                    'gross_amount' => 0,
                    'gateway_provider' => 'wholesale_bundle',
                    'gateway_fee_bps' => 0,
                    'gateway_fee_amount' => 0,
                    'net_cash_amount' => 0,
                    'payment_status' => 'paid',
                    'status' => 'unclaimed',
                ]);
            }

            return $toGenerate;
        });
    }

    /**
     * Redeem an unclaimed B2B Partner Pass activation code onto a pupil's account.
     * Accrues zero extra Track A commission (wholesale margin was applied upfront).
     */
    public function redeemCode(User $pupil, string $code): PartnerPass
    {
        if ($pupil->role !== 'pupil' && $pupil->role !== null) {
            throw ValidationException::withMessages([
                'pass_code' => ['Only student accounts can activate a Partner Pass.'],
            ]);
        }

        $normalized = strtoupper(trim($code));

        return DB::transaction(function () use ($pupil, $normalized) {
            /** @var PartnerPass|null $pass */
            $pass = PartnerPass::with('batch')
                ->where('activation_code', $normalized)
                ->lockForUpdate()
                ->first();

            if (! $pass || $pass->source !== 'b2b_wholesale') {
                throw ValidationException::withMessages([
                    'pass_code' => ['Partner Pass code is invalid.'],
                ]);
            }

            if ($pass->payment_status !== 'paid' || $pass->batch?->payment_status !== 'paid') {
                throw ValidationException::withMessages([
                    'pass_code' => ['This Partner Pass batch has not been activated yet.'],
                ]);
            }

            if ($pass->status !== 'unclaimed' || $pass->user_id !== null) {
                throw ValidationException::withMessages([
                    'pass_code' => ['This Partner Pass code has already been redeemed.'],
                ]);
            }

            $baseStart = $this->resolveExtensionBaseDate($pupil);
            $expiresAt = $baseStart->copy()->addDays($pass->duration_days);

            $pass->update([
                'user_id' => $pupil->id,
                'status' => 'active',
                'activated_at' => now(),
                'expires_at' => $expiresAt,
            ]);

            return $pass->fresh(['partnerOrganization', 'batch']);
        });
    }

    /**
     * Create a direct B2C self-purchase Partner Pass order awaiting payment verification.
     */
    public function createRetailPurchase(User $pupil, string $gatewayProvider = 'humo_p2p'): PartnerPass
    {
        if ($pupil->role !== 'pupil') {
            throw ValidationException::withMessages([
                'partner_pass' => ['Only students can purchase a Partner Pass.'],
            ]);
        }

        $config = $this->getPricingConfig();
        $retailPrice = $config['partner_pass_b2c_price_uzs'];
        $durationDays = $config['partner_pass_default_days'];

        $breakdown = $this->calculator->calculateBreakdown($retailPrice, $gatewayProvider);
        $attribution = $pupil->partnerAttribution;

        return PartnerPass::create([
            'partner_organization_id' => $attribution?->partner_organization_id,
            'user_id' => $pupil->id,
            'source' => 'b2c_retail',
            'duration_days' => $durationDays,
            'gross_amount' => $breakdown['gross_amount'],
            'gateway_provider' => $gatewayProvider,
            'gateway_fee_bps' => $breakdown['gateway_fee_bps'],
            'gateway_fee_amount' => $breakdown['gateway_fee_amount'],
            'net_cash_amount' => $breakdown['net_cash_amount'],
            'payment_status' => 'verifying',
            'status' => 'pending_payment',
        ]);
    }

    /**
     * Confirm payment for a B2C retail Partner Pass, activate it, and accrue 5% partner share if attributed.
     */
    public function confirmRetailPurchase(PartnerPass $pass): PartnerPass
    {
        return DB::transaction(function () use ($pass) {
            /** @var PartnerPass $locked */
            $locked = PartnerPass::with('user')->lockForUpdate()->findOrFail($pass->id);

            if ($locked->status === 'active' && $locked->payment_status === 'paid') {
                return $locked;
            }

            $pupil = $locked->user;
            $baseStart = $pupil ? $this->resolveExtensionBaseDate($pupil) : now();
            $expiresAt = $baseStart->copy()->addDays($locked->duration_days);

            $locked->update([
                'payment_status' => 'paid',
                'status' => 'active',
                'activated_at' => now(),
                'expires_at' => $expiresAt,
            ]);

            $this->commissionService->accrueForRetailPartnerPass($locked->fresh());

            return $locked->fresh(['user', 'partnerOrganization', 'commissionEntry']);
        });
    }

    /**
     * Reject a pending B2C Partner Pass payment verification.
     */
    public function rejectRetailPurchase(PartnerPass $pass): PartnerPass
    {
        $pass->update([
            'payment_status' => 'rejected',
            'status' => 'revoked',
        ]);

        return $pass->fresh();
    }

    /**
     * Transition active Partner Passes whose expiry date has passed to 'expired'.
     */
    public function expireElapsedPasses(): int
    {
        return PartnerPass::where('status', 'active')
            ->where('expires_at', '<', now())
            ->update(['status' => 'expired']);
    }

    protected function resolveExtensionBaseDate(User $pupil): CarbonInterface
    {
        $latestExpiry = PartnerPass::where('user_id', $pupil->id)
            ->where('status', 'active')
            ->where('expires_at', '>', now())
            ->max('expires_at');

        return $latestExpiry ? Carbon::parse($latestExpiry) : now();
    }

    protected function generateUniquePassCode(): string
    {
        do {
            $code = 'PASS-'.strtoupper(Str::random(6));
        } while (PartnerPass::where('activation_code', $code)->exists());

        return $code;
    }
}

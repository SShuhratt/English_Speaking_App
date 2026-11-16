<?php

namespace App\Services;

use App\Models\PlatformSetting;
use App\Models\User;
use Illuminate\Support\Facades\Cache;

class P2pQuotaService
{
    /**
     * Resolve the student's current P2P daily tier and remaining speaking minutes.
     *
     * @return array{
     *     tier: string,
     *     unlimited: bool,
     *     daily_limit_minutes: ?int,
     *     used_seconds: int,
     *     remaining_seconds: ?int,
     *     remaining_minutes: ?int,
     *     partner_pass_expires_at: ?string,
     *     partner_name: ?string,
     * }
     */
    public function getQuotaSummary(User $user): array
    {
        $config = PlatformSetting::monetizationConfig();
        $usedSeconds = $this->getUsedSecondsToday($user->id);

        $activePass = $user->activePartnerPass();
        $attribution = $user->partnerAttribution()->with('partnerOrganization:id,name,status')->first();
        $hasActivePartner = $attribution && $attribution->partnerOrganization?->isActive();

        if ($activePass) {
            return [
                'tier' => 'partner_pass',
                'unlimited' => true,
                'daily_limit_minutes' => null,
                'used_seconds' => $usedSeconds,
                'remaining_seconds' => null,
                'remaining_minutes' => null,
                'partner_pass_expires_at' => $activePass->expires_at?->toIso8601String(),
                'partner_name' => $activePass->partnerOrganization?->name ?? $attribution?->partnerOrganization?->name,
            ];
        }

        $limitMinutes = $hasActivePartner
            ? $config['p2p_attributed_daily_minutes']
            : $config['p2p_free_daily_minutes'];
        $limitSeconds = max(0, $limitMinutes * 60);
        $remainingSeconds = max(0, $limitSeconds - $usedSeconds);

        return [
            'tier' => $hasActivePartner ? 'partner_attributed' : 'standard',
            'unlimited' => false,
            'daily_limit_minutes' => $limitMinutes,
            'used_seconds' => $usedSeconds,
            'remaining_seconds' => $remainingSeconds,
            'remaining_minutes' => (int) ceil($remainingSeconds / 60),
            'partner_pass_expires_at' => null,
            'partner_name' => $hasActivePartner ? $attribution->partnerOrganization->name : null,
        ];
    }

    /**
     * Check whether the user still has daily P2P quota available.
     *
     * @return array<string, mixed>
     */
    public function checkAllowance(User $user): array
    {
        $summary = $this->getQuotaSummary($user);
        $allowed = $summary['unlimited'] || ($summary['remaining_seconds'] ?? 0) > 0;

        return [
            'allowed' => $allowed,
            ...$summary,
        ];
    }

    /**
     * Record elapsed speaking seconds for today and return updated allowance.
     *
     * @return array<string, mixed>
     */
    public function recordUsageSeconds(User $user, int $seconds): array
    {
        if ($seconds > 0) {
            $key = $this->dailyCacheKey($user->id);
            $current = (int) Cache::get($key, 0);
            Cache::put($key, $current + $seconds, now()->endOfDay()->addHours(2));
        }

        return $this->checkAllowance($user);
    }

    public function getUsedSecondsToday(string $userId): int
    {
        return (int) Cache::get($this->dailyCacheKey($userId), 0);
    }

    protected function dailyCacheKey(string $userId): string
    {
        return "p2p_daily_seconds:{$userId}:".now()->toDateString();
    }
}

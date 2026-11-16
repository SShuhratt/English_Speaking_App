<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\PartnerAttribution;
use App\Models\PartnerOrganization;
use App\Models\PupilPackage;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class PartnerAttributionService
{
    public const SESSION_KEY = 'partner_referral_code';

    public const SESSION_CAPTURED_AT_KEY = 'partner_referral_captured_at';

    /**
     * Find an active partner organization by partner code (case-insensitive).
     */
    public function findActiveOrganizationByCode(?string $code): ?PartnerOrganization
    {
        $normalized = strtoupper(trim((string) $code));
        if ($normalized === '') {
            return null;
        }

        return PartnerOrganization::where('partner_code', $normalized)
            ->where('status', 'active')
            ->first();
    }

    /**
     * Capture a partner code into the web session when a query code matches an active partner center.
     */
    public function captureFromRequest(Request $request): ?PartnerOrganization
    {
        $rawCode = $request->query('partner') ?? $request->query('ref');
        if (! is_string($rawCode) || trim($rawCode) === '') {
            return null;
        }

        $partner = $this->findActiveOrganizationByCode($rawCode);
        if (! $partner) {
            return null;
        }

        $request->session()->put(self::SESSION_KEY, $partner->partner_code);
        $request->session()->put(self::SESSION_CAPTURED_AT_KEY, now()->toIso8601String());

        return $partner;
    }

    /**
     * Generate a unique uppercase partner code for a new organization.
     */
    public function generateUniquePartnerCode(string $organizationName): string
    {
        $alpha = preg_replace('/[^A-Z0-9]/', '', strtoupper($organizationName)) ?: 'PARTNER';
        $prefix = substr($alpha, 0, 5);

        do {
            $candidate = $prefix.strtoupper(Str::random(3));
            $exists = PartnerOrganization::where('partner_code', $candidate)->exists()
                || User::where('referral_code', $candidate)->exists();
        } while ($exists);

        return $candidate;
    }

    /**
     * Attribute a newly registered pupil to an active partner organization within the configured window.
     */
    public function attributeNewPupil(
        User $pupil,
        ?string $code,
        string $source = 'referral_link',
        bool $strict = false,
    ): ?PartnerAttribution {
        $partner = $this->findActiveOrganizationByCode($code);

        if (! $partner) {
            if ($strict) {
                throw ValidationException::withMessages([
                    'partner_code' => ['Partner center code is invalid or inactive.'],
                ]);
            }

            return null;
        }

        if ($pupil->role !== 'pupil' && $pupil->role !== null) {
            if ($strict) {
                throw ValidationException::withMessages([
                    'partner_code' => ['Only student accounts can be attributed to a partner learning center.'],
                ]);
            }

            return null;
        }

        if ($pupil->partnerAttribution()->exists()) {
            if ($strict) {
                throw ValidationException::withMessages([
                    'partner_code' => ['This account is already linked to a partner learning center.'],
                ]);
            }

            return $pupil->partnerAttribution;
        }

        $windowHours = (int) config('monetization.attribution_window_hours', 24);
        if ($pupil->created_at && $pupil->created_at->lt(now()->subHours($windowHours))) {
            if ($strict) {
                throw ValidationException::withMessages([
                    'partner_code' => ["Partner codes can only be applied within {$windowHours} hours of registration."],
                ]);
            }

            return null;
        }

        $hasPriorActivity = Appointment::where('pupil_id', $pupil->id)->exists()
            || PupilPackage::where('pupil_id', $pupil->id)->exists();

        if ($hasPriorActivity) {
            if ($strict) {
                throw ValidationException::withMessages([
                    'partner_code' => ['Existing customers with prior bookings or packages cannot be retroactively attributed.'],
                ]);
            }

            return null;
        }

        return PartnerAttribution::create([
            'partner_organization_id' => $partner->id,
            'pupil_id' => $pupil->id,
            'attribution_source' => $source,
            'partner_code_used' => $partner->partner_code,
            'attributed_at' => now(),
        ]);
    }
}

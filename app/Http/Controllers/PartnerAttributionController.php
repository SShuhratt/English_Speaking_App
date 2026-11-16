<?php

namespace App\Http\Controllers;

use App\Services\PartnerAttributionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class PartnerAttributionController extends Controller
{
    public function __construct(
        protected PartnerAttributionService $attributionService
    ) {}

    /**
     * Allow a newly registered pupil (within 24 hours & before any booking/package) to bind a partner promo code once.
     */
    public function applyCode(Request $request): JsonResponse|RedirectResponse
    {
        $validated = $request->validate([
            'partner_code' => ['required', 'string', 'max:32'],
        ]);

        $attribution = $this->attributionService->attributeNewPupil(
            pupil: $request->user(),
            code: $validated['partner_code'],
            source: 'post_signup_code',
            strict: true,
        );

        $partnerName = $attribution?->partnerOrganization?->name ?? 'Partner Center';

        if ($request->wantsJson() && ! $request->hasHeader('X-Inertia')) {
            return response()->json([
                'message' => "Account linked to {$partnerName}.",
                'attribution' => $attribution->load('partnerOrganization:id,name,partner_code'),
            ]);
        }

        return back()->with('success', "Account linked to {$partnerName}.");
    }
}

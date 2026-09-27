<?php

namespace App\Http\Controllers;

use App\Services\GamificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;

class GamificationController extends Controller
{
    /**
     * Acknowledge user's level-up ceremony to prevent repeat celebration popups.
     */
    public function acknowledgeLevel(Request $request): JsonResponse
    {
        $request->validate([
            'level' => ['required', 'integer', 'min:1', 'max:10'],
        ]);

        $user = $request->user();
        if (! $user) {
            return response()->json(['error' => 'Unauthenticated.'], 401);
        }

        $acknowledged = GamificationService::acknowledgeLevelUp($user, (int) $request->input('level'));

        return response()->json([
            'success' => true,
            'acknowledged' => $acknowledged,
        ]);
    }

    /**
     * Get user's referral and gamification stats.
     */
    public function referralStats(Request $request): JsonResponse
    {
        $user = $request->user();
        if (! $user) {
            return response()->json(['error' => 'Unauthenticated.'], 401);
        }

        return response()->json(GamificationService::getReferralStats($user));
    }

    /**
     * Get XP Store catalog and user's unredeemed discount vouchers.
     */
    public function storeCatalog(Request $request): JsonResponse
    {
        return response()->json(GamificationService::getXpStoreCatalog($request->user()));
    }

    /**
     * Redeem an item (streak shield, 10% voucher, 25% voucher) from the XP store.
     */
    public function redeem(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'item_key' => ['required', 'string', 'in:streak_shield,voucher_10,voucher_25'],
        ]);

        $user = $request->user();
        if (! $user) {
            return response()->json(['error' => 'Unauthenticated.'], 401);
        }

        $result = GamificationService::redeemStoreItem($user, $validated['item_key']);

        if (! ($result['success'] ?? false)) {
            return response()->json($result, 422);
        }

        return response()->json($result);
    }

    /**
     * Apply a discount voucher to an appointment.
     */
    public function applyVoucher(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'voucher_id' => ['required', 'uuid', 'exists:user_discount_vouchers,id'],
        ]);

        $user = $request->user();
        if (! $user) {
            return response()->json(['error' => 'Unauthenticated.'], 401);
        }

        $result = GamificationService::applyVoucherToAppointment($user, $validated['voucher_id'], $id);

        if (! ($result['success'] ?? false)) {
            return response()->json($result, 422);
        }

        return response()->json($result);
    }

    /**
     * View public verified fluency credential.
     */
    public function showCredential(string $id)
    {
        $credential = GamificationService::getVerifiedFluencyCredential($id);

        if (! $credential) {
            abort(404, 'Verified fluency credential not found.');
        }

        return Inertia::render('credential', [
            'credential' => $credential,
        ]);
    }
}

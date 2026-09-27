<?php

namespace App\Http\Controllers;

use App\Services\GamificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

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
}

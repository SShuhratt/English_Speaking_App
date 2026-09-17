<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Services\Telegram\TelegramService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TelegramSettingsController extends Controller
{
    public function __construct(
        protected TelegramService $telegramService
    ) {}

    /**
     * Get or generate a deep link to start the Telegram bot from the website.
     */
    public function deepLink(Request $request): JsonResponse
    {
        $user = $request->user();
        $deepLink = $this->telegramService->generateDeepLink($user);

        return response()->json([
            'deep_link' => $deepLink,
        ]);
    }

    /**
     * Generate or fetch the current 6-digit pairing code.
     */
    public function pairingCode(Request $request): JsonResponse
    {
        $user = $request->user();
        $code = $user->generateTelegramPairingCode();

        return response()->json([
            'code' => $code,
            'expires_in_minutes' => 15,
        ]);
    }

    /**
     * Disconnect Telegram from user's account.
     */
    public function unlink(Request $request): RedirectResponse
    {
        $user = $request->user();
        $user->unlinkTelegram();

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Telegram account disconnected.',
        ]);

        return back();
    }
}

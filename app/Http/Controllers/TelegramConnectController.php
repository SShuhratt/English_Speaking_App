<?php

namespace App\Http\Controllers;

use App\Services\Telegram\TelegramService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TelegramConnectController extends Controller
{
    public function __construct(
        protected TelegramService $telegramService
    ) {}

    /**
     * Connect Telegram account via signed magic link (Mechanism C).
     */
    public function __invoke(Request $request): RedirectResponse
    {
        if (! $request->hasValidSignature()) {
            abort(403, 'This Telegram connection link has expired or has an invalid signature.');
        }

        $chatId = (string) $request->query('chat_id');
        if (empty($chatId)) {
            return redirect()->route('profile.edit')->with('error', 'Invalid Telegram chat identifier.');
        }

        $user = $request->user();
        if (! $user) {
            // If somehow reached without user, redirect to login
            return redirect()->guest(route('login'));
        }

        $user->update([
            'telegram_chat_id' => $chatId,
        ]);

        // Send confirmation in Telegram chat
        $this->telegramService->sendMessage(
            $chatId,
            "✅ <b>Account Linked Successfully!</b>\n\n".
            "Welcome, <b>{$user->full_name}</b>. You will now receive instant notifications about your bookings, approvals, and lesson reminders here."
        );

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Telegram account linked successfully! You will now receive instant lesson notifications.',
        ]);

        return redirect()->route('profile.edit')->with('status', 'telegram-connected');
    }
}

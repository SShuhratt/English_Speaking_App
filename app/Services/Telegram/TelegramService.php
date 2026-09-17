<?php

namespace App\Services\Telegram;

use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\URL;

class TelegramService
{
    protected ?string $token;

    protected string $botUsername;

    public function __construct()
    {
        $this->token = config('services.telegram.bot_token');
        $this->botUsername = config('services.telegram.bot_username', 'EnglishSpeakingBot');
    }

    /**
     * Send message via Telegram Bot API.
     */
    public function sendMessage(string $chatId, string $text, ?array $replyMarkup = null, string $parseMode = 'HTML'): bool
    {
        if (empty($this->token)) {
            Log::info("Telegram notification skipped (no token configured). Chat ID: {$chatId}, Message: {$text}");

            return true;
        }

        try {
            $payload = [
                'chat_id' => $chatId,
                'text' => $text,
                'parse_mode' => $parseMode,
                'disable_web_page_preview' => false,
            ];

            if ($replyMarkup) {
                $payload['reply_markup'] = json_encode($replyMarkup);
            }

            $response = Http::timeout(10)->post("https://api.telegram.org/bot{$this->token}/sendMessage", $payload);

            if ($response->successful()) {
                return true;
            }

            Log::warning("Telegram API error: {$response->status()} - {$response->body()} for chat ID: {$chatId}");

            return false;
        } catch (\Throwable $e) {
            Log::error("Failed to send Telegram message to chat {$chatId}: ".$e->getMessage());

            return false;
        }
    }

    /**
     * Generate a temporary signed web URL for Mechanism C (Magic Link).
     */
    public function generateSignedConnectUrl(string $chatId): string
    {
        return URL::temporarySignedRoute(
            'telegram.connect',
            now()->addMinutes(15),
            ['chat_id' => $chatId]
        );
    }

    /**
     * Generate deep link URL for connecting from the website.
     */
    public function generateDeepLink(User $user): string
    {
        $token = bin2hex(random_bytes(16));
        Cache::put("telegram_link_token:{$token}", $user->id, now()->addMinutes(15));

        return "https://t.me/{$this->botUsername}?start={$token}";
    }

    /**
     * Send welcome prompt offering Dual Approach (Signed Link + 6-Digit Code) for direct Telegram starts.
     */
    public function sendWelcomePrompt(string $chatId): bool
    {
        $signedUrl = $this->generateSignedConnectUrl($chatId);

        $text = "👋 <b>Welcome to ConvoMate!</b>\n\n".
            "To connect this Telegram chat to your account and receive instant lesson alerts:\n\n".
            "1️⃣ <b>Fastest:</b> Tap the button below to link directly with your browser session.\n".
            '2️⃣ <b>Or:</b> Reply to this message with your <b>6-digit code</b> from your website profile settings.';

        $replyMarkup = [
            'inline_keyboard' => [
                [
                    ['text' => '🔗 Link My Account', 'url' => $signedUrl],
                ],
            ],
        ];

        return $this->sendMessage($chatId, $text, $replyMarkup);
    }

    /**
     * Link account using the deep-link token from the website.
     */
    public function linkByToken(string $token, string $chatId, ?string $username = null): ?User
    {
        $userId = Cache::pull("telegram_link_token:{$token}");
        if (! $userId) {
            return null;
        }

        $user = User::find($userId);
        if ($user) {
            $this->linkUser($user, $chatId, $username);

            return $user;
        }

        return null;
    }

    /**
     * Link account using the 6-digit code (Mechanism B).
     */
    public function linkByCode(string $code, string $chatId, ?string $username = null): ?User
    {
        $cleanCode = preg_replace('/\s+/', '', $code);
        $userId = Cache::pull("telegram_pairing:{$cleanCode}");
        if (! $userId) {
            return null;
        }

        Cache::forget("user_telegram_code:{$userId}");

        $user = User::find($userId);
        if ($user) {
            $this->linkUser($user, $chatId, $username);

            return $user;
        }

        return null;
    }

    /**
     * Associate Telegram chat with user and send confirmation.
     */
    public function linkUser(User $user, string $chatId, ?string $username = null): void
    {
        $user->update([
            'telegram_chat_id' => $chatId,
            'telegram_username' => $username,
        ]);

        $this->sendMessage(
            $chatId,
            "✅ <b>Account Linked Successfully!</b>\n\n".
            "Welcome, <b>{$user->full_name}</b>. You will now receive instant notifications about your booking requests, approvals, and lesson reminders here."
        );
    }
}

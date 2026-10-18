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

    protected TelegramLocaleService $localeService;

    public function __construct(?TelegramLocaleService $localeService = null)
    {
        $this->token = config('services.telegram.bot_token');
        $this->botUsername = config('services.telegram.bot_username', 'EnglishSpeakingBot');
        $this->localeService = $localeService ?: app(TelegramLocaleService::class);
    }

    /**
     * Answer Telegram callback query (dismiss loading spinner on buttons).
     */
    public function answerCallbackQuery(string $callbackQueryId, ?string $text = null, bool $showAlert = false): bool
    {
        if (empty($this->token)) {
            return true;
        }

        try {
            $payload = [
                'callback_query_id' => $callbackQueryId,
                'show_alert' => $showAlert,
            ];
            if ($text !== null) {
                $payload['text'] = $text;
            }

            $response = Http::timeout(10)->post("https://api.telegram.org/bot{$this->token}/answerCallbackQuery", $payload);

            return $response->successful();
        } catch (\Throwable $e) {
            Log::warning('Failed to answer Telegram callback query: '.$e->getMessage());

            return false;
        }
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
                if (isset($replyMarkup['inline_keyboard']) && is_array($replyMarkup['inline_keyboard'])) {
                    $sanitizedKeyboard = [];
                    foreach ($replyMarkup['inline_keyboard'] as $row) {
                        $sanitizedRow = [];
                        foreach ($row as $button) {
                            if (isset($button['url']) && ! str_starts_with($button['url'], 'https://') && ! str_starts_with($button['url'], 'tg://')) {
                                continue;
                            }
                            $sanitizedRow[] = $button;
                        }
                        if (! empty($sanitizedRow)) {
                            $sanitizedKeyboard[] = $sanitizedRow;
                        }
                    }
                    if (empty($sanitizedKeyboard)) {
                        $replyMarkup = null;
                    } else {
                        $replyMarkup['inline_keyboard'] = $sanitizedKeyboard;
                    }
                }

                if ($replyMarkup) {
                    $payload['reply_markup'] = json_encode($replyMarkup, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
                }
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
     * Send document via Telegram Bot API with streaming.
     */
    public function sendDocument(string $chatId, string $filePath, string $filename, string $caption = '', string $parseMode = 'HTML'): bool
    {
        if (empty($this->token)) {
            Log::info("Telegram document skipped (no token configured). Chat ID: {$chatId}, Filename: {$filename}");

            return true;
        }

        try {
            $handle = fopen($filePath, 'r');
            if (! $handle) {
                Log::error("Failed to open file for Telegram streaming: {$filePath}");

                return false;
            }

            $response = Http::timeout(60)
                ->attach('document', $handle, $filename)
                ->post("https://api.telegram.org/bot{$this->token}/sendDocument", [
                    'chat_id' => $chatId,
                    'caption' => $caption,
                    'parse_mode' => $parseMode,
                ]);

            if (is_resource($handle)) {
                fclose($handle);
            }

            if ($response->successful()) {
                return true;
            }

            Log::warning("Telegram sendDocument error: {$response->status()} - {$response->body()} for chat ID: {$chatId}");

            return false;
        } catch (\Throwable $e) {
            Log::error("Failed to send Telegram document to chat {$chatId}: ".$e->getMessage());

            return false;
        }
    }

    /**
     * Send photo via Telegram Bot API with streaming.
     */
    public function sendPhoto(string $chatId, string $filePath, string $filename, string $caption = '', string $parseMode = 'HTML'): bool
    {
        if (empty($this->token)) {
            Log::info("Telegram photo skipped (no token configured). Chat ID: {$chatId}, Filename: {$filename}");

            return true;
        }

        try {
            $handle = fopen($filePath, 'r');
            if (! $handle) {
                Log::error("Failed to open photo for Telegram streaming: {$filePath}");

                return false;
            }

            $response = Http::timeout(60)
                ->attach('photo', $handle, $filename)
                ->post("https://api.telegram.org/bot{$this->token}/sendPhoto", [
                    'chat_id' => $chatId,
                    'caption' => $caption,
                    'parse_mode' => $parseMode,
                ]);

            if (is_resource($handle)) {
                fclose($handle);
            }

            if ($response->successful()) {
                return true;
            }

            Log::warning("Telegram sendPhoto error: {$response->status()} - {$response->body()} for chat ID: {$chatId}. Falling back to sendDocument.");

            // Fallback to sendDocument if photo format rejected by Telegram
            return $this->sendDocument($chatId, $filePath, $filename, $caption, $parseMode);
        } catch (\Throwable $e) {
            Log::error("Failed to send Telegram photo to chat {$chatId}: ".$e->getMessage());

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
    public function sendWelcomePrompt(string $chatId, ?string $locale = null): bool
    {
        $resolvedLocale = $locale ?: $this->localeService->resolveLocale(null, $chatId);
        $signedUrl = $this->generateSignedConnectUrl($chatId);
        $prompt = $this->localeService->getWelcomePrompt($signedUrl, $resolvedLocale);

        return $this->sendMessage($chatId, $prompt['text'], $prompt['reply_markup']);
    }

    /**
     * Link account using the deep-link token from the website.
     */
    public function linkByToken(string $token, string $chatId, ?string $username = null, ?string $locale = null): ?User
    {
        $userId = Cache::pull("telegram_link_token:{$token}");
        if (! $userId) {
            return null;
        }

        $user = User::find($userId);
        if ($user) {
            $this->linkUser($user, $chatId, $username, $locale);

            return $user;
        }

        return null;
    }

    /**
     * Link account using the 6-digit code (Mechanism B).
     */
    public function linkByCode(string $code, string $chatId, ?string $username = null, ?string $locale = null): ?User
    {
        $cleanCode = preg_replace('/\s+/', '', $code);
        $userId = Cache::pull("telegram_pairing:{$cleanCode}");
        if (! $userId) {
            return null;
        }

        Cache::forget("user_telegram_code:{$userId}");

        $user = User::find($userId);
        if ($user) {
            $this->linkUser($user, $chatId, $username, $locale);

            return $user;
        }

        return null;
    }

    /**
     * Associate Telegram chat with user and send confirmation.
     */
    public function linkUser(User $user, string $chatId, ?string $username = null, ?string $locale = null): void
    {
        $resolvedLocale = $locale ?: $this->localeService->resolveLocale($user, $chatId);
        $user->update([
            'telegram_chat_id' => $chatId,
            'telegram_username' => $username,
            'telegram_locale' => $resolvedLocale,
        ]);

        $text = $this->localeService->getLinkSuccessMessage($user->full_name, $resolvedLocale);
        $this->sendMessage($chatId, $text);
    }

    /**
     * Set persistent bot chat menu button to launch the Telegram Mini App.
     */
    public function setMenuButton(?string $url = null, string $text = 'Open ConvoMate'): bool
    {
        if (empty($this->token)) {
            Log::info('Telegram setChatMenuButton skipped: no token configured.');

            return false;
        }

        $appUrl = $url ?? rtrim(config('app.url'), '/');

        try {
            $payload = [
                'menu_button' => [
                    'type' => 'web_app',
                    'text' => $text,
                    'web_app' => [
                        'url' => $appUrl,
                    ],
                ],
            ];

            $response = Http::timeout(10)->post("https://api.telegram.org/bot{$this->token}/setChatMenuButton", $payload);

            if ($response->successful()) {
                Log::info("Telegram chat menu button configured to {$appUrl}");

                return true;
            }

            Log::warning("Telegram setChatMenuButton failed: {$response->status()} - {$response->body()}");

            return false;
        } catch (\Throwable $e) {
            Log::error('Exception while configuring Telegram chat menu button: '.$e->getMessage());

            return false;
        }
    }

    /**
     * Download binary file content from Telegram API.
     */
    public function downloadFile(string $fileId): ?string
    {
        if (empty($this->token)) {
            return null;
        }

        try {
            $infoResponse = Http::timeout(10)->get("https://api.telegram.org/bot{$this->token}/getFile", [
                'file_id' => $fileId,
            ]);

            if (! $infoResponse->successful()) {
                return null;
            }

            $filePath = $infoResponse->json('result.file_path');
            if (! $filePath) {
                return null;
            }

            $downloadResponse = Http::timeout(15)->get("https://api.telegram.org/file/bot{$this->token}/{$filePath}");

            if ($downloadResponse->successful()) {
                return $downloadResponse->body();
            }

            return null;
        } catch (\Throwable $e) {
            Log::warning('TelegramService failed to download file: '.$e->getMessage());

            return null;
        }
    }
}

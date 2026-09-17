<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\Telegram\TelegramService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class TelegramWebhookController extends Controller
{
    public function __construct(
        protected TelegramService $telegramService
    ) {}

    /**
     * Handle incoming updates from Telegram Webhook.
     */
    public function __invoke(Request $request): JsonResponse
    {
        $message = $request->input('message');

        if (! $message || ! isset($message['chat']['id'])) {
            return response()->json(['ok' => true]);
        }

        $chatId = (string) $message['chat']['id'];
        $username = $message['from']['username'] ?? null;
        $text = trim($message['text'] ?? '');

        try {
            if (str_starts_with($text, '/start')) {
                $parts = explode(' ', $text, 2);
                $token = isset($parts[1]) ? trim($parts[1]) : '';

                if (! empty($token)) {
                    // Deep link token received from website
                    $user = $this->telegramService->linkByToken($token, $chatId, $username);

                    if (! $user) {
                        $this->telegramService->sendMessage(
                            $chatId,
                            "⚠️ <b>This connection link has expired or is invalid.</b>\n\n".
                            'Please visit your profile settings on the website to generate a new link or a 6-digit pairing code.'
                        );
                    }
                } else {
                    // Direct /start without token
                    $existingUser = User::where('telegram_chat_id', $chatId)->first();

                    if ($existingUser) {
                        $this->telegramService->sendMessage(
                            $chatId,
                            "👋 Hello, <b>{$existingUser->full_name}</b>!\n\n".
                            'Your Telegram account is already connected to ConvoMate. You will receive real-time lesson alerts right here.'
                        );
                    } else {
                        $this->telegramService->sendWelcomePrompt($chatId);
                    }
                }

                return response()->json(['ok' => true]);
            }

            // Check if message is a 6-digit code
            if (preg_match('/^\d{6}$/', $text)) {
                $user = $this->telegramService->linkByCode($text, $chatId, $username);

                if (! $user) {
                    $this->telegramService->sendMessage(
                        $chatId,
                        "⚠️ <b>Invalid or expired code.</b>\n\n".
                        'The 6-digit code you entered could not be verified. Please visit your profile settings on the website to generate a fresh pairing code.'
                    );
                }

                return response()->json(['ok' => true]);
            }

            // Fallback for any other message
            $existingUser = User::where('telegram_chat_id', $chatId)->first();
            if ($existingUser) {
                $this->telegramService->sendMessage(
                    $chatId,
                    "👋 Hello <b>{$existingUser->full_name}</b>! Your account is connected.\n\n".
                    'You will receive all lesson requests, confirmations, and pre-session links automatically here.'
                );
            } else {
                $this->telegramService->sendWelcomePrompt($chatId);
            }
        } catch (\Throwable $e) {
            Log::error('Error processing Telegram webhook: '.$e->getMessage(), [
                'payload' => $request->all(),
            ]);
        }

        return response()->json(['ok' => true]);
    }
}

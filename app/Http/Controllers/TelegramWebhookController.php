<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\HumoPaymentService;
use App\Services\ReceiptOcrService;
use App\Services\Telegram\TelegramLocaleService;
use App\Services\Telegram\TelegramService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class TelegramWebhookController extends Controller
{
    public function __construct(
        protected TelegramService $telegramService,
        protected HumoPaymentService $humoPaymentService,
        protected ReceiptOcrService $ocrService,
        protected TelegramLocaleService $localeService
    ) {}

    /**
     * Handle incoming updates from Telegram Webhook.
     */
    public function __invoke(Request $request): JsonResponse
    {
        // 1. Handle Inline Keyboard Callbacks (e.g., Language Switcher)
        if ($request->has('callback_query')) {
            $callbackQuery = $request->input('callback_query');
            $callbackId = (string) ($callbackQuery['id'] ?? '');
            $chatId = (string) ($callbackQuery['message']['chat']['id'] ?? $callbackQuery['from']['id'] ?? '');
            $data = (string) ($callbackQuery['data'] ?? '');
            $existingUser = User::where('telegram_chat_id', $chatId)->first();

            if ($data === 'choose_lang') {
                $locale = $this->localeService->resolveLocale($existingUser, $chatId);
                $this->telegramService->sendMessage(
                    $chatId,
                    $this->localeService->getLanguagePrompt($locale),
                    $this->localeService->getLanguageInlineKeyboard()
                );
                $this->telegramService->answerCallbackQuery($callbackId);

                return response()->json(['ok' => true]);
            }

            if (str_starts_with($data, 'set_lang:')) {
                $newLocale = explode(':', $data, 2)[1] ?? TelegramLocaleService::DEFAULT_LOCALE;
                $savedLocale = $this->localeService->setLocale($newLocale, $existingUser, $chatId);

                $this->telegramService->sendMessage(
                    $chatId,
                    $this->localeService->getLanguageChangedMessage($savedLocale)
                );
                $this->telegramService->answerCallbackQuery($callbackId, 'Language updated!');

                return response()->json(['ok' => true]);
            }

            $this->telegramService->answerCallbackQuery($callbackId);

            return response()->json(['ok' => true]);
        }

        $message = $request->input('message');

        if (! $message || ! isset($message['chat']['id'])) {
            return response()->json(['ok' => true]);
        }

        $chatId = (string) $message['chat']['id'];
        $username = $message['from']['username'] ?? null;
        $text = trim($message['text'] ?? '');
        $tgLangCode = $message['from']['language_code'] ?? null;

        $existingUser = User::where('telegram_chat_id', $chatId)->first();
        $locale = $this->localeService->resolveLocale($existingUser, $chatId, $tgLangCode);

        try {
            // 2. Handle /lang or /language command
            if (str_starts_with($text, '/lang') || str_starts_with($text, '/language')) {
                $parts = preg_split('/\s+/', $text, 2);
                $targetLang = isset($parts[1]) ? strtolower(trim($parts[1])) : '';

                if (in_array($targetLang, TelegramLocaleService::SUPPORTED_LOCALES, true)) {
                    $savedLocale = $this->localeService->setLocale($targetLang, $existingUser, $chatId);
                    $this->telegramService->sendMessage(
                        $chatId,
                        $this->localeService->getLanguageChangedMessage($savedLocale)
                    );
                } else {
                    $this->telegramService->sendMessage(
                        $chatId,
                        $this->localeService->getLanguagePrompt($locale),
                        $this->localeService->getLanguageInlineKeyboard()
                    );
                }

                return response()->json(['ok' => true]);
            }

            // 3. Handle /start command
            if (str_starts_with($text, '/start')) {
                $parts = explode(' ', $text, 2);
                $token = isset($parts[1]) ? trim($parts[1]) : '';

                if (! empty($token)) {
                    // Deep link token received from website
                    $user = $this->telegramService->linkByToken($token, $chatId, $username, $locale);

                    if (! $user) {
                        $this->telegramService->sendMessage(
                            $chatId,
                            $this->localeService->getLinkExpiredMessage($locale)
                        );
                    }
                } else {
                    // Direct /start without token
                    if ($existingUser) {
                        $this->telegramService->sendMessage(
                            $chatId,
                            $this->localeService->getAlreadyConnectedMessage($existingUser->full_name, $locale)
                        );
                    } else {
                        $this->telegramService->sendWelcomePrompt($chatId, $locale);
                    }
                }

                return response()->json(['ok' => true]);
            }

            // 4. Check if message is a 6-digit pairing code
            if (preg_match('/^\d{6}$/', $text)) {
                $user = $this->telegramService->linkByCode($text, $chatId, $username, $locale);

                if (! $user) {
                    $this->telegramService->sendMessage(
                        $chatId,
                        $this->localeService->getInvalidCodeMessage($locale)
                    );
                }

                return response()->json(['ok' => true]);
            }

            // 5. Check if message contains a photo or document/PDF receipt
            $photos = $request->input('message.photo');
            $document = $request->input('message.document');

            if ((! empty($photos) && is_array($photos)) || (! empty($document) && is_array($document))) {
                if (! $existingUser) {
                    $signedUrl = $this->telegramService->generateSignedConnectUrl($chatId);
                    $prompt = $this->localeService->getReceiptUnlinkedMessage($signedUrl, $locale);

                    $this->telegramService->sendMessage(
                        $chatId,
                        $prompt['text'],
                        $prompt['reply_markup']
                    );

                    return response()->json(['ok' => true]);
                }

                $fileId = null;
                $mimeType = 'image/jpeg';
                $ext = 'jpg';

                if (! empty($photos) && is_array($photos)) {
                    $fileId = end($photos)['file_id'] ?? null;
                    $mimeType = 'image/jpeg';
                    $ext = 'jpg';
                } elseif (! empty($document) && is_array($document)) {
                    $fileId = $document['file_id'] ?? null;
                    $mimeType = $document['mime_type'] ?? 'application/pdf';
                    $ext = str_contains($mimeType, 'pdf') ? 'pdf' : 'jpg';
                }

                if ($fileId) {
                    $binary = $this->telegramService->downloadFile($fileId);
                    if ($binary) {
                        $tempPath = tempnam(sys_get_temp_dir(), 'tg_receipt_');
                        $tempFile = $tempPath.'.'.$ext;
                        rename($tempPath, $tempFile);

                        try {
                            file_put_contents($tempFile, $binary);
                            $parsedReceipt = $this->ocrService->parseFile($tempFile, $mimeType);

                            // Fallback to photo caption text if image OCR didn't detect amount
                            if (! $parsedReceipt && ! empty($message['caption'])) {
                                $parsedReceipt = $this->ocrService->parseText($message['caption']);
                            }

                            if ($parsedReceipt) {
                                $claim = $this->humoPaymentService->claimWithReceipt($existingUser, $parsedReceipt);
                                if ($claim['status'] === 'confirmed') {
                                    $this->telegramService->sendMessage(
                                        $chatId,
                                        $this->localeService->getReceiptConfirmedMessage($locale)
                                    );
                                } elseif ($claim['status'] === 'receipt_saved') {
                                    $this->telegramService->sendMessage(
                                        $chatId,
                                        $this->localeService->getReceiptSavedMessage($locale)
                                    );
                                } elseif ($claim['status'] === 'no_pending_booking') {
                                    $this->telegramService->sendMessage(
                                        $chatId,
                                        $this->localeService->getReceiptNoPendingBookingMessage($locale)
                                    );
                                } else {
                                    $this->telegramService->sendMessage(
                                        $chatId,
                                        $this->localeService->getReceiptUnrecognizedMessage($locale)
                                    );
                                }
                            } else {
                                $this->telegramService->sendMessage(
                                    $chatId,
                                    $this->localeService->getReceiptUnrecognizedMessage($locale)
                                );
                            }
                        } finally {
                            if (file_exists($tempFile)) {
                                @unlink($tempFile);
                            }
                        }

                        return response()->json(['ok' => true]);
                    }
                }
            }

            // 6. Check if message is a forwarded or pasted text receipt (Click, Payme, Uzum, or Humo SMS)
            $parsedTextReceipt = $this->ocrService->parseText($text);
            $parsedHumo = $this->humoPaymentService->parse($text);

            if ($parsedTextReceipt !== null || $parsedHumo !== null) {
                $isAdmin = $existingUser && $existingUser->role === 'admin';

                // If non-admin user submits a text receipt
                if (! $isAdmin) {
                    if ($existingUser) {
                        $claim = $this->humoPaymentService->claimWithReceipt(
                            $existingUser,
                            $parsedTextReceipt ?: $text
                        );

                        if ($claim['status'] === 'confirmed') {
                            $this->telegramService->sendMessage(
                                $chatId,
                                $this->localeService->getReceiptConfirmedMessage($locale)
                            );

                            return response()->json(['ok' => true]);
                        } elseif ($claim['status'] === 'receipt_saved') {
                            $this->telegramService->sendMessage(
                                $chatId,
                                $this->localeService->getReceiptSavedMessage($locale)
                            );

                            return response()->json(['ok' => true]);
                        } elseif ($claim['status'] === 'no_pending_booking') {
                            $this->telegramService->sendMessage(
                                $chatId,
                                $this->localeService->getReceiptNoPendingBookingMessage($locale)
                            );

                            return response()->json(['ok' => true]);
                        }
                    } else {
                        $signedUrl = $this->telegramService->generateSignedConnectUrl($chatId);
                        $prompt = $this->localeService->getReceiptUnlinkedMessage($signedUrl, $locale);
                        $this->telegramService->sendMessage(
                            $chatId,
                            $prompt['text'],
                            $prompt['reply_markup']
                        );

                        return response()->json(['ok' => true]);
                    }
                }

                // If admin forwards an official Humo SMS
                if ($isAdmin && $parsedHumo !== null) {
                    $result = $this->humoPaymentService->process($text);

                    if ($result['status'] === 'matched_appointment') {
                        $amountFormatted = number_format($result['amount'], 0, '', ' ');
                        $this->telegramService->sendMessage(
                            $chatId,
                            "✅ <b>To'lov avtomatik tasdiqlandi!</b>\n\n".
                            "💰 <b>Summa:</b> {$amountFormatted} so'm\n".
                            "🗓 <b>Dars ID:</b> #{$result['appointment_id']}\n\n".
                            'Dars jadvalga muvaffaqiyatli kiritildi.'
                        );
                    } elseif ($result['status'] === 'matched_package') {
                        $amountFormatted = number_format($result['amount'], 0, '', ' ');
                        $this->telegramService->sendMessage(
                            $chatId,
                            "✅ <b>Paket to'lovi avtomatik tasdiqlandi!</b>\n\n".
                            "💰 <b>Summa:</b> {$amountFormatted} so'm\n".
                            "📦 <b>Paket ID:</b> #{$result['package_id']}\n\n".
                            "O'quvchi daqiqalari faollashtirildi."
                        );
                    } elseif ($result['status'] === 'duplicate') {
                        $amountFormatted = number_format($result['amount'], 0, '', ' ');
                        $this->telegramService->sendMessage(
                            $chatId,
                            "ℹ️ <b>Bu to'lov allaqachon qabul qilingan.</b>\n\n".
                            "💰 <b>Summa:</b> {$amountFormatted} so'm"
                        );
                    } elseif ($result['status'] === 'unmatched') {
                        $amountFormatted = number_format($result['amount'], 0, '', ' ');
                        $this->telegramService->sendMessage(
                            $chatId,
                            "⚠️ <b>Humo to'lovi qabul qilindi, lekin mos buyurtma topilmadi.</b>\n\n".
                            "💰 <b>Summa:</b> {$amountFormatted} so'm\n\n".
                            'Iltimos, admin panel orqali tekshiring.'
                        );
                    }

                    return response()->json(['ok' => true]);
                }
            }

            // 7. Fallback for any other regular message
            if ($existingUser) {
                $this->telegramService->sendMessage(
                    $chatId,
                    $this->localeService->getFallbackHelloMessage($existingUser->full_name, $locale)
                );
            } else {
                $this->telegramService->sendWelcomePrompt($chatId, $locale);
            }
        } catch (\Throwable $e) {
            Log::error('Error processing Telegram webhook: '.$e->getMessage(), [
                'payload' => $request->all(),
            ]);
        }

        return response()->json(['ok' => true]);
    }
}

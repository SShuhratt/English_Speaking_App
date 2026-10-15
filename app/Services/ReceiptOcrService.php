<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ReceiptOcrService
{
    /**
     * Parse receipt image using Gemini Vision API.
     *
     * @return array{is_payment_receipt: bool, amount: int, card_last_digits: ?string, time: ?string, date: ?string, provider: ?string, transaction_id: ?string}|null
     */
    public function parseImage(string $binaryData, string $mimeType = 'image/jpeg'): ?array
    {
        $apiKey = (string) config('services.gemini.api_key');
        $model = (string) config('services.gemini.model', 'gemini-flash-latest');

        if (empty($apiKey)) {
            Log::warning('ReceiptOcrService: Missing GEMINI_API_KEY.');

            return null;
        }

        $url = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$apiKey}";
        $base64 = base64_encode($binaryData);

        try {
            $response = Http::timeout(25)->post($url, [
                'contents' => [
                    [
                        'parts' => [
                            [
                                'inlineData' => [
                                    'mimeType' => $mimeType,
                                    'data' => $base64,
                                ],
                            ],
                            [
                                'text' => "Analyze this receipt image from an Uzbekistan payment provider (Click, Payme, Uzum Bank, Zoomrad, Anorbank, Apelsin, Plum, Paynet, Humo). Extract the transaction details:\n".
                                    "Distinguish between promotional limits (e.g. 'oyiga 3 000 000 so'mgacha'), fee/commission ('0 so'm'), and the actual transferred or paid amount.\n".
                                    "Distinguish between the sender's card (e.g. 'karta orqali to'landi') and the destination/recipient card (e.g. 'kartaga o'tkazildi'). Set card_last_digits to the DESTINATION card.\n\n".
                                    "1. is_payment_receipt: true if it is a real payment receipt or success transfer screen, false otherwise.\n".
                                    "2. amount: total transferred amount in Uzbek So'm (UZS) as a clean integer without decimals.\n".
                                    "3. card_last_digits: destination / recipient card last 4 digits (e.g. '6751') if visible, null otherwise.\n".
                                    "4. time: time of transaction in HH:MM (24-hour format, e.g. '21:42') if visible.\n".
                                    "5. date: date of transaction in DD.MM.YYYY (e.g. '12.10.2026') if visible.\n".
                                    "6. provider: name of payment service (e.g. 'Click', 'Payme', 'Uzum', 'Paynet') if identifiable.\n".
                                    '7. transaction_id: transaction or check ID if visible.',
                            ],
                        ],
                    ],
                ],
                'generationConfig' => [
                    'responseMimeType' => 'application/json',
                    'responseSchema' => [
                        'type' => 'OBJECT',
                        'properties' => [
                            'is_payment_receipt' => ['type' => 'BOOLEAN'],
                            'amount' => ['type' => 'INTEGER'],
                            'card_last_digits' => ['type' => 'STRING'],
                            'time' => ['type' => 'STRING'],
                            'date' => ['type' => 'STRING'],
                            'provider' => ['type' => 'STRING'],
                            'transaction_id' => ['type' => 'STRING'],
                        ],
                        'required' => ['is_payment_receipt', 'amount'],
                    ],
                ],
            ]);

            if (! $response->successful()) {
                Log::warning('ReceiptOcrService Gemini image error: '.$response->status().' '.$response->body());

                return null;
            }

            $content = $response->json('candidates.0.content.parts.0.text');
            if (! $content) {
                return null;
            }

            return $this->formatParsedData(json_decode($content, true));
        } catch (\Throwable $e) {
            Log::error('ReceiptOcrService image processing exception: '.$e->getMessage());

            return null;
        }
    }

    /**
     * Parse receipt text using Gemini API with semantic understanding.
     */
    public function parseWithGeminiText(string $text): ?array
    {
        $apiKey = (string) config('services.gemini.api_key');
        $model = (string) config('services.gemini.model', 'gemini-flash-latest');

        if (empty($apiKey)) {
            return null;
        }

        $url = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$apiKey}";

        $prompt = "Analyze this receipt text from an Uzbekistan payment provider (Click, Payme, Uzum Bank, Paynet, Humo, etc.).\n".
            "Distinguish between promotional marketing limits (e.g. 'oyiga 3 000 000 so\'mgacha'), commission ('0 so\'m'), and the ACTUAL amount transferred.\n".
            "Distinguish between the sender's card (e.g. 'karta orqali to\'landi') and the destination/recipient card (e.g. 'kartaga o\'tkazildi'). Set card_last_digits to the DESTINATION/RECIPIENT card.\n\n".
            "Receipt text:\n{$text}";

        try {
            $response = Http::timeout(25)->post($url, [
                'contents' => [
                    [
                        'parts' => [
                            ['text' => $prompt],
                        ],
                    ],
                ],
                'generationConfig' => [
                    'responseMimeType' => 'application/json',
                    'responseSchema' => [
                        'type' => 'OBJECT',
                        'properties' => [
                            'is_payment_receipt' => ['type' => 'BOOLEAN'],
                            'amount' => ['type' => 'INTEGER'],
                            'card_last_digits' => ['type' => 'STRING'],
                            'time' => ['type' => 'STRING'],
                            'date' => ['type' => 'STRING'],
                            'provider' => ['type' => 'STRING'],
                            'transaction_id' => ['type' => 'STRING'],
                        ],
                        'required' => ['is_payment_receipt', 'amount'],
                    ],
                ],
            ]);

            if (! $response->successful()) {
                Log::warning('ReceiptOcrService Gemini text error: '.$response->status().' '.$response->body());

                return null;
            }

            $content = $response->json('candidates.0.content.parts.0.text');
            if (! $content) {
                return null;
            }

            $formatted = $this->formatParsedData(json_decode($content, true));
            if ($formatted) {
                $formatted['raw'] = $text;
            }

            return $formatted;
        } catch (\Throwable $e) {
            Log::warning('ReceiptOcrService Gemini text parsing exception: '.$e->getMessage());

            return null;
        }
    }

    /**
     * Parse electronic PDF receipt using native pdftotext.
     */
    public function parsePdf(string $pdfPath): ?array
    {
        if (! file_exists($pdfPath)) {
            return null;
        }

        $command = '/usr/bin/pdftotext '.escapeshellarg($pdfPath).' - 2>/dev/null';
        $text = (string) shell_exec($command);

        if (trim($text) === '') {
            return null;
        }

        return $this->parseText($text);
    }

    /**
     * Parse plain text receipt (Gemini first with smart local regex fallback).
     *
     * @return array{is_payment_receipt: bool, amount: int, card_last_digits: ?string, time: ?string, date: ?string, provider: ?string, raw: string}|null
     */
    public function parseText(string $text): ?array
    {
        // 1. Try Gemini semantic analysis first
        $geminiResult = $this->parseWithGeminiText($text);
        if ($geminiResult && ! empty($geminiResult['amount']) && $geminiResult['amount'] > 0) {
            return $geminiResult;
        }

        // 2. Resilient local regex fallback
        return $this->parseTextRegex($text);
    }

    /**
     * Smart local regex parser that ignores promotional limits and distinguishes destination cards.
     */
    public function parseTextRegex(string $text): ?array
    {
        // 1. Extract amount, filtering out promotional limit lines (e.g. "so'mgacha") and commission (0 so'm)
        $amount = null;

        // Try high-confidence receipt confirmation patterns
        if (preg_match('/(?:Operatsiya\s+bajarildi|Qabul\s+qiluvchi\s+oladi|To[\'‘`]langan|Summa|To[\'‘`]lov|Oplata|Amount)[:\s\n\r]*([0-9\s\.\,]+)\s*(?:so[\'‘`]m|UZS|som)/ui', $text, $highConfMatch)) {
            $rawAmount = preg_replace('/[^\d]/', '', $highConfMatch[1]);
            $candidate = (int) $rawAmount;
            if ($candidate > 0) {
                $amount = $candidate;
            }
        }

        // Fallback: check all amounts while explicitly ignoring promotional lines containing "gacha"
        if (! $amount) {
            $lines = explode("\n", $text);
            foreach ($lines as $line) {
                if (preg_match('/(?:gacha|oyiga|limit|komissiya)/ui', $line)) {
                    continue;
                }
                if (preg_match('/(?:[➕\+]|to\'lov|summa|oplata|sum|to‘lov)?\s*([\d\.\s]+)(?:,00)?\s*(?:UZS|so[\'‘`]?m|som)/ui', $line, $matches)) {
                    $rawAmount = preg_replace('/[^\d]/', '', $matches[1]);
                    $candidate = (int) $rawAmount;
                    if ($candidate > 0) {
                        $amount = $candidate;
                        break;
                    }
                }
            }
        }

        if (! $amount || $amount <= 0) {
            return null;
        }

        // 2. Extract destination card (prioritize destination / recipient card)
        $card = null;
        if (preg_match('/(?:kartaga|qabul\s*qiluvchi|destination)[\s\S]{0,100}?\*+[\s\*]*(\d{4})/ui', $text, $destMatches)) {
            $card = $destMatches[1];
        } elseif (preg_match('/(?:karta|card|humocard|uzcard)?[\s\S]{0,30}?\*+[\s\*]*(\d{4})/ui', $text, $cardMatches)) {
            $card = $cardMatches[1];
        }

        // 3. Extract time (e.g. 15:03)
        $time = null;
        if (preg_match('/(\d{1,2}:\d{2})/u', $text, $timeMatches)) {
            $time = $timeMatches[1];
        }

        // 4. Extract date
        $date = null;
        if (preg_match('/(\d{1,2}[\.\-\/]\d{1,2}[\.\-\/]\d{4})/u', $text, $dateMatches)) {
            $date = $dateMatches[1];
        } elseif (preg_match('/(\d{1,2}[\-\s]+[a-zа-я]+,?\s+\d{4})/ui', $text, $dateMatchesText)) {
            $date = trim($dateMatchesText[1]);
        }

        // 5. Provider
        $provider = null;
        if (stripos($text, 'PAYNET') !== false) {
            $provider = 'Paynet';
        } elseif (stripos($text, 'CLICK') !== false) {
            $provider = 'Click';
        } elseif (stripos($text, 'PAYME') !== false) {
            $provider = 'Payme';
        } elseif (stripos($text, 'UZUM') !== false) {
            $provider = 'Uzum';
        }

        return [
            'is_payment_receipt' => true,
            'amount' => $amount,
            'card_last_digits' => $card,
            'time' => $time,
            'date' => $date,
            'provider' => $provider,
            'raw' => $text,
        ];
    }

    /**
     * Format and normalize parsed data array.
     *
     * @return array{is_payment_receipt: bool, amount: int, card_last_digits: ?string, time: ?string, date: ?string, provider: ?string, transaction_id: ?string}|null
     */
    protected function formatParsedData(mixed $data): ?array
    {
        if (! is_array($data) || empty($data['is_payment_receipt']) || empty($data['amount'])) {
            return null;
        }

        $amount = (int) $data['amount'];
        if ($amount <= 0) {
            return null;
        }

        $card = null;
        if (! empty($data['card_last_digits'])) {
            $cardDigits = preg_replace('/[^\d]/', '', (string) $data['card_last_digits']);
            $card = strlen($cardDigits) >= 4 ? substr($cardDigits, -4) : $cardDigits;
        }

        $time = null;
        if (! empty($data['time']) && preg_match('/(\d{1,2}:\d{2})/', (string) $data['time'], $m)) {
            $time = $m[1];
        }

        return [
            'is_payment_receipt' => true,
            'amount' => $amount,
            'card_last_digits' => $card,
            'time' => $time,
            'date' => $data['date'] ?? null,
            'provider' => $data['provider'] ?? null,
            'transaction_id' => $data['transaction_id'] ?? null,
        ];
    }

    /**
     * Dispatch file parsing based on extension/MIME type.
     */
    public function parseFile(string $filePath, ?string $mimeType = null): ?array
    {
        if (! file_exists($filePath)) {
            return null;
        }

        $mime = $mimeType ?: mime_content_type($filePath);

        if ($mime === 'application/pdf' || str_ends_with(strtolower($filePath), '.pdf')) {
            return $this->parsePdf($filePath);
        }

        if (str_starts_with($mime, 'image/')) {
            return $this->parseImage(file_get_contents($filePath), $mime);
        }

        // Fallback: try parsing as text
        $content = file_get_contents($filePath);

        return $this->parseText($content);
    }
}

<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\HumoTransaction;
use App\Models\PupilPackage;
use App\Models\User;
use App\Notifications\PackagePaymentConfirmedNotification;
use App\Notifications\TeacherPackagePurchasedNotification;
use App\Services\Telegram\TelegramService;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class HumoPaymentService
{
    public function __construct(
        protected BookingService $bookingService,
        protected TelegramService $telegramService,
        protected ReceiptOcrService $ocrService
    ) {}

    /**
     * Parse Humo notification text into structured data.
     *
     * @return array{amount: int, card: ?string, channel: ?string, timestamp: ?string, hash: string, raw: string}|null
     */
    public function parse(string $text): ?array
    {
        // Must contain topup / incoming indicators
        $hasTopupIndicator = str_contains($text, "To'ldirish")
            || str_contains($text, 'Toldirish')
            || str_contains($text, 'To‘ldirish')
            || str_contains($text, 'Popolnenie')
            || str_contains($text, '➕');

        // Reject outgoing indicators
        $hasSpendingIndicator = str_contains($text, "To'lov")
            || str_contains($text, 'Tolov')
            || str_contains($text, 'To‘lov')
            || str_contains($text, 'Yechish')
            || str_contains($text, 'Spisanie')
            || str_contains($text, 'Oplata')
            || str_contains($text, '➖');

        if (! $hasTopupIndicator || $hasSpendingIndicator) {
            return null;
        }

        // 1. Extract Amount: e.g. "➕ 1.000,00 UZS" or "➕ 150.000,00 UZS"
        if (! preg_match('/[➕\+]\s*([\d\.\s]+),(\d{2})\s*UZS/u', $text, $matches)) {
            // Fallback for simple amount format without comma decimals
            if (! preg_match('/[➕\+]\s*([\d\.\s]+)\s*UZS/u', $text, $matches)) {
                return null;
            }
        }

        $rawAmount = preg_replace('/[^\d]/', '', $matches[1]);
        $amount = (int) $rawAmount;

        if ($amount <= 0) {
            return null;
        }

        // 2. Extract Card Snippet: e.g. "💳 HUMOCARD *6751"
        $card = null;
        if (preg_match('/(?:HUMOCARD|Karta|HUMO)?\s*\*(\d{4})/ui', $text, $cardMatches)) {
            $card = $cardMatches[1];
        }

        // 3. Extract Payment Channel / Provider: e.g. "📍 PAYNET P2P HUM2HUM>T"
        $channel = null;
        if (preg_match('/📍\s*([^\n\r]+)/u', $text, $channelMatches)) {
            $channel = trim($channelMatches[1]);
        }

        // 4. Extract Timestamp: e.g. "🕓 18:17 12.10.2026"
        $timestamp = null;
        if (preg_match('/🕓\s*(\d{1,2}:\d{2}\s+\d{1,2}\.\d{1,2}\.\d{4})/u', $text, $timeMatches)) {
            $timestamp = trim($timeMatches[1]);
        }

        // Collision-resistant idempotency hash
        $hashPayload = "humo_{$amount}_".($card ?? '').'_'.($timestamp ?? '').'_'.($channel ?? '').'_'.md5(trim($text));
        $hash = hash('sha256', $hashPayload);

        return [
            'amount' => $amount,
            'card' => $card,
            'channel' => $channel,
            'timestamp' => $timestamp,
            'hash' => $hash,
            'raw' => $text,
        ];
    }

    /**
     * Process incoming Humo notification and auto-confirm matched booking or package.
     */
    public function process(string $text): array
    {
        $parsed = $this->parse($text);

        if (! $parsed) {
            return [
                'status' => 'ignored',
                'message' => 'Message is not an incoming Humo top-up notification.',
            ];
        }

        // Optional card verification if configured
        $configuredCards = array_filter(array_map('trim', explode(',', (string) config('services.humo.card_last_digits'))));
        if (! empty($configuredCards) && ! empty($parsed['card']) && ! in_array($parsed['card'], $configuredCards, true)) {
            $expectedStr = implode(', *', $configuredCards);
            Log::info("Humo payment ignored due to card mismatch: received {$parsed['card']}, expected *{$expectedStr}");

            return [
                'status' => 'ignored',
                'message' => "Card mismatch: expected *{$expectedStr}, received *{$parsed['card']}",
            ];
        }

        // Concurrency lock to prevent race conditions from simultaneous requests
        $lockKey = "humo_lock:{$parsed['hash']}";
        $lock = Cache::lock($lockKey, 10);
        if (! $lock->get()) {
            return [
                'status' => 'duplicate',
                'amount' => $parsed['amount'],
                'message' => 'Transaction is currently being processed.',
            ];
        }

        try {
            // Atomic database transaction with pessimistic locking
            return DB::transaction(function () use ($parsed, $text) {
                // Check if already processed
                $existingTx = HumoTransaction::where('hash', $parsed['hash'])->first();
                if ($existingTx && $existingTx->status === 'matched') {
                    return [
                        'status' => 'duplicate',
                        'amount' => $parsed['amount'],
                        'message' => 'Transaction was already processed.',
                    ];
                }

                $tx = $existingTx ?: HumoTransaction::create([
                    'hash' => $parsed['hash'],
                    'amount' => $parsed['amount'],
                    'card_last_digits' => $parsed['card'],
                    'channel' => $parsed['channel'],
                    'bank_timestamp' => $parsed['timestamp'],
                    'raw_text' => $text,
                    'status' => 'unmatched',
                ]);

                // 1. Search for matching candidates waiting for payment verification (within last 48 hours)
                $pendingAppointments = Appointment::where('payment_status', 'verifying')
                    ->where('price', $parsed['amount'])
                    ->where('created_at', '>=', now()->subHours(48))
                    ->lockForUpdate()
                    ->get();

                $pendingPackages = PupilPackage::where('payment_status', 'verifying')
                    ->where('price_paid', $parsed['amount'])
                    ->where('created_at', '>=', now()->subHours(48))
                    ->lockForUpdate()
                    ->get();

                $totalCandidates = $pendingAppointments->count() + $pendingPackages->count();

                // Case A: Exactly 1 candidate -> No collision! Auto-confirm immediately
                if ($totalCandidates === 1) {
                    if ($pendingAppointments->isNotEmpty()) {
                        $appointment = $pendingAppointments->first();
                        $this->confirmAppointment($appointment);

                        $tx->update([
                            'status' => 'matched',
                            'matched_type' => 'appointment',
                            'matched_id' => $appointment->id,
                        ]);

                        $this->notifyAdminsMatchedAppointment($appointment, $parsed);

                        return [
                            'status' => 'matched_appointment',
                            'appointment_id' => $appointment->id,
                            'amount' => $parsed['amount'],
                            'details' => $parsed,
                        ];
                    }

                    $package = $pendingPackages->first();
                    $this->confirmPackage($package);

                    $tx->update([
                        'status' => 'matched',
                        'matched_type' => 'package',
                        'matched_id' => $package->id,
                    ]);

                    $this->notifyAdminsMatchedPackage($package, $parsed);

                    return [
                        'status' => 'matched_package',
                        'package_id' => $package->id,
                        'amount' => $parsed['amount'],
                        'details' => $parsed,
                    ];
                }

                // Case B: Collision detected (2 or more candidates with same price)
                if ($totalCandidates > 1) {
                    // Check if any candidate has submitted a matching receipt
                    $resolved = $this->resolveCandidateWithReceipt($pendingAppointments, $pendingPackages, $parsed);

                    if ($resolved) {
                        if ($resolved['type'] === 'appointment') {
                            $appointment = $resolved['model'];
                            $this->confirmAppointment($appointment);

                            $tx->update([
                                'status' => 'matched',
                                'matched_type' => 'appointment',
                                'matched_id' => $appointment->id,
                            ]);

                            $this->notifyAdminsMatchedAppointment($appointment, $parsed);

                            return [
                                'status' => 'matched_appointment',
                                'appointment_id' => $appointment->id,
                                'amount' => $parsed['amount'],
                                'details' => $parsed,
                            ];
                        }

                        $package = $resolved['model'];
                        $this->confirmPackage($package);

                        $tx->update([
                            'status' => 'matched',
                            'matched_type' => 'package',
                            'matched_id' => $package->id,
                        ]);

                        $this->notifyAdminsMatchedPackage($package, $parsed);

                        return [
                            'status' => 'matched_package',
                            'package_id' => $package->id,
                            'amount' => $parsed['amount'],
                            'details' => $parsed,
                        ];
                    }

                    // No candidate has a matching receipt yet -> Quarantine payment
                    $tx->update(['status' => 'quarantined']);
                    $this->notifyAdminsQuarantined($parsed, $totalCandidates);

                    return [
                        'status' => 'quarantined',
                        'amount' => $parsed['amount'],
                        'candidates_count' => $totalCandidates,
                        'message' => 'Multiple pending orders found with same amount. Payment quarantined pending receipt verification.',
                        'details' => $parsed,
                    ];
                }

                // Case C: Unmatched payment (0 candidates)
                $tx->update(['status' => 'unmatched']);
                $this->notifyAdminsUnmatched($parsed);

                return [
                    'status' => 'unmatched',
                    'amount' => $parsed['amount'],
                    'message' => 'Payment received but no matching pending booking with payment_status=verifying was found.',
                    'details' => $parsed,
                ];
            });
        } finally {
            optional($lock)->release();
        }
    }

    /**
     * Pupil claims payment with receipt (photo, PDF, or text).
     */
    public function claimWithReceipt(
        User $pupil,
        mixed $receiptDataOrText,
        ?string $appointmentId = null,
        ?string $pupilPackageId = null
    ): array {
        // 1. Parse receipt details
        $receipt = null;
        if (is_array($receiptDataOrText)) {
            $receipt = $receiptDataOrText;
        } elseif ($receiptDataOrText instanceof UploadedFile) {
            $receipt = $this->ocrService->parseFile($receiptDataOrText->getRealPath(), $receiptDataOrText->getMimeType());
        } elseif (is_string($receiptDataOrText) && file_exists($receiptDataOrText)) {
            $receipt = $this->ocrService->parseFile($receiptDataOrText);
        } elseif (is_string($receiptDataOrText)) {
            $receipt = $this->ocrService->parseText($receiptDataOrText);
        }

        if (! $receipt || empty($receipt['is_payment_receipt']) || empty($receipt['amount'])) {
            return [
                'status' => 'invalid_receipt',
                'message' => "To'lov chekini aniqlab bo'lmadi. Iltimos, to'g'ri va aniq chekni yuboring.",
            ];
        }

        // 2. Locate matching pending booking/package for this pupil
        return DB::transaction(function () use ($pupil, $receipt, $appointmentId, $pupilPackageId) {
            $appointment = null;
            $package = null;

            if ($appointmentId) {
                $appointment = Appointment::where('id', $appointmentId)
                    ->where('pupil_id', $pupil->id)
                    ->where('payment_status', 'verifying')
                    ->lockForUpdate()
                    ->first();
            } elseif ($pupilPackageId) {
                $package = PupilPackage::where('id', $pupilPackageId)
                    ->where('pupil_id', $pupil->id)
                    ->where('payment_status', 'verifying')
                    ->lockForUpdate()
                    ->first();
            } else {
                $appointment = Appointment::where('pupil_id', $pupil->id)
                    ->where('payment_status', 'verifying')
                    ->where('price', $receipt['amount'])
                    ->lockForUpdate()
                    ->orderBy('created_at', 'asc')
                    ->first();

                if (! $appointment) {
                    $package = PupilPackage::where('pupil_id', $pupil->id)
                        ->where('payment_status', 'verifying')
                        ->where('price_paid', $receipt['amount'])
                        ->lockForUpdate()
                        ->orderBy('created_at', 'asc')
                        ->first();
                }
            }

            if (! $appointment && ! $package) {
                return [
                    'status' => 'no_pending_booking',
                    'message' => 'Ushbu summaga mos keluvchi tasdiqlash kutilayotgan dars yoki paket topilmadi.',
                ];
            }

            $model = $appointment ?: $package;
            $model->update([
                'receipt_data' => $receipt,
            ]);

            // 3. Check if there is an unmatched or quarantined HumoTransaction waiting in DB
            $txQuery = HumoTransaction::whereIn('status', ['unmatched', 'quarantined'])
                ->where('amount', $receipt['amount'])
                ->where('created_at', '>=', now()->subHours(48))
                ->lockForUpdate()
                ->orderBy('created_at', 'desc');

            $tx = $txQuery->first();

            if ($tx) {
                // Verify time compatibility if time is available
                if ($this->isTimeCompatible($tx->bank_timestamp, $receipt['time'] ?? null)) {
                    if ($appointment) {
                        $this->confirmAppointment($appointment);
                        $tx->update([
                            'status' => 'matched',
                            'matched_type' => 'appointment',
                            'matched_id' => $appointment->id,
                        ]);

                        return [
                            'status' => 'confirmed',
                            'type' => 'appointment',
                            'appointment_id' => $appointment->id,
                            'message' => "To'lov muvaffaqiyatli tasdiqlandi!",
                        ];
                    }

                    $this->confirmPackage($package);
                    $tx->update([
                        'status' => 'matched',
                        'matched_type' => 'package',
                        'matched_id' => $package->id,
                    ]);

                    return [
                        'status' => 'confirmed',
                        'type' => 'package',
                        'package_id' => $package->id,
                        'message' => "Paket to'lovi muvaffaqiyatli tasdiqlandi!",
                    ];
                }
            }

            // Receipt saved, waiting for matching bank notification
            return [
                'status' => 'receipt_saved',
                'type' => $appointment ? 'appointment' : 'package',
                'model_id' => $model->id,
                'message' => "Chek qabul qilindi. Bank tasdig'i kelishi bilan avtomatik tasdiqlanadi.",
            ];
        });
    }

    /**
     * Resolve candidate based on uploaded receipt metadata during collision.
     *
     * @param  Collection<int, Appointment>  $appointments
     * @param  Collection<int, PupilPackage>  $packages
     */
    protected function resolveCandidateWithReceipt(Collection $appointments, Collection $packages, array $parsed): ?array
    {
        foreach ($appointments as $apt) {
            if (! empty($apt->receipt_data) && is_array($apt->receipt_data)) {
                $rTime = $apt->receipt_data['time'] ?? null;
                if ($this->isTimeCompatible($parsed['timestamp'] ?? null, $rTime)) {
                    return ['type' => 'appointment', 'model' => $apt];
                }
            }
        }

        foreach ($packages as $pkg) {
            if (! empty($pkg->receipt_data) && is_array($pkg->receipt_data)) {
                $rTime = $pkg->receipt_data['time'] ?? null;
                if ($this->isTimeCompatible($parsed['timestamp'] ?? null, $rTime)) {
                    return ['type' => 'package', 'model' => $pkg];
                }
            }
        }

        return null;
    }

    /**
     * Helper to verify if two timestamps are compatible within tolerance.
     */
    public function isTimeCompatible(?string $bankTimestamp, ?string $receiptTime, int $toleranceMinutes = 10): bool
    {
        if (empty($bankTimestamp) || empty($receiptTime)) {
            return true;
        }

        // Extract HH:MM from bankTimestamp
        if (! preg_match('/(\d{1,2}:\d{2})/', $bankTimestamp, $mBank)) {
            return true;
        }

        if (! preg_match('/(\d{1,2}:\d{2})/', $receiptTime, $mReceipt)) {
            return true;
        }

        [$bHour, $bMin] = array_map('intval', explode(':', $mBank[1]));
        [$rHour, $rMin] = array_map('intval', explode(':', $mReceipt[1]));

        $bTotalMin = ($bHour * 60) + $bMin;
        $rTotalMin = ($rHour * 60) + $rMin;

        $diff = abs($bTotalMin - $rTotalMin);
        if ($diff > 720) {
            $diff = 1440 - $diff; // Handle midnight boundary
        }

        return $diff <= $toleranceMinutes;
    }

    protected function confirmAppointment(Appointment $appointment): void
    {
        if ($appointment->status === 'accepted') {
            $this->bookingService->adminConfirmPayment($appointment->id);
        } else {
            $appointment->update([
                'status' => 'confirmed',
                'payment_status' => 'paid',
            ]);
        }
    }

    protected function confirmPackage(PupilPackage $package): void
    {
        $package->update([
            'payment_status' => 'paid',
            'status' => 'active',
        ]);

        $package->load(['teacher.teacherProfile', 'pupil.pupilProfile']);
        $package->pupil?->notify(new PackagePaymentConfirmedNotification($package));
        $package->teacher?->notify(new TeacherPackagePurchasedNotification($package));
    }

    protected function notifyAdminsMatchedAppointment(Appointment $appointment, array $parsed): void
    {
        $amountFormatted = number_format($parsed['amount'], 0, '', ' ');
        $pupilName = htmlspecialchars($appointment->pupil?->full_name ?? 'Pupil', ENT_QUOTES, 'UTF-8');
        $teacherName = htmlspecialchars($appointment->teacher?->full_name ?? 'Teacher', ENT_QUOTES, 'UTF-8');
        $card = htmlspecialchars($parsed['card'] ?? '', ENT_QUOTES, 'UTF-8');
        $channel = htmlspecialchars($parsed['channel'] ?? 'Noma\'lum', ENT_QUOTES, 'UTF-8');

        $text = "🎉 <b>Avtomatik to'lov tasdiqlandi!</b>\n\n".
            "💰 <b>Summa:</b> {$amountFormatted} so'm\n".
            "👤 <b>O'quvchi:</b> {$pupilName}\n".
            "👨‍🏫 <b>O'qituvchi:</b> {$teacherName}\n".
            "💳 <b>Karta:</b> *{$card}\n".
            "📍 <b>Kanal:</b> {$channel}\n\n".
            '✅ Dars avtomatik ravishda tasdiqlandi va jadvalga kiritildi.';

        $this->broadcastToAdmins($text);
    }

    protected function notifyAdminsMatchedPackage(PupilPackage $package, array $parsed): void
    {
        $amountFormatted = number_format($parsed['amount'], 0, '', ' ');
        $pupilName = htmlspecialchars($package->pupil?->full_name ?? 'Pupil', ENT_QUOTES, 'UTF-8');
        $title = htmlspecialchars($package->package_title ?? 'Paket', ENT_QUOTES, 'UTF-8');
        $card = htmlspecialchars($parsed['card'] ?? '', ENT_QUOTES, 'UTF-8');

        $text = "📦 <b>Avtomatik paket to'lovi tasdiqlandi!</b>\n\n".
            "💰 <b>Summa:</b> {$amountFormatted} so'm\n".
            "👤 <b>O'quvchi:</b> {$pupilName}\n".
            "🎁 <b>Paket:</b> {$title}\n".
            "💳 <b>Karta:</b> *{$card}\n\n".
            "✅ O'quvchi daqiqalari faollashtirildi.";

        $this->broadcastToAdmins($text);
    }

    protected function notifyAdminsQuarantined(array $parsed, int $candidatesCount): void
    {
        $amountFormatted = number_format($parsed['amount'], 0, '', ' ');
        $card = htmlspecialchars($parsed['card'] ?? '', ENT_QUOTES, 'UTF-8');
        $channel = htmlspecialchars($parsed['channel'] ?? 'Noma\'lum', ENT_QUOTES, 'UTF-8');
        $timestamp = htmlspecialchars($parsed['timestamp'] ?? now()->format('H:i d.m.Y'), ENT_QUOTES, 'UTF-8');

        $text = "⚠️ <b>To'lov karantinga olindi (To'qnashuv aniqlandi)!</b>\n\n".
            "💰 <b>Summa:</b> {$amountFormatted} so'm\n".
            "👥 <b>Kutilayotgan nomzodlar soni:</b> {$candidatesCount} ta\n".
            "💳 <b>Karta:</b> *{$card}\n".
            "📍 <b>Kanal:</b> {$channel}\n".
            "🕓 <b>Vaqt:</b> {$timestamp}\n\n".
            "ℹ️ Bir xil narxdagi buyurtmalar mavjud bo'lgani sababli, to'lov avtomatik karantinga olindi. O'quvchi cheki o'qilishi bilanoq tasdiqlanadi.";

        $this->broadcastToAdmins($text);
    }

    protected function notifyAdminsUnmatched(array $parsed): void
    {
        $amountFormatted = number_format($parsed['amount'], 0, '', ' ');
        $card = htmlspecialchars($parsed['card'] ?? '', ENT_QUOTES, 'UTF-8');
        $channel = htmlspecialchars($parsed['channel'] ?? 'Noma\'lum', ENT_QUOTES, 'UTF-8');
        $timestamp = htmlspecialchars($parsed['timestamp'] ?? now()->format('H:i d.m.Y'), ENT_QUOTES, 'UTF-8');

        $pendingApt = Appointment::where('payment_status', 'verifying')
            ->orderBy('created_at', 'desc')
            ->first();

        $discrepancyNotice = '';
        if ($pendingApt) {
            $expectedPrice = (int) $pendingApt->price;
            $diff = $parsed['amount'] - $expectedPrice;
            $diffFormatted = number_format(abs($diff), 0, '', ' ');
            $expectedFormatted = number_format($expectedPrice, 0, '', ' ');

            if ($diff < 0) {
                $discrepancyNotice = "\n\n⚠️ <b>DIQQAT: Chala to'lov bo'lishi mumkin!</b>\n".
                    "Kutilayotgan buyurtma (#{$pendingApt->id}) narxi: <b>{$expectedFormatted}</b> so'm.\n".
                    "Yetishmayotgan summa: <b>-{$diffFormatted}</b> so'm.";
            } elseif ($diff > 0) {
                $discrepancyNotice = "\n\nℹ️ <b>DIQQAT: Ortiqcha to'lov!</b>\n".
                    "Kutilayotgan buyurtma (#{$pendingApt->id}) narxi: <b>{$expectedFormatted}</b> so'm.\n".
                    "Ortiqcha summa: <b>+{$diffFormatted}</b> so'm.";
            }
        }

        $text = "⚠️ <b>Humo to'lovi qabul qilindi, lekin mos buyurtma topilmadi!</b>\n\n".
            "💰 <b>Summa:</b> {$amountFormatted} so'm\n".
            "💳 <b>Karta:</b> *{$card}\n".
            "📍 <b>Kanal:</b> {$channel}\n".
            "🕓 <b>Vaqt:</b> {$timestamp}".
            $discrepancyNotice."\n\n".
            'Iltimos, admin panel orqali tekshiring.';

        $this->broadcastToAdmins($text);
    }

    protected function broadcastToAdmins(string $text): void
    {
        try {
            $adminChatIds = User::where('role', 'admin')
                ->whereNotNull('telegram_chat_id')
                ->pluck('telegram_chat_id')
                ->unique();

            foreach ($adminChatIds as $chatId) {
                $this->telegramService->sendMessage($chatId, $text);
            }
        } catch (\Throwable $e) {
            Log::warning('Failed to broadcast Humo payment alert to admins: '.$e->getMessage());
        }
    }
}

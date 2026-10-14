<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\PupilPackage;
use App\Services\HumoPaymentService;
use App\Services\Telegram\TelegramLocaleService;
use App\Services\Telegram\TelegramService;
use BaconQrCode\Renderer\Image\SvgImageBackEnd;
use BaconQrCode\Renderer\ImageRenderer;
use BaconQrCode\Renderer\RendererStyle\RendererStyle;
use BaconQrCode\Writer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class PaymentLinkController extends Controller
{
    /**
     * Display the smart dynamic payment landing page.
     * Automatically adapts for mobile apps and desktop QR/web browser payments.
     */
    public function show(Request $request, string $type, string $id): Response
    {
        if (! Str::isUuid($id)) {
            abort(404);
        }

        $selectedApp = strtolower($request->query('app', 'click'));
        if (! in_array($selectedApp, ['click', 'payme', 'uzum'], true)) {
            $selectedApp = 'click';
        }

        $smartPaymentUrl = route('payment.show', ['type' => $type, 'id' => $id]);
        $cardNumber = (string) config('services.humo.card_number');
        $qrSvg = null;
        try {
            $renderer = new ImageRenderer(new RendererStyle(220, 1), new SvgImageBackEnd);
            $qrSvg = (new Writer($renderer))->writeString($smartPaymentUrl);
        } catch (\Throwable) {
            $qrSvg = null;
        }

        $paymentConfig = [
            'card_number' => $cardNumber,
            'card_holder' => (string) config('services.humo.card_holder'),
            'bot_username' => (string) config('services.telegram.bot_username', 'ConvomateAdminBot'),
            'qr_svg' => $qrSvg,
            'payment_url' => $smartPaymentUrl,
        ];

        if ($type === 'package') {
            $package = PupilPackage::with(['teacher.teacherProfile', 'pupil'])->findOrFail($id);

            $state = 'pending_payment';
            if ($package->payment_status === 'paid' || $package->status === 'active') {
                $state = 'already_paid';
            } elseif ($package->status === 'cancelled') {
                $state = 'cancelled';
            }

            return Inertia::render('pay/index', [
                'item' => [
                    'type' => 'package',
                    'id' => $package->id,
                    'title' => $package->package_title,
                    'teacher_name' => $package->teacher?->full_name,
                    'pupil_name' => $package->pupil?->full_name,
                    'pupil_id' => $package->pupil?->short_id ?: strtoupper(substr($package->pupil_id, 0, 8)),
                    'amount' => $package->price_paid,
                    'state' => $state,
                    'upload_url' => route('payment.receipt', ['type' => 'package', 'id' => $package->id]),
                ],
                'selected_app' => $selectedApp,
                'payment' => $paymentConfig,
            ]);
        }

        // Default to appointment / booking
        $appointment = Appointment::with(['teacher.teacherProfile', 'pupil'])->findOrFail($id);

        $state = 'pending_payment';
        if ($appointment->status === 'confirmed' || $appointment->status === 'completed') {
            $state = 'already_paid';
        } elseif ($appointment->status === 'cancelled') {
            $state = 'cancelled';
        }

        return Inertia::render('pay/index', [
            'item' => [
                'type' => 'booking',
                'id' => $appointment->id,
                'title' => 'English Speaking Session',
                'teacher_name' => $appointment->teacher?->full_name,
                'pupil_name' => $appointment->pupil?->full_name,
                'pupil_id' => $appointment->pupil?->short_id ?: strtoupper(substr($appointment->pupil_id, 0, 8)),
                'amount' => $appointment->price ?? $appointment->hourly_rate ?? 0,
                'start_at' => $appointment->start_at?->toISOString(),
                'end_at' => $appointment->end_at?->toISOString(),
                'state' => $state,
                'upload_url' => route('payment.receipt', ['type' => 'booking', 'id' => $appointment->id]),
            ],
            'selected_app' => $selectedApp,
            'payment' => $paymentConfig,
        ]);
    }

    /**
     * Upload receipt directly from the smart payment page.
     */
    public function uploadReceipt(
        Request $request,
        string $type,
        string $id,
        HumoPaymentService $humoPaymentService
    ) {
        $request->validate([
            'receipt' => 'required|file|mimes:jpeg,jpg,png,pdf,webp|max:10240',
        ]);

        $file = $request->file('receipt');

        if ($type === 'package') {
            $package = PupilPackage::with('pupil')->findOrFail($id);
            $user = $request->user() ?: $package->pupil;

            $result = $humoPaymentService->claimWithReceipt(
                pupil: $user,
                receiptDataOrText: $file,
                pupilPackageId: $package->id
            );
        } else {
            $appointment = Appointment::with('pupil')->findOrFail($id);
            $user = $request->user() ?: $appointment->pupil;

            $result = $humoPaymentService->claimWithReceipt(
                pupil: $user,
                receiptDataOrText: $file,
                appointmentId: $appointment->id
            );
        }

        if ($result['status'] === 'confirmed') {
            return back()->with('success', "To'lov muvaffaqiyatli tasdiqlandi!");
        }

        if ($result['status'] === 'receipt_saved') {
            return back()->with('success', "Chek qabul qilindi. Bank to'lovi kelishi bilan avtomatik tasdiqlanadi.");
        }

        return back()->with('error', $result['message'] ?? "Chekni tasdiqlab bo'lmadi.");
    }

    /**
     * Dispatch smart payment links for an appointment to the pupil's Telegram chat.
     */
    public function sendTelegramBookingLink(
        Request $request,
        Appointment $appointment,
        TelegramService $telegramService
    ) {
        $user = $request->user();
        if (! $user || ! $user->telegram_chat_id) {
            return response()->json([
                'sent' => false,
                'reason' => 'not_connected',
                'message' => 'Telegram account not connected.',
            ]);
        }

        if ($appointment->pupil_id !== $user->id) {
            abort(403);
        }

        return $this->dispatchTelegramPayment(
            user: $user,
            type: 'booking',
            id: (string) $appointment->id,
            title: 'English Speaking Session',
            teacherName: $appointment->teacher?->full_name ?? 'Teacher',
            amount: (int) ($appointment->price ?? $appointment->hourly_rate ?? 0),
            telegramService: $telegramService
        );
    }

    /**
     * Dispatch smart payment links for a package to the pupil's Telegram chat.
     */
    public function sendTelegramPackageLink(
        Request $request,
        PupilPackage $pupilPackage,
        TelegramService $telegramService
    ) {
        $user = $request->user();
        if (! $user || ! $user->telegram_chat_id) {
            return response()->json([
                'sent' => false,
                'reason' => 'not_connected',
                'message' => 'Telegram account not connected.',
            ]);
        }

        if ($pupilPackage->pupil_id !== $user->id) {
            abort(403);
        }

        return $this->dispatchTelegramPayment(
            user: $user,
            type: 'package',
            id: (string) $pupilPackage->id,
            title: $pupilPackage->package_title,
            teacherName: $pupilPackage->teacher?->full_name ?? 'Teacher',
            amount: (int) $pupilPackage->price_paid,
            telegramService: $telegramService
        );
    }

    protected function dispatchTelegramPayment(
        $user,
        string $type,
        string $id,
        string $title,
        string $teacherName,
        int $amount,
        TelegramService $telegramService
    ) {
        $smartPaymentUrl = route('payment.show', ['type' => $type, 'id' => $id]);
        $qrSvg = null;
        try {
            $renderer = new ImageRenderer(new RendererStyle(220, 1), new SvgImageBackEnd);
            $qrSvg = (new Writer($renderer))->writeString($smartPaymentUrl);
        } catch (\Throwable) {
            $qrSvg = null;
        }

        // Throttle dispatch per item for 5 minutes to prevent spamming
        $cacheKey = "tg_payment_link_{$user->id}_{$type}_{$id}";
        if (Cache::has($cacheKey)) {
            return response()->json([
                'sent' => true,
                'throttled' => true,
                'payment_url' => $smartPaymentUrl,
                'qr_svg' => $qrSvg,
                'message' => 'Payment link already sent recently.',
            ]);
        }

        $cardNumber = (string) config('services.humo.card_number');
        $formattedCard = trim(chunk_split($cardNumber, 4, ' '));

        // Smart dynamic URLs pointing to ConvoMate
        $clickPayUrl = route('payment.show', ['type' => $type, 'id' => $id, 'app' => 'click']);
        $paymePayUrl = route('payment.show', ['type' => $type, 'id' => $id, 'app' => 'payme']);
        $uzumPayUrl = route('payment.show', ['type' => $type, 'id' => $id, 'app' => 'uzum']);

        $localeService = app(TelegramLocaleService::class);
        $locale = $localeService->resolveLocale($user, $user->telegram_chat_id);
        $dispatchData = $localeService->getPaymentDispatchMessage(
            title: $title,
            teacherName: $teacherName,
            amount: $amount,
            formattedCard: $formattedCard,
            clickPayUrl: $clickPayUrl,
            paymePayUrl: $paymePayUrl,
            uzumPayUrl: $uzumPayUrl,
            locale: $locale
        );

        $sent = $telegramService->sendMessage(
            chatId: $user->telegram_chat_id,
            text: $dispatchData['text'],
            replyMarkup: $dispatchData['reply_markup']
        );

        if ($sent) {
            Cache::put($cacheKey, true, now()->addMinutes(5));
        }

        return response()->json([
            'sent' => $sent,
            'payment_url' => $smartPaymentUrl,
            'qr_svg' => $qrSvg,
            'message' => $sent ? 'Payment link sent to Telegram.' : 'Failed to send message.',
        ]);
    }

    /**
     * Return the SVG QR code for the smart payment link.
     */
    public function qrSvg(Request $request, string $type, string $id)
    {
        if (! Str::isUuid($id)) {
            abort(404);
        }

        if ($type === 'package') {
            PupilPackage::findOrFail($id);
        } else {
            Appointment::findOrFail($id);
        }

        $smartPaymentUrl = route('payment.show', ['type' => $type, 'id' => $id]);
        try {
            $renderer = new ImageRenderer(new RendererStyle(220, 1), new SvgImageBackEnd);
            $svg = (new Writer($renderer))->writeString($smartPaymentUrl);

            return response($svg, 200, [
                'Content-Type' => 'image/svg+xml',
                'Cache-Control' => 'public, max-age=3600',
            ]);
        } catch (\Throwable) {
            abort(500, 'Unable to generate QR code.');
        }
    }
}

<?php

namespace App\Http\Controllers;

use App\Models\PartnerVoucher;
use App\Models\PupilPackage;
use App\Models\TeacherPackage;
use App\Models\User;
use App\Models\UserDiscountVoucher;
use App\Notifications\PackagePaymentPendingNotification;
use App\Services\HumoPaymentService;
use App\Services\MonetizationCalculator;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class PupilPackageController extends Controller
{
    /**
     * List pupil's purchased packages.
     */
    public function index(Request $request)
    {
        $packages = PupilPackage::where('pupil_id', $request->user()->id)
            ->with('teacher.teacherProfile')
            ->latest()
            ->get();

        return response()->json($packages);
    }

    /**
     * Validate a voucher code and return discount info without redeeming it.
     * Supports both personal XP/Bounty discount vouchers and Track B2 institutional bulk vouchers.
     */
    public function validateVoucher(Request $request)
    {
        $validated = $request->validate([
            'voucher_code' => ['required', 'string', 'max:64'],
            'teacher_id' => ['nullable', 'uuid', 'exists:users,id'],
            'duration_minutes' => ['nullable', 'integer', 'min:10', 'max:180'],
            'context' => ['nullable', 'string', 'in:booking,package'],
        ]);

        $normalized = strtoupper(trim($validated['voucher_code']));
        $context = $validated['context'] ?? 'booking';

        if ($context === 'package') {
            return response()->json([
                'valid' => false,
                'message' => 'Discount vouchers apply to single 1-on-1 lessons only and cannot be stacked on conversation packs.',
            ], 422);
        }

        $voucher = UserDiscountVoucher::findUnusedByCode(
            $normalized,
            $request->user()->id
        );

        if ($voucher) {
            return response()->json([
                'valid' => true,
                'voucher_type' => 'personal',
                'voucher_id' => $voucher->id,
                'voucher_code' => $voucher->voucher_code,
                'discount_percent' => $voucher->discount_percent,
            ]);
        }

        $partnerVoucher = PartnerVoucher::with(['batch', 'partnerOrganization'])
            ->where('code', $normalized)
            ->first();

        if (! $partnerVoucher) {
            return response()->json([
                'valid' => false,
                'message' => 'This voucher code is invalid or has already been used.',
            ], 422);
        }

        if ($context === 'package') {
            return response()->json([
                'valid' => false,
                'message' => 'Institutional vouchers apply to single 1-on-1 lessons only, not multi-hour packages.',
            ], 422);
        }

        $batch = $partnerVoucher->batch;
        if ($partnerVoucher->status !== 'available' || $partnerVoucher->redeemed_appointment_id !== null || ! $batch || ! $batch->isPaidAndValid()) {
            return response()->json([
                'valid' => false,
                'message' => 'This institutional voucher has already been used or has expired.',
            ], 422);
        }

        if (! empty($validated['teacher_id'])) {
            $teacher = User::with('teacherProfile')->find($validated['teacher_id']);
            if (! $teacher?->teacherProfile?->accepts_institutional_vouchers) {
                return response()->json([
                    'valid' => false,
                    'message' => 'This teacher has not opted into institutional voucher sessions.',
                ], 422);
            }

            $duration = (int) ($validated['duration_minutes'] ?? $batch->lesson_duration_minutes);
            $hourlyRate = (float) ($teacher->teacherProfile->price ?? 0);
            $lessonPrice = $hourlyRate > 0 ? (int) (round(($hourlyRate * $duration / 60) / 1000) * 1000) : 0;

            if ($duration > $batch->lesson_duration_minutes) {
                return response()->json([
                    'valid' => false,
                    'message' => "This voucher covers up to {$batch->lesson_duration_minutes}-minute sessions.",
                ], 422);
            }

            if ($lessonPrice > $batch->max_lesson_price_uzs) {
                return response()->json([
                    'valid' => false,
                    'message' => "This voucher covers lessons up to {$batch->max_lesson_price_uzs} UZS.",
                ], 422);
            }
        }

        return response()->json([
            'valid' => true,
            'voucher_type' => 'institutional_b2',
            'voucher_id' => $partnerVoucher->id,
            'voucher_code' => $partnerVoucher->code,
            'discount_percent' => 100,
            'max_lesson_price_uzs' => $batch->max_lesson_price_uzs,
            'lesson_duration_minutes' => $batch->lesson_duration_minutes,
            'valid_until' => $batch->valid_until?->toIso8601String(),
            'partner_name' => $partnerVoucher->partnerOrganization?->name,
        ]);
    }

    /**
     * Pupil purchases a teacher's conversation pack.
     *
     * Accepts an optional voucher_code. If valid and unused, the discount is
     * applied to price_paid and the voucher is marked redeemed atomically.
     * Only one voucher may be applied per purchase.
     */
    public function purchase(Request $request)
    {
        $validated = $request->validate([
            'teacher_package_id' => ['required', 'uuid', 'exists:teacher_packages,id'],
            'voucher_code' => ['nullable', 'string', 'max:64'],
        ]);

        if (! empty($validated['voucher_code'])) {
            throw ValidationException::withMessages([
                'voucher_code' => ['Discount vouchers apply to single 1-on-1 lessons only and cannot be stacked on conversation packs.'],
            ]);
        }

        $teacherPackage = TeacherPackage::with('teacher.teacherProfile')->findOrFail($validated['teacher_package_id']);

        // Teacher must be verified
        if (! $teacherPackage->teacher?->teacherProfile?->is_verified) {
            if ($request->wantsJson()) {
                return response()->json(['message' => 'Cannot purchase packages for unverified teachers.'], 422);
            }

            return back()->with('error', 'Cannot purchase packages for unverified teachers.');
        }

        // Package must be active
        if (! $teacherPackage->is_active) {
            if ($request->wantsJson()) {
                return response()->json(['message' => 'This package is currently unavailable.'], 422);
            }

            return back()->with('error', 'This package is currently unavailable.');
        }

        $pupilPackage = DB::transaction(function () use ($request, $teacherPackage, $validated) {
            $basePrice = $teacherPackage->price;
            $discountVoucherId = null;
            $discountAmount = null;
            $pricePaid = $basePrice;

            // Apply voucher if provided
            if (! empty($validated['voucher_code'])) {
                /** @var UserDiscountVoucher|null $voucher */
                $voucher = UserDiscountVoucher::where('voucher_code', strtoupper(trim($validated['voucher_code'])))
                    ->where('user_id', $request->user()->id)
                    ->where('is_redeemed', false)
                    ->lockForUpdate()
                    ->first();

                if (! $voucher) {
                    throw ValidationException::withMessages([
                        'voucher_code' => 'This voucher code is invalid or has already been used.',
                    ]);
                }

                $discountAmount = (int) round(($basePrice * $voucher->discount_percent) / 100);
                $pricePaid = max(0, $basePrice - $discountAmount);
                $discountVoucherId = $voucher->id;

                // Mark redeemed — will be linked to pupil_package after creation
                $voucher->update([
                    'is_redeemed' => true,
                    'redeemed_at' => now(),
                ]);
            }

            $breakdown = app(MonetizationCalculator::class)->calculateBreakdown(
                grossAmount: $pricePaid,
                gatewayProvider: $pricePaid === 0 ? 'free_voucher' : 'humo_p2p',
            );

            $pupilPackage = PupilPackage::create([
                'pupil_id' => $request->user()->id,
                'teacher_id' => $teacherPackage->teacher_id,
                'teacher_package_id' => $teacherPackage->id,
                'package_title' => $teacherPackage->title,
                'total_minutes' => $teacherPackage->total_minutes,
                'remaining_minutes' => $teacherPackage->total_minutes,
                'price_paid' => $pricePaid,
                'gross_amount' => $breakdown['gross_amount'],
                'gateway_provider' => $pricePaid === 0 ? 'free_voucher' : 'humo_p2p',
                'gateway_fee_bps' => $breakdown['gateway_fee_bps'],
                'gateway_fee_amount' => $breakdown['gateway_fee_amount'],
                'net_cash_amount' => $breakdown['net_cash_amount'],
                'discount_voucher_id' => $discountVoucherId,
                'discount_amount' => $discountAmount,
                'payment_status' => 'verifying',
                'status' => 'pending',
            ]);

            return $pupilPackage;
        });

        $pupilPackage->load(['teacher.teacherProfile', 'pupil.pupilProfile', 'discountVoucher']);
        $request->user()->notify(new PackagePaymentPendingNotification($pupilPackage));

        if ($request->wantsJson() && ! $request->hasHeader('X-Inertia')) {
            return response()->json([
                'message' => 'Package purchase request submitted! Admin will verify payment shortly.',
                'pupil_package' => $pupilPackage,
            ], 201);
        }

        return back()->with('success', 'Package purchase request submitted! Admin will verify payment shortly.');
    }

    public function uploadReceipt(Request $request, PupilPackage $pupilPackage, HumoPaymentService $humoPaymentService)
    {
        if ($pupilPackage->pupil_id !== $request->user()->id) {
            abort(403);
        }

        $request->validate([
            'receipt' => 'nullable|file|mimes:jpeg,jpg,png,pdf,webp|max:10240',
            'receipt_text' => 'nullable|string|max:1000',
        ]);

        $fileOrText = $request->file('receipt') ?: $request->input('receipt_text');
        if (! $fileOrText) {
            return back()->with('error', 'Iltimos, chek faylini yuklang yoki chek matnini kiriting.');
        }

        $result = $humoPaymentService->claimWithReceipt(
            pupil: $request->user(),
            receiptDataOrText: $fileOrText,
            pupilPackageId: $pupilPackage->id
        );

        if ($result['status'] === 'confirmed') {
            return back()->with('success', "Paket to'lovi muvaffaqiyatli tasdiqlandi!");
        }

        if ($result['status'] === 'receipt_saved') {
            return back()->with('success', "Chek qabul qilindi. Bank to'lovi kelishi bilan avtomatik tasdiqlanadi.");
        }

        return back()->with('error', $result['message'] ?? "Chekni tasdiqlab bo'lmadi.");
    }
}

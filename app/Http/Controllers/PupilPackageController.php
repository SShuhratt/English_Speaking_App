<?php

namespace App\Http\Controllers;

use App\Models\PupilPackage;
use App\Models\TeacherPackage;
use App\Models\UserDiscountVoucher;
use App\Notifications\PackagePaymentPendingNotification;
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
     * Used by the frontend for live price previews.
     */
    public function validateVoucher(Request $request)
    {
        $validated = $request->validate([
            'voucher_code' => ['required', 'string', 'max:64'],
        ]);

        $voucher = UserDiscountVoucher::findUnusedByCode(
            $validated['voucher_code'],
            $request->user()->id
        );

        if (! $voucher) {
            return response()->json([
                'valid' => false,
                'message' => 'This voucher code is invalid or has already been used.',
            ], 422);
        }

        return response()->json([
            'valid' => true,
            'voucher_id' => $voucher->id,
            'voucher_code' => $voucher->voucher_code,
            'discount_percent' => $voucher->discount_percent,
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

            $pupilPackage = PupilPackage::create([
                'pupil_id' => $request->user()->id,
                'teacher_id' => $teacherPackage->teacher_id,
                'teacher_package_id' => $teacherPackage->id,
                'package_title' => $teacherPackage->title,
                'total_minutes' => $teacherPackage->total_minutes,
                'remaining_minutes' => $teacherPackage->total_minutes,
                'price_paid' => $pricePaid,
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
}

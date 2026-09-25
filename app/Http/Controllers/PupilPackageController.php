<?php

namespace App\Http\Controllers;

use App\Models\PupilPackage;
use App\Models\TeacherPackage;
use App\Notifications\PackagePaymentPendingNotification;
use Illuminate\Http\Request;

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
     * Pupil purchases a teacher's conversation pack.
     */
    public function purchase(Request $request)
    {
        $validated = $request->validate([
            'teacher_package_id' => ['required', 'uuid', 'exists:teacher_packages,id'],
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

        $pupilPackage = PupilPackage::create([
            'pupil_id' => $request->user()->id,
            'teacher_id' => $teacherPackage->teacher_id,
            'teacher_package_id' => $teacherPackage->id,
            'package_title' => $teacherPackage->title,
            'total_minutes' => $teacherPackage->total_minutes,
            'remaining_minutes' => $teacherPackage->total_minutes,
            'price_paid' => $teacherPackage->price,
            'payment_status' => 'verifying',
            'status' => 'pending',
        ]);

        $pupilPackage->load(['teacher.teacherProfile', 'pupil.pupilProfile']);
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

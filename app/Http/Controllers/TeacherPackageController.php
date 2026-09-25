<?php

namespace App\Http\Controllers;

use App\Models\TeacherPackage;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class TeacherPackageController extends Controller
{
    /**
     * List packages for the authenticated teacher.
     */
    public function index(Request $request)
    {
        $packages = TeacherPackage::where('teacher_id', $request->user()->id)
            ->orderBy('total_hours', 'asc')
            ->get();

        return response()->json($packages);
    }

    /**
     * Store a newly created package for the teacher.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:150'],
            'total_hours' => ['required', 'integer', 'min:1', 'max:100'],
            'price' => ['required', 'integer', 'min:1000'],
            'discount_percentage' => ['nullable', 'integer', 'min:0', 'max:100'],
            'description' => ['nullable', 'string', 'max:1000'],
        ]);

        $user = $request->user();
        $totalHours = (int) $validated['total_hours'];
        $price = (int) $validated['price'];

        $discount = $validated['discount_percentage'] ?? null;
        if (is_null($discount)) {
            $hourlyRate = (int) ($user->teacherProfile?->price ?? 0);
            if ($hourlyRate > 0 && ($hourlyRate * $totalHours) > $price) {
                $discount = (int) round((($hourlyRate * $totalHours - $price) / ($hourlyRate * $totalHours)) * 100);
            }
        }

        $normalizedTitle = trim($validated['title']);

        // Prevent duplicate title for this teacher (case-insensitive & trimmed)
        $titleExists = TeacherPackage::where('teacher_id', $user->id)
            ->whereRaw('LOWER(TRIM(title)) = ?', [mb_strtolower($normalizedTitle)])
            ->exists();

        if ($titleExists) {
            throw ValidationException::withMessages([
                'title' => ['A conversation pack with this title already exists.'],
            ]);
        }

        // Prevent duplicate duration and discount percentage for this teacher
        $durationDiscountQuery = TeacherPackage::where('teacher_id', $user->id)
            ->where('total_hours', $totalHours);

        if (is_null($discount)) {
            $durationDiscountQuery->whereNull('discount_percentage');
        } else {
            $durationDiscountQuery->where('discount_percentage', $discount);
        }

        if ($durationDiscountQuery->exists()) {
            throw ValidationException::withMessages([
                'total_hours' => ['You already have a package with this duration and discount percentage.'],
            ]);
        }

        $package = TeacherPackage::create([
            'teacher_id' => $user->id,
            'title' => $normalizedTitle,
            'total_hours' => $totalHours,
            'total_minutes' => $totalHours * 60,
            'price' => $price,
            'discount_percentage' => $discount,
            'description' => $validated['description'] ?? null,
            'is_active' => true,
        ]);

        if ($request->wantsJson()) {
            return response()->json([
                'message' => 'Conversation pack created successfully',
                'package' => $package,
            ], 201);
        }

        return back()->with('success', 'Conversation pack created successfully.');
    }

    /**
     * Update an existing package.
     */
    public function update(Request $request, string $id)
    {
        $package = TeacherPackage::findOrFail($id);

        if ($package->teacher_id !== $request->user()->id) {
            abort(403, 'Unauthorized action.');
        }

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:150'],
            'total_hours' => ['required', 'integer', 'min:1', 'max:100'],
            'price' => ['required', 'integer', 'min:1000'],
            'discount_percentage' => ['nullable', 'integer', 'min:0', 'max:100'],
            'description' => ['nullable', 'string', 'max:1000'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $totalHours = (int) $validated['total_hours'];
        $price = (int) $validated['price'];

        $discount = $validated['discount_percentage'] ?? null;
        if (is_null($discount)) {
            $hourlyRate = (int) ($request->user()->teacherProfile?->price ?? 0);
            if ($hourlyRate > 0 && ($hourlyRate * $totalHours) > $price) {
                $discount = (int) round((($hourlyRate * $totalHours - $price) / ($hourlyRate * $totalHours)) * 100);
            }
        }

        $normalizedTitle = trim($validated['title']);

        // Prevent duplicate title for this teacher (excluding this package)
        $titleExists = TeacherPackage::where('teacher_id', $request->user()->id)
            ->where('id', '!=', $package->id)
            ->whereRaw('LOWER(TRIM(title)) = ?', [mb_strtolower($normalizedTitle)])
            ->exists();

        if ($titleExists) {
            throw ValidationException::withMessages([
                'title' => ['A conversation pack with this title already exists.'],
            ]);
        }

        // Prevent duplicate duration and discount percentage for this teacher (excluding this package)
        $durationDiscountQuery = TeacherPackage::where('teacher_id', $request->user()->id)
            ->where('id', '!=', $package->id)
            ->where('total_hours', $totalHours);

        if (is_null($discount)) {
            $durationDiscountQuery->whereNull('discount_percentage');
        } else {
            $durationDiscountQuery->where('discount_percentage', $discount);
        }

        if ($durationDiscountQuery->exists()) {
            throw ValidationException::withMessages([
                'total_hours' => ['You already have a package with this duration and discount percentage.'],
            ]);
        }

        $package->update([
            'title' => $normalizedTitle,
            'total_hours' => $totalHours,
            'total_minutes' => $totalHours * 60,
            'price' => $price,
            'discount_percentage' => $discount,
            'description' => $validated['description'] ?? null,
            'is_active' => $validated['is_active'] ?? $package->is_active,
        ]);

        if ($request->wantsJson()) {
            return response()->json([
                'message' => 'Conversation pack updated successfully',
                'package' => $package,
            ]);
        }

        return back()->with('success', 'Conversation pack updated successfully.');
    }

    /**
     * Toggle active status of a package.
     */
    public function toggleActive(Request $request, string $id)
    {
        $package = TeacherPackage::findOrFail($id);

        if ($package->teacher_id !== $request->user()->id) {
            abort(403, 'Unauthorized action.');
        }

        $package->update([
            'is_active' => ! $package->is_active,
        ]);

        if ($request->wantsJson()) {
            return response()->json([
                'message' => 'Package status updated',
                'is_active' => (bool) $package->is_active,
                'package' => $package,
            ]);
        }

        return back()->with('success', 'Package status updated.');
    }

    /**
     * Delete a package. If already purchased by pupils, deactivate it instead.
     */
    public function destroy(Request $request, string $id)
    {
        $package = TeacherPackage::findOrFail($id);

        if ($package->teacher_id !== $request->user()->id) {
            abort(403, 'Unauthorized action.');
        }

        if ($package->pupilPackages()->exists()) {
            $package->update(['is_active' => false]);
            $message = 'Package has active purchases and was deactivated instead of deleted.';
            $deactivated = true;
        } else {
            $package->delete();
            $message = 'Conversation pack deleted successfully.';
            $deactivated = false;
        }

        if ($request->wantsJson()) {
            return response()->json([
                'message' => $message,
                'deactivated' => $deactivated,
            ]);
        }

        return back()->with('success', $message);
    }
}

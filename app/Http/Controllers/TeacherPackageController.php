<?php

namespace App\Http\Controllers;

use App\Models\TeacherPackage;
use Illuminate\Http\Request;

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

        $package = TeacherPackage::create([
            'teacher_id' => $user->id,
            'title' => $validated['title'],
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

        $package->update([
            'title' => $validated['title'],
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
                'is_active' => $package->is_active,
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
        } else {
            $package->delete();
            $message = 'Conversation pack deleted successfully.';
        }

        if ($request->wantsJson()) {
            return response()->json(['message' => $message]);
        }

        return back()->with('success', $message);
    }
}

<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\SlotService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;

class TeacherController extends Controller
{
    /**
     * List all teachers for pupils with filtering (all, verified, new, unverified)
     */
    public function index(Request $request, SlotService $slotService)
    {
        $statusFilter = $request->query('status', 'all');

        $query = User::where('role', 'teacher')->with('teacherProfile');

        if ($statusFilter === 'verified') {
            $query->whereHas('teacherProfile', fn ($q) => $q->where('is_verified', true));
        } elseif ($statusFilter === 'unverified') {
            $query->where(function ($q) {
                $q->whereDoesntHave('teacherProfile')
                    ->orWhereHas('teacherProfile', fn ($q2) => $q2->where('is_verified', false));
            });
        } elseif ($statusFilter === 'new') {
            $query->where('created_at', '>=', now()->subDays(7));
        }

        $teachers = $query->paginate(12)->withQueryString();

        $teachers->getCollection()->transform(function ($teacher) use ($slotService) {
            $teacher->next_slot = $slotService->getNextAvailableSlot($teacher->id);
            $teacher->is_new = $teacher->created_at >= now()->subDays(7);

            return $teacher;
        });

        return Inertia::render('pupil/teachers', [
            'teachers' => $teachers,
            'currentFilter' => $statusFilter,
        ]);
    }

    /**
     * Show teacher profile page for pupil
     */
    public function show($id)
    {
        if (! Str::isUuid($id)) {
            abort(404);
        }

        $teacher = User::where('id', $id)
            ->where('role', 'teacher')
            ->with([
                'teacherProfile',
                'feedbacks' => function ($query) {
                    $query->whereHas('author', function ($q) {
                        $q->where('role', 'pupil');
                    })->with('author');
                },
            ])
            ->firstOrFail();

        $teacher->is_new = $teacher->created_at >= now()->subDays(7);

        return Inertia::render('pupil/teacher-profile', [
            'teacher' => $teacher,
        ]);
    }

    /**
     * Show booking page for a teacher
     */
    public function showBooking(Request $request)
    {
        $teacherId = $request->query('teacher_id');

        if (! $teacherId || ! Str::isUuid($teacherId)) {
            return redirect()->route('pupil.teachers.index');
        }

        $teacher = User::where('id', $teacherId)
            ->where('role', 'teacher')
            ->with('teacherProfile')
            ->first();

        if (! $teacher) {
            return redirect()->route('pupil.teachers.index');
        }

        return Inertia::render('pupil/booking', [
            'teacher' => $teacher,
        ]);
    }
}

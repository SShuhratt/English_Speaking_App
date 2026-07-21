<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\SlotService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TeacherController extends Controller
{
    /**
     * List all teachers for pupils
     */
    public function index(SlotService $slotService)
    {
        $teachers = User::where('role', 'teacher')
            ->with('teacherProfile')
            ->paginate(12);

        $teachers->getCollection()->transform(function ($teacher) use ($slotService) {
            $teacher->next_slot = $slotService->getNextAvailableSlot($teacher->id);

            return $teacher;
        });

        return Inertia::render('pupil/teachers', [
            'teachers' => $teachers,
        ]);
    }

    /**
     * Show teacher profile page for pupil
     */
    public function show($id)
    {
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
        $teacher = User::where('id', $teacherId)
            ->where('role', 'teacher')
            ->with('teacherProfile')
            ->firstOrFail();

        return Inertia::render('pupil/booking', [
            'teacher' => $teacher,
        ]);
    }
}

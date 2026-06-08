<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TeacherController extends Controller
{
    /**
     * List all teachers for pupils
     */
    public function index()
    {
        $teachers = User::where('role', 'teacher')
            ->with('teacherProfile')
            ->paginate(12);

        return Inertia::render('pupil/teachers', [
            'teachers' => $teachers
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
            'teacher' => $teacher
        ]);
    }
}

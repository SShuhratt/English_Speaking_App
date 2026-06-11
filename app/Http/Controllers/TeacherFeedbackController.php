<?php

namespace App\Http\Controllers;

use App\Models\Feedback;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TeacherFeedbackController extends Controller
{
    /**
     * Show feedback from pupils
     */
    public function index(Request $request)
    {
        $feedbacks = Feedback::where('teacher_id', $request->user()->id)
            ->with('pupil')
            ->latest()
            ->paginate();

        return Inertia::render('teacher/feedback', [
            'feedbacks' => $feedbacks,
        ]);
    }
}

<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\Conversation;
use App\Models\Feedback;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class FeedbackController extends Controller
{
    /**
     * Store feedback for a session
     */
    public function store(Request $request)
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'appointment_id' => ['required', 'exists:appointments,id'],
            'comment_text' => ['required', 'string', 'min:3', 'max:1000'],
            'rating_score' => $user->role === 'pupil' ? ['required', 'integer', 'min:1', 'max:10'] : ['nullable'],
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator)->withInput();
        }

        $appointment = Appointment::findOrFail($request->appointment_id);

        // Verify user participates in this appointment
        if ($appointment->pupil_id !== $user->id && $appointment->teacher_id !== $user->id) {
            abort(403, 'Unauthorized action.');
        }

        // Get or create conversation for this appointment
        $conversation = Conversation::firstOrCreate(
            ['appointment_id' => $appointment->id],
            [
                'pupil_id' => $appointment->pupil_id,
                'teacher_id' => $appointment->teacher_id,
                'started_at' => $appointment->start_at,
                'ended_at' => $appointment->end_at,
            ]
        );

        // Check if this author already left feedback
        $existing = Feedback::where('conversation_id', $conversation->id)
            ->where('author_id', $user->id)
            ->first();

        if ($existing) {
            return back()->withErrors(['message' => 'You have already submitted feedback for this session.']);
        }

        // Save feedback
        Feedback::create([
            'conversation_id' => $conversation->id,
            'pupil_id' => $appointment->pupil_id,
            'teacher_id' => $appointment->teacher_id,
            'author_id' => $user->id,
            'rating_score' => $user->role === 'pupil' ? (int) $request->rating_score : null,
            'comment_text' => $request->comment_text,
        ]);

        return back()->with('success', 'Feedback submitted successfully.');
    }
}

<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PupilSessionController extends Controller
{
    public function index(Request $request)
    {
        $sessions = Appointment::where('pupil_id', $request->user()->id)
            ->with(['teacher', 'feedbacks'])
            ->latest()
            ->paginate();

        return Inertia::render('pupil/sessions', [
            'sessions' => $sessions,
        ]);
    }

    /**
     * Pupil attempts to join the meeting room.
     */
    public function join(Request $request, string $id)
    {
        $appointment = Appointment::findOrFail($id);

        if ($appointment->pupil_id !== $request->user()->id) {
            abort(403, 'Unauthorized');
        }

        if (empty($appointment->google_meet_link)) {
            return response()->json([
                'message' => 'Teacher is not ready yet',
            ], 400);
        }

        return response()->json([
            'google_meet_link' => $appointment->google_meet_link,
        ]);
    }
}

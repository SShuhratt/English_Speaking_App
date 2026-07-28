<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\Feedback;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    /**
     * Display the dashboard.
     */
    public function index(Request $request)
    {
        $user = $request->user();

        if ($user->role === 'admin') {
            return redirect()->route('admin.dashboard');
        }

        if ($user->role === 'teacher') {
            $appointments = Appointment::where('teacher_id', $user->id)
                ->whereIn('status', ['accepted', 'confirmed'])
                ->where('end_at', '>', now())
                ->with('pupil')
                ->orderBy('start_at')
                ->get();

            $sessionsTodayCount = Appointment::where('teacher_id', $user->id)
                ->whereIn('status', ['accepted', 'confirmed'])
                ->whereDate('start_at', now()->toDateString())
                ->count();

            $totalPupilsCount = Appointment::where('teacher_id', $user->id)
                ->whereIn('status', ['accepted', 'confirmed'])
                ->distinct('pupil_id')
                ->count('pupil_id');

            $averageRating = Feedback::where('teacher_id', $user->id)
                ->avg('rating_score') ?: 5.0;

            return Inertia::render('dashboard', [
                'appointments' => $appointments,
                'stats' => [
                    'sessions_today' => $sessionsTodayCount,
                    'total_pupils' => $totalPupilsCount,
                    'average_rating' => round($averageRating, 1),
                ],
            ]);
        } else {
            $appointments = Appointment::where('pupil_id', $user->id)
                ->whereIn('status', ['accepted', 'confirmed'])
                ->where('end_at', '>', now())
                ->with('teacher')
                ->orderBy('start_at')
                ->get();

            $totalSpeakingSessions = Appointment::where('pupil_id', $user->id)
                ->whereIn('status', ['confirmed', 'completed'])
                ->count();

            $upcomingSessionsCount = Appointment::where('pupil_id', $user->id)
                ->where('status', 'confirmed')
                ->where('start_at', '>', now())
                ->count();

            $recentFeedback = Feedback::where('pupil_id', $user->id)
                ->with('teacher')
                ->latest()
                ->first();

            return Inertia::render('dashboard', [
                'appointments' => $appointments,
                'stats' => [
                    'speaking_sessions' => $totalSpeakingSessions,
                    'upcoming_sessions' => $upcomingSessionsCount,
                ],
                'recentFeedback' => $recentFeedback,
            ]);
        }
    }
}

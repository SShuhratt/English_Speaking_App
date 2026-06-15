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

        if ($user->role === 'teacher') {
            $appointments = Appointment::where('teacher_id', $user->id)
                ->where('status', 'confirmed')
                ->with('pupil')
                ->orderBy('start_at')
                ->get();

            $sessionsTodayCount = Appointment::where('teacher_id', $user->id)
                ->where('status', 'confirmed')
                ->whereDate('start_at', now()->toDateString())
                ->count();

            $totalPupilsCount = Appointment::where('teacher_id', $user->id)
                ->where('status', 'confirmed')
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
                ->where('status', 'confirmed')
                ->with('teacher')
                ->orderBy('start_at')
                ->get();

            $totalSpeakingMinutes = Appointment::where('pupil_id', $user->id)
                ->where('status', 'confirmed')
                ->get()
                ->sum(function ($apt) {
                    return $apt->start_at->diffInMinutes($apt->end_at);
                });

            $speakingHours = round($totalSpeakingMinutes / 60, 1);

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
                    'speaking_hours' => $speakingHours,
                    'upcoming_sessions' => $upcomingSessionsCount,
                ],
                'recentFeedback' => $recentFeedback,
            ]);
        }
    }
}

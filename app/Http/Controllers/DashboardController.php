<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\Feedback;
use App\Models\PupilPackage;
use App\Models\TeacherProfile;
use App\Services\GamificationService;
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
                ->orderByDesc('start_at')
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

            $convStats = TeacherProfile::getConversationStats($user->id);

            return Inertia::render('dashboard', [
                'appointments' => $appointments,
                'stats' => [
                    'sessions_today' => $sessionsTodayCount,
                    'total_pupils' => $totalPupilsCount,
                    'average_rating' => round($averageRating, 1),
                    'completed_conversations' => $convStats['total_conversations'],
                    'speaking_time' => $convStats['total_time_formatted'],
                    'speaking_time_minutes' => $convStats['total_minutes'],
                ],
            ]);
        } else {
            $appointments = Appointment::where('pupil_id', $user->id)
                ->whereIn('status', ['accepted', 'confirmed'])
                ->where('end_at', '>', now())
                ->with('teacher')
                ->orderByDesc('start_at')
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

            $gamification = [
                'fluency' => GamificationService::calculateFluency($user),
                'streak' => GamificationService::getStreakInfo($user),
                'momentum' => GamificationService::getWeeklyMomentum($user),
                'leaderboard' => GamificationService::getWeeklyLeaderboard($user),
                'daily_spark' => GamificationService::getDailySpark(),
                'passport' => GamificationService::getSpeakingPassport($user),
                'badges' => GamificationService::getMilestoneBadges($user),
                'referrals' => GamificationService::getReferralStats($user),
                'new_level_up' => GamificationService::getNewLevelUp($user),
                'xp_store' => GamificationService::getXpStoreCatalog($user),
                'credential' => GamificationService::getVerifiedFluencyCredential($user),
            ];

            $activePackages = PupilPackage::where('pupil_id', $user->id)
                ->where('status', 'active')
                ->where('payment_status', 'paid')
                ->where('remaining_minutes', '>', 0)
                ->with(['teacher.teacherProfile'])
                ->orderBy('created_at', 'asc')
                ->get();

            return Inertia::render('dashboard', [
                'appointments' => $appointments,
                'stats' => [
                    'speaking_sessions' => $totalSpeakingSessions,
                    'upcoming_sessions' => $upcomingSessionsCount,
                ],
                'recentFeedback' => $recentFeedback,
                'gamification' => $gamification,
                'activePackages' => $activePackages,
            ]);
        }
    }
}

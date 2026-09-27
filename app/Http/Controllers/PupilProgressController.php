<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\AppointmentAssessment;
use App\Services\GamificationService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PupilProgressController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $pupilProfile = $user->pupilProfile;

        $completedSessions = Appointment::where('pupil_id', $user->id)
            ->whereIn('status', ['confirmed', 'completed'])
            ->count();

        $totalMinutes = Appointment::where('pupil_id', $user->id)
            ->whereIn('status', ['confirmed', 'completed'])
            ->get()
            ->sum(function ($apt) {
                return $apt->start_at->diffInMinutes($apt->end_at);
            });

        $teachersTried = Appointment::where('pupil_id', $user->id)
            ->whereIn('status', ['confirmed', 'completed'])
            ->distinct('teacher_id')
            ->count('teacher_id');

        $weeklyGoal = $pupilProfile->weekly_goal ?? 2;
        $weeklyGoals = $pupilProfile->weekly_goals ?? array_fill(0, 4, $weeklyGoal);

        $progress = [
            'completed_sessions' => $completedSessions,
            'minutes_spoken' => $totalMinutes,
            'teachers_tried' => $teachersTried,
            'weekly_goal' => $weeklyGoal,
            'weekly_goals' => $weeklyGoals,
        ];

        $gamification = [
            'fluency' => GamificationService::calculateFluency($user),
            'streak' => GamificationService::getStreakInfo($user),
            'momentum' => GamificationService::getWeeklyMomentum($user),
            'passport' => GamificationService::getSpeakingPassport($user),
            'badges' => GamificationService::getMilestoneBadges($user),
            'xp_store' => GamificationService::getXpStoreCatalog($user),
            'credential' => GamificationService::getVerifiedFluencyCredential($user),
        ];

        $assessments = AppointmentAssessment::where('pupil_id', $user->id)
            ->with(['teacher'])
            ->latest()
            ->take(10)
            ->get()
            ->map(function ($assessment) {
                return [
                    'id' => $assessment->id,
                    'overall_score' => (float) $assessment->overall_score,
                    'fluency_score' => (float) $assessment->fluency_score,
                    'lexical_score' => (float) $assessment->lexical_score,
                    'grammar_score' => (float) $assessment->grammar_score,
                    'pronunciation_score' => (float) $assessment->pronunciation_score,
                    'teacher_notes' => $assessment->teacher_notes,
                    'assessed_at' => $assessment->created_at->format('M d, Y'),
                    'teacher' => [
                        'id' => $assessment->teacher?->id,
                        'name' => $assessment->teacher?->name ?: 'Verified Instructor',
                        'avatar' => $assessment->teacher?->avatar,
                    ],
                ];
            });

        return Inertia::render('pupil/progress', [
            'progress' => $progress,
            'gamification' => $gamification,
            'assessments' => $assessments,
        ]);
    }

    public function updateGoal(Request $request)
    {
        $validated = $request->validate([
            'weekly_goal' => ['nullable', 'integer', 'min:1', 'max:350'],
            'weekly_goals' => ['nullable', 'array', 'size:4'],
            'weekly_goals.*' => ['integer', 'min:1', 'max:350'],
        ]);

        $user = $request->user();

        if (isset($validated['weekly_goals']) && count($validated['weekly_goals']) === 4) {
            $goals = array_map('intval', $validated['weekly_goals']);
            $firstGoal = $goals[0];
            $data = [
                'weekly_goal' => $firstGoal,
                'weekly_goals' => $goals,
            ];
        } else {
            $goal = (int) ($validated['weekly_goal'] ?? 2);
            $data = [
                'weekly_goal' => $goal,
                'weekly_goals' => array_fill(0, 4, $goal),
            ];
        }

        if ($user->pupilProfile) {
            $user->pupilProfile->update($data);
        } else {
            $user->pupilProfile()->create($data);
        }

        return back()->with('success', 'Weekly goal updated successfully');
    }
}

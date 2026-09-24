<?php

namespace App\Http\Controllers;

use App\Models\TeacherProfile;
use App\Models\User;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class ProfileViewController extends Controller
{
    /**
     * Show any user's profile based on their role.
     */
    public function show(string $id): Response
    {
        if (! Str::isUuid($id)) {
            abort(404);
        }

        $user = User::where('id', $id)->firstOrFail();

        if ($user->role === 'teacher') {
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

            $currentUser = auth()->user();
            $isPrivileged = $currentUser && ($currentUser->role === 'admin' || $currentUser->id === $teacher->id);

            if (! $isPrivileged && (! $teacher->teacherProfile || ! $teacher->teacherProfile->is_verified)) {
                abort(404);
            }

            if (! $isPrivileged && $teacher->teacherProfile) {
                $certs = $teacher->teacherProfile->certificates;
                if (is_string($certs)) {
                    $certs = json_decode($certs, true) ?? [];
                }
                if (is_array($certs)) {
                    $visibleCerts = [];
                    foreach ($certs as $cert) {
                        if (is_array($cert) && ($cert['status'] ?? 'pending') === 'verified') {
                            $cert['file_url'] = null;
                            $visibleCerts[] = $cert;
                        }
                    }
                    $teacher->teacherProfile->certificates = $visibleCerts;
                }
            }

            $hasEligibleTrial = ! $currentUser || ! $currentUser->hasBookedWithTeacher($teacher->id);
            $hourlyRate = (float) ($teacher->teacherProfile?->price ?? 0);
            $trialPrice = $hourlyRate > 0 ? (int) (round(($hourlyRate / 3) / 1000) * 1000) : 0;

            $conversationStats = TeacherProfile::getConversationStats($teacher->id);

            return Inertia::render('pupil/teacher-profile', [
                'teacher' => $teacher,
                'hasEligibleTrial' => $hasEligibleTrial,
                'trialPrice' => $trialPrice,
                'conversationStats' => $conversationStats,
            ]);
        }

        // Render Pupil Profile
        $pupil = User::where('id', $id)
            ->where('role', 'pupil')
            ->with('pupilProfile')
            ->firstOrFail();

        return Inertia::render('pupil/profile-view', [
            'pupil' => $pupil,
        ]);
    }
}

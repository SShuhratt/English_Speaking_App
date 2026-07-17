<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProfileViewController extends Controller
{
    /**
     * Show any user's profile based on their role.
     */
    public function show(string $id): Response
    {
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

            return Inertia::render('pupil/teacher-profile', [
                'teacher' => $teacher,
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

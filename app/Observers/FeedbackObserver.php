<?php

namespace App\Observers;

use App\Models\Feedback;
use App\Models\TeacherProfile;

class FeedbackObserver
{
    public function saved(Feedback $feedback): void
    {
        $this->updateTeacherRating($feedback->teacher_id);
    }

    public function deleted(Feedback $feedback): void
    {
        $this->updateTeacherRating($feedback->teacher_id);
    }

    private function updateTeacherRating(string $teacherId): void
    {
        // Calculate average score directly from the feedbacks table
        $average = Feedback::where('teacher_id', $teacherId)->avg('rating_score') ?? 0.0;

        // Save the score straight to the cache field on the teacher profile
        TeacherProfile::where('user_id', $teacherId)->update([
            'rating_cache' => round($average, 1)
        ]);
    }
}
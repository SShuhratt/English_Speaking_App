<?php

namespace Tests\Feature\Gamification;

use App\Models\Appointment;
use App\Models\AppointmentAssessment;
use App\Models\PupilProfile;
use App\Models\TeacherProfile;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PupilProgressGamificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_pupil_progress_page_renders_with_gamification_bundle_and_assessments(): void
    {
        $teacher = User::factory()->create([
            'role' => 'teacher',
            'name' => 'Sarah Jenkins',
        ]);
        TeacherProfile::create([
            'user_id' => $teacher->id,
            'is_verified' => true,
        ]);

        $pupil = User::factory()->create(['role' => 'pupil']);
        PupilProfile::create([
            'user_id' => $pupil->id,
            'spent_xp' => 50,
            'weekly_goal' => 3,
            'weekly_goals' => [3, 3, 4, 4],
        ]);

        $appointment = Appointment::create([
            'teacher_id' => $teacher->id,
            'pupil_id' => $pupil->id,
            'start_at' => Carbon::now()->subHours(2),
            'end_at' => Carbon::now()->subHours(1),
            'status' => 'completed',
            'topics' => ['Culture', 'Travel'],
            'price' => 100000,
        ]);

        $assessment = AppointmentAssessment::create([
            'appointment_id' => $appointment->id,
            'teacher_id' => $teacher->id,
            'pupil_id' => $pupil->id,
            'fluency_score' => 7.5,
            'lexical_score' => 7.0,
            'grammar_score' => 6.5,
            'pronunciation_score' => 7.0,
            'overall_score' => 7.0,
            'teacher_notes' => 'Great conversation skills, confident expression.',
        ]);

        $response = $this->actingAs($pupil)->get('/pupil/progress');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('pupil/progress')
            ->has('progress')
            ->has('gamification.fluency')
            ->has('gamification.streak')
            ->has('gamification.momentum')
            ->has('gamification.passport')
            ->has('gamification.badges')
            ->has('gamification.xp_store')
            ->has('gamification.credential')
            ->has('assessments', 1)
            ->where('assessments.0.id', $assessment->id)
            ->where('assessments.0.overall_score', 7)
            ->where('assessments.0.fluency_score', 7.5)
            ->where('assessments.0.teacher_notes', 'Great conversation skills, confident expression.')
            ->where('assessments.0.teacher.name', 'Sarah Jenkins')
        );
    }

    public function test_pupil_progress_handles_empty_gamification_and_no_assessments_gracefully(): void
    {
        $pupil = User::factory()->create(['role' => 'pupil']);

        $response = $this->actingAs($pupil)->get('/pupil/progress');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('pupil/progress')
            ->has('progress')
            ->has('gamification')
            ->where('gamification.fluency.default_title', 'Hesitant Explorer')
            ->where('gamification.fluency.total_xp', 0)
            ->has('assessments', 0)
        );
    }

    public function test_pupil_progress_updates_weekly_goals_without_affecting_gamification(): void
    {
        $pupil = User::factory()->create(['role' => 'pupil']);
        PupilProfile::create([
            'user_id' => $pupil->id,
            'spent_xp' => 100,
        ]);

        $response = $this->actingAs($pupil)->post('/pupil/progress/goal', [
            'weekly_goals' => [4, 4, 3, 5],
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('pupil_profiles', [
            'user_id' => $pupil->id,
            'weekly_goal' => 4,
            'spent_xp' => 100,
        ]);

        $profile = $pupil->fresh()->pupilProfile;
        $this->assertEquals([4, 4, 3, 5], $profile->weekly_goals);
    }
}

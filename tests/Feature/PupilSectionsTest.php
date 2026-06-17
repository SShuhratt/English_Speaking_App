<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\Conversation;
use App\Models\Feedback;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PupilSectionsTest extends TestCase
{
    use RefreshDatabase;

    public function test_pupil_can_access_bookings()
    {
        $pupil = User::factory()->create(['role' => 'pupil']);
        $response = $this->actingAs($pupil)->get('/pupil/bookings');
        $response->assertStatus(200);
    }

    public function test_pupil_can_access_sessions()
    {
        $pupil = User::factory()->create(['role' => 'pupil']);
        $response = $this->actingAs($pupil)->get('/pupil/sessions');
        $response->assertStatus(200);
    }

    public function test_pupil_can_access_progress()
    {
        $pupil = User::factory()->create(['role' => 'pupil']);
        $response = $this->actingAs($pupil)->get('/pupil/progress');
        $response->assertStatus(200);
    }

    public function test_pupil_can_access_teachers_list()
    {
        $pupil = User::factory()->create(['role' => 'pupil']);
        $response = $this->actingAs($pupil)->get('/pupil/teachers');
        $response->assertStatus(200);
    }

    public function test_pupil_can_view_teacher_profile()
    {
        $pupil = User::factory()->create(['role' => 'pupil']);
        $teacher = User::factory()->create(['role' => 'teacher']);

        $response = $this->actingAs($pupil)->get("/pupil/teachers/{$teacher->id}");
        $response->assertStatus(200);
    }

    public function test_pupil_sees_only_pupil_authored_feedbacks_on_teacher_profile()
    {
        $pupil = User::factory()->create(['role' => 'pupil']);
        $teacher = User::factory()->create(['role' => 'teacher']);

        $otherPupil = User::factory()->create(['role' => 'pupil']);
        $otherTeacher = User::factory()->create(['role' => 'teacher']);

        $appointment1 = Appointment::create([
            'pupil_id' => $otherPupil->id,
            'teacher_id' => $teacher->id,
            'start_at' => now()->subHour(),
            'end_at' => now(),
            'status' => 'confirmed',
        ]);

        $appointment2 = Appointment::create([
            'pupil_id' => $otherPupil->id,
            'teacher_id' => $teacher->id,
            'start_at' => now()->subHour(),
            'end_at' => now(),
            'status' => 'confirmed',
        ]);

        $conversation1 = Conversation::create([
            'appointment_id' => $appointment1->id,
            'pupil_id' => $otherPupil->id,
            'teacher_id' => $teacher->id,
            'started_at' => $appointment1->start_at,
            'ended_at' => $appointment1->end_at,
        ]);

        $conversation2 = Conversation::create([
            'appointment_id' => $appointment2->id,
            'pupil_id' => $otherPupil->id,
            'teacher_id' => $teacher->id,
            'started_at' => $appointment2->start_at,
            'ended_at' => $appointment2->end_at,
        ]);

        // Create feedback written by a pupil (otherPupil) about the teacher
        $pupilFeedback = Feedback::create([
            'conversation_id' => $conversation1->id,
            'teacher_id' => $teacher->id,
            'pupil_id' => $otherPupil->id,
            'author_id' => $otherPupil->id,
            'rating_score' => 8,
            'comment_text' => 'Great teacher!',
        ]);

        // Create feedback written by a teacher (otherTeacher)
        $teacherFeedback = Feedback::create([
            'conversation_id' => $conversation2->id,
            'teacher_id' => $teacher->id,
            'pupil_id' => $otherPupil->id,
            'author_id' => $otherTeacher->id,
            'rating_score' => 9,
            'comment_text' => 'Good session cooperation',
        ]);

        $response = $this->actingAs($pupil)->get("/pupil/teachers/{$teacher->id}");

        $response->assertStatus(200);

        // Assert the view has the teacher data with only the pupil feedback
        $response->assertInertia(fn ($page) => $page
            ->component('pupil/teacher-profile')
            ->has('teacher.feedbacks', 1)
            ->where('teacher.feedbacks.0.id', $pupilFeedback->id)
        );
    }
}

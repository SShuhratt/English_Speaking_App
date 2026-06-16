<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\User;
use App\Models\Conversation;
use App\Models\Feedback;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FeedbackTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutMiddleware(\Illuminate\Foundation\Http\Middleware\PreventRequestForgery::class);
    }

    public function test_pupil_can_submit_feedback_with_rating()
    {
        $pupil = User::factory()->create(['role' => 'pupil']);
        $teacher = User::factory()->create(['role' => 'teacher']);
        
        $appointment = Appointment::create([
            'pupil_id' => $pupil->id,
            'teacher_id' => $teacher->id,
            'start_at' => now()->subHour(),
            'end_at' => now(),
            'status' => 'confirmed',
        ]);

        $response = $this->actingAs($pupil)->post('/feedback', [
            'appointment_id' => $appointment->id,
            'rating_score' => 8,
            'comment_text' => 'Great English practice session today!',
        ]);

        $response->assertRedirect();
        
        $this->assertDatabaseHas('feedbacks', [
            'pupil_id' => $pupil->id,
            'teacher_id' => $teacher->id,
            'author_id' => $pupil->id,
            'rating_score' => 8,
            'comment_text' => 'Great English practice session today!',
        ]);

        $conversation = Conversation::where('appointment_id', $appointment->id)->first();
        $this->assertNotNull($conversation);
    }

    public function test_teacher_can_submit_feedback_without_rating()
    {
        $pupil = User::factory()->create(['role' => 'pupil']);
        $teacher = User::factory()->create(['role' => 'teacher']);
        
        $appointment = Appointment::create([
            'pupil_id' => $pupil->id,
            'teacher_id' => $teacher->id,
            'start_at' => now()->subHour(),
            'end_at' => now(),
            'status' => 'confirmed',
        ]);

        $response = $this->actingAs($teacher)->post('/feedback', [
            'appointment_id' => $appointment->id,
            'comment_text' => 'The pupil spoke fluently but should focus on past tense pronunciation.',
        ]);

        $response->assertRedirect();
        
        $this->assertDatabaseHas('feedbacks', [
            'pupil_id' => $pupil->id,
            'teacher_id' => $teacher->id,
            'author_id' => $teacher->id,
            'rating_score' => null,
            'comment_text' => 'The pupil spoke fluently but should focus on past tense pronunciation.',
        ]);
    }

    public function test_unauthorized_user_cannot_submit_feedback()
    {
        $pupil = User::factory()->create(['role' => 'pupil']);
        $teacher = User::factory()->create(['role' => 'teacher']);
        $otherUser = User::factory()->create(['role' => 'pupil']);
        
        $appointment = Appointment::create([
            'pupil_id' => $pupil->id,
            'teacher_id' => $teacher->id,
            'start_at' => now()->subHour(),
            'end_at' => now(),
            'status' => 'confirmed',
        ]);

        $response = $this->actingAs($otherUser)->post('/feedback', [
            'appointment_id' => $appointment->id,
            'rating_score' => 7,
            'comment_text' => 'Sneaky feedback submission.',
        ]);

        $response->assertStatus(403);
        $this->assertDatabaseEmpty('feedbacks');
    }

    public function test_user_cannot_submit_duplicate_feedback()
    {
        $pupil = User::factory()->create(['role' => 'pupil']);
        $teacher = User::factory()->create(['role' => 'teacher']);
        
        $appointment = Appointment::create([
            'pupil_id' => $pupil->id,
            'teacher_id' => $teacher->id,
            'start_at' => now()->subHour(),
            'end_at' => now(),
            'status' => 'confirmed',
        ]);

        // First feedback
        $this->actingAs($pupil)->post('/feedback', [
            'appointment_id' => $appointment->id,
            'rating_score' => 9,
            'comment_text' => 'First attempt comment.',
        ]);

        // Second feedback (duplicate)
        $response = $this->actingAs($pupil)->post('/feedback', [
            'appointment_id' => $appointment->id,
            'rating_score' => 5,
            'comment_text' => 'Duplicate attempt comment.',
        ]);

        $response->assertSessionHasErrors(['message']);
        
        $this->assertDatabaseCount('feedbacks', 1);
        $this->assertDatabaseHas('feedbacks', [
            'comment_text' => 'First attempt comment.',
        ]);
    }
}

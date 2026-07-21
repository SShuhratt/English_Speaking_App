<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SessionsAndProgressTest extends TestCase
{
    use RefreshDatabase;

    public function test_booking_requests_only_contains_pending_appointments(): void
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        $pupil = User::factory()->create(['role' => 'pupil']);

        $pending = Appointment::create([
            'teacher_id' => $teacher->id,
            'pupil_id' => $pupil->id,
            'start_at' => now()->addDay(),
            'end_at' => now()->addDay()->addMinutes(30),
            'status' => 'pending',
        ]);

        $confirmed = Appointment::create([
            'teacher_id' => $teacher->id,
            'pupil_id' => $pupil->id,
            'start_at' => now()->addDays(2),
            'end_at' => now()->addDays(2)->addMinutes(30),
            'status' => 'confirmed',
        ]);

        $response = $this->actingAs($teacher)->getJson('/teacher/appointments');

        $response->assertStatus(200);
        $data = $response->json('data');

        $this->assertCount(1, $data);
        $this->assertEquals($pending->id, $data[0]['id']);
    }

    public function test_teacher_sessions_excludes_pending_appointments(): void
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        $pupil = User::factory()->create(['role' => 'pupil']);

        $pending = Appointment::create([
            'teacher_id' => $teacher->id,
            'pupil_id' => $pupil->id,
            'start_at' => now()->addDay(),
            'end_at' => now()->addDay()->addMinutes(30),
            'status' => 'pending',
        ]);

        $confirmed = Appointment::create([
            'teacher_id' => $teacher->id,
            'pupil_id' => $pupil->id,
            'start_at' => now()->subDay(),
            'end_at' => now()->subDay()->addMinutes(30),
            'status' => 'confirmed',
        ]);

        $response = $this->actingAs($teacher)->get('/teacher/sessions');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('teacher/sessions')
            ->has('appointments.data', 1)
            ->where('appointments.data.0.id', $confirmed->id)
        );
    }

    public function test_pupil_progress_calculates_speaking_sessions_and_goal(): void
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        $pupil = User::factory()->create(['role' => 'pupil']);
        $pupil->pupilProfile()->create(['weekly_goal' => 4]);

        Appointment::create([
            'teacher_id' => $teacher->id,
            'pupil_id' => $pupil->id,
            'start_at' => now()->subDays(2),
            'end_at' => now()->subDays(2)->addMinutes(30),
            'status' => 'confirmed',
        ]);

        $response = $this->actingAs($pupil)->get('/pupil/progress');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('pupil/progress')
            ->where('progress.completed_sessions', 1)
            ->where('progress.weekly_goal', 4)
        );
    }

    public function test_pupil_can_update_weekly_goal_with_validation(): void
    {
        $pupil = User::factory()->create(['role' => 'pupil']);

        // Test valid goal update (3 sessions)
        $response = $this->actingAs($pupil)->post('/pupil/progress/goal', [
            'weekly_goal' => 3,
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('pupil_profiles', [
            'user_id' => $pupil->id,
            'weekly_goal' => 3,
        ]);

        // Test invalid goal update (> 350)
        $invalidResponse = $this->actingAs($pupil)->post('/pupil/progress/goal', [
            'weekly_goal' => 400,
        ]);

        $invalidResponse->assertSessionHasErrors(['weekly_goal']);
    }
}

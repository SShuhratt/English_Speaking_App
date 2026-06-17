<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\TeacherAvailability;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AppointmentLifecycleTest extends TestCase
{
    use RefreshDatabase;

    public function test_pupil_can_delete_their_expired_appointment(): void
    {
        $pupil = User::factory()->create(['role' => 'pupil']);
        $teacher = User::factory()->create(['role' => 'teacher']);

        $appointment = Appointment::create([
            'teacher_id' => $teacher->id,
            'pupil_id' => $pupil->id,
            'start_at' => Carbon::now()->subHours(2),
            'end_at' => Carbon::now()->subHour(),
            'status' => 'confirmed',
        ]);

        $response = $this->actingAs($pupil)->deleteJson("/appointments/{$appointment->id}");

        $response->assertStatus(200);
        $response->assertJson(['message' => 'Appointment deleted successfully']);
        $this->assertDatabaseMissing('appointments', ['id' => $appointment->id]);
    }

    public function test_teacher_can_delete_their_expired_appointment(): void
    {
        $pupil = User::factory()->create(['role' => 'pupil']);
        $teacher = User::factory()->create(['role' => 'teacher']);

        $appointment = Appointment::create([
            'teacher_id' => $teacher->id,
            'pupil_id' => $pupil->id,
            'start_at' => Carbon::now()->subHours(2),
            'end_at' => Carbon::now()->subHour(),
            'status' => 'confirmed',
        ]);

        $response = $this->actingAs($teacher)->deleteJson("/appointments/{$appointment->id}");

        $response->assertStatus(200);
        $response->assertJson(['message' => 'Appointment deleted successfully']);
        $this->assertDatabaseMissing('appointments', ['id' => $appointment->id]);
    }

    public function test_unauthorized_user_cannot_delete_expired_appointment(): void
    {
        $pupil = User::factory()->create(['role' => 'pupil']);
        $teacher = User::factory()->create(['role' => 'teacher']);
        $otherUser = User::factory()->create(['role' => 'pupil']);

        $appointment = Appointment::create([
            'teacher_id' => $teacher->id,
            'pupil_id' => $pupil->id,
            'start_at' => Carbon::now()->subHours(2),
            'end_at' => Carbon::now()->subHour(),
            'status' => 'confirmed',
        ]);

        $response = $this->actingAs($otherUser)->deleteJson("/appointments/{$appointment->id}");

        $response->assertStatus(403);
        $this->assertDatabaseHas('appointments', ['id' => $appointment->id]);
    }

    public function test_cannot_delete_active_or_upcoming_appointments(): void
    {
        $pupil = User::factory()->create(['role' => 'pupil']);
        $teacher = User::factory()->create(['role' => 'teacher']);

        $appointment = Appointment::create([
            'teacher_id' => $teacher->id,
            'pupil_id' => $pupil->id,
            'start_at' => Carbon::now()->addHour(),
            'end_at' => Carbon::now()->addHours(2),
            'status' => 'confirmed',
        ]);

        $response = $this->actingAs($pupil)->deleteJson("/appointments/{$appointment->id}");

        $response->assertStatus(400);
        $response->assertJson(['message' => 'Cannot delete active or upcoming appointments.']);
        $this->assertDatabaseHas('appointments', ['id' => $appointment->id]);
    }

    public function test_scheduled_task_prunes_expired_custom_availabilities(): void
    {
        // Freeze time to midnight so the daily schedule task is due
        Carbon::setTestNow(Carbon::today());

        $teacher = User::factory()->create(['role' => 'teacher']);

        // 1. Expired custom availability (expired relative to Carbon::today())
        $expiredCustom = TeacherAvailability::create([
            'teacher_id' => $teacher->id,
            'type' => 'custom',
            'start_at' => Carbon::now()->subHours(2),
            'end_at' => Carbon::now()->subHour(),
            'slot_duration' => 30,
        ]);

        // 2. Active/Future custom availability
        $futureCustom = TeacherAvailability::create([
            'teacher_id' => $teacher->id,
            'type' => 'custom',
            'start_at' => Carbon::now()->addHour(),
            'end_at' => Carbon::now()->addHours(2),
            'slot_duration' => 30,
        ]);

        // 3. Recurring availability
        $recurringAvail = TeacherAvailability::create([
            'teacher_id' => $teacher->id,
            'type' => 'recurring',
            'day_of_week' => 'monday',
            'start_time' => '09:00:00',
            'end_time' => '12:00:00',
            'slot_duration' => 30,
        ]);

        // Run the scheduled task
        $this->artisan('schedule:run');

        // Assert that the expired custom availability is deleted
        $this->assertDatabaseMissing('teacher_availabilities', ['id' => $expiredCustom->id]);

        // Release frozen time
        Carbon::setTestNow();

        // Assert that the future custom and recurring availabilities are preserved
        $this->assertDatabaseHas('teacher_availabilities', ['id' => $futureCustom->id]);
        $this->assertDatabaseHas('teacher_availabilities', ['id' => $recurringAvail->id]);
    }
}

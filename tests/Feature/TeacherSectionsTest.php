<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\TeacherAvailability;
use App\Models\User;
use App\Services\GoogleCalendarService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TeacherSectionsTest extends TestCase
{
    use RefreshDatabase;

    public function test_teacher_can_access_schedule()
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        $response = $this->actingAs($teacher)->get('/teacher/schedule');
        $response->assertStatus(200);
    }

    public function test_teacher_can_access_availability()
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        $response = $this->actingAs($teacher)->get('/teacher/availability');
        $response->assertStatus(200);
    }

    public function test_teacher_can_access_sessions()
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        $response = $this->actingAs($teacher)->get('/teacher/sessions');
        $response->assertStatus(200);
    }

    public function test_teacher_can_access_feedback()
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        $response = $this->actingAs($teacher)->get('/teacher/feedback');
        $response->assertStatus(200);
    }

    public function test_teacher_can_store_availability()
    {
        $teacher = User::factory()->create(['role' => 'teacher']);

        $response = $this->actingAs($teacher)->post('/teacher/availability', [
            'type' => 'recurring',
            'day_of_week' => 'monday',
            'start_time' => '09:00',
            'end_time' => '17:00',
            'slot_duration' => 30,
        ]);

        $response->assertRedirect();

        $this->assertDatabaseHas('teacher_availabilities', [
            'teacher_id' => $teacher->id,
            'type' => 'recurring',
            'day_of_week' => 'monday',
            'start_time' => '09:00',
            'end_time' => '17:00',
            'slot_duration' => 30,
        ]);
    }

    public function test_teacher_can_store_custom_availability()
    {
        $teacher = User::factory()->create(['role' => 'teacher']);

        $response = $this->actingAs($teacher)->post('/teacher/availability', [
            'type' => 'custom',
            'start_at' => '2026-06-15 09:00:00',
            'end_at' => '2026-06-15 17:00:00',
            'slot_duration' => 30,
        ]);

        $response->assertRedirect();

        $this->assertDatabaseHas('teacher_availabilities', [
            'teacher_id' => $teacher->id,
            'type' => 'custom',
            'start_at' => '2026-06-15 09:00:00',
            'end_at' => '2026-06-15 17:00:00',
            'slot_duration' => 30,
        ]);
    }

    public function test_teacher_can_delete_availability()
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        $availability = TeacherAvailability::create([
            'teacher_id' => $teacher->id,
            'type' => 'recurring',
            'day_of_week' => 'monday',
            'start_time' => '09:00',
            'end_time' => '17:00',
            'slot_duration' => 30,
            'is_active' => true,
        ]);

        $response = $this->actingAs($teacher)->delete("/teacher/availability/{$availability->id}");

        $response->assertRedirect();

        $this->assertDatabaseMissing('teacher_availabilities', [
            'id' => $availability->id,
        ]);
    }

    public function test_teacher_can_update_availability()
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        $availability = TeacherAvailability::create([
            'teacher_id' => $teacher->id,
            'type' => 'recurring',
            'day_of_week' => 'monday',
            'start_time' => '09:00',
            'end_time' => '17:00',
            'slot_duration' => 30,
            'is_active' => true,
        ]);

        $response = $this->actingAs($teacher)->put("/teacher/availability/{$availability->id}", [
            'type' => 'recurring',
            'day_of_week' => 'tuesday',
            'start_time' => '10:00',
            'end_time' => '18:00',
            'slot_duration' => 45,
        ]);

        $response->assertRedirect();

        $this->assertDatabaseHas('teacher_availabilities', [
            'id' => $availability->id,
            'day_of_week' => 'tuesday',
            'start_time' => '10:00:00',
            'end_time' => '18:00:00',
            'slot_duration' => 45,
        ]);
    }

    public function test_teacher_can_delete_availability_range()
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        $availability = TeacherAvailability::create([
            'teacher_id' => $teacher->id,
            'type' => 'recurring',
            'day_of_week' => 'monday',
            'start_time' => '09:00:00',
            'end_time' => '17:00:00',
            'slot_duration' => 30,
            'is_active' => true,
        ]);

        $response = $this->actingAs($teacher)->delete("/teacher/availability/{$availability->id}", [
            'delete_type' => 'range',
            'range_start' => '2026-08-03T09:00:00',
            'range_end' => '2026-08-03T12:00:00',
        ]);

        $response->assertRedirect();

        $this->assertDatabaseHas('teacher_availabilities', [
            'id' => $availability->id,
            'start_time' => '12:00:00',
            'end_time' => '17:00:00',
        ]);
    }

    public function test_teacher_delete_non_existent_availability_handles_gracefully()
    {
        $teacher = User::factory()->create(['role' => 'teacher']);

        $response = $this->actingAs($teacher)->delete('/teacher/availability/9ca00000-0000-0000-0000-000000000000');

        $response->assertRedirect();
        $response->assertSessionHasErrors(['range']);
    }

    public function test_teacher_can_delete_custom_availability()
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        $availability = TeacherAvailability::create([
            'teacher_id' => $teacher->id,
            'type' => 'custom',
            'start_at' => '2026-08-10 09:00:00',
            'end_at' => '2026-08-10 17:00:00',
            'slot_duration' => 30,
            'is_active' => true,
        ]);

        $response = $this->actingAs($teacher)->delete("/teacher/availability/{$availability->id}");

        $response->assertRedirect();
        $this->assertDatabaseMissing('teacher_availabilities', [
            'id' => $availability->id,
        ]);
    }

    public function test_teacher_can_delete_custom_availability_range()
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        $availability = TeacherAvailability::create([
            'teacher_id' => $teacher->id,
            'type' => 'custom',
            'start_at' => '2026-08-10 09:00:00',
            'end_at' => '2026-08-10 17:00:00',
            'slot_duration' => 30,
            'is_active' => true,
        ]);

        $response = $this->actingAs($teacher)->delete("/teacher/availability/{$availability->id}", [
            'delete_type' => 'range',
            'range_start' => '2026-08-10T09:00:00Z',
            'range_end' => '2026-08-10T12:00:00Z',
        ]);

        $response->assertRedirect();

        $this->assertDatabaseHas('teacher_availabilities', [
            'id' => $availability->id,
            'start_at' => '2026-08-10 12:00:00',
            'end_at' => '2026-08-10 17:00:00',
        ]);
    }

    public function test_teacher_cannot_start_meeting_if_google_calendar_not_connected(): void
    {
        $teacher = User::factory()->create([
            'role' => 'teacher',
            'google_connected' => false,
            'google_refresh_token' => null,
        ]);
        $pupil = User::factory()->create(['role' => 'pupil']);

        $appointment = Appointment::create([
            'teacher_id' => $teacher->id,
            'pupil_id' => $pupil->id,
            'start_at' => now()->addMinutes(10),
            'end_at' => now()->addMinutes(40),
            'status' => 'confirmed',
        ]);

        $response = $this->actingAs($teacher)
            ->postJson("/teacher/appointments/{$appointment->id}/start");

        $response->assertStatus(422);
        $response->assertJson([
            'requires_google_calendar' => true,
        ]);

        $this->assertNull($appointment->fresh()->google_meet_link);
    }

    public function test_teacher_starts_meeting_with_google_calendar_connected(): void
    {
        $teacher = User::factory()->create([
            'role' => 'teacher',
            'google_connected' => true,
            'google_refresh_token' => 'mock-refresh-token',
        ]);
        $pupil = User::factory()->create(['role' => 'pupil']);

        $appointment = Appointment::create([
            'teacher_id' => $teacher->id,
            'pupil_id' => $pupil->id,
            'start_at' => now()->addMinutes(10),
            'end_at' => now()->addMinutes(40),
            'status' => 'confirmed',
        ]);

        $mockCalendar = \Mockery::mock(GoogleCalendarService::class);
        $mockCalendar->shouldReceive('createEvent')
            ->once()
            ->andReturn([
                'event_id' => 'google-event-123',
                'meet_link' => 'https://meet.google.com/real-meet-link',
            ]);
        $this->app->instance(GoogleCalendarService::class, $mockCalendar);

        $response = $this->actingAs($teacher)
            ->postJson("/teacher/appointments/{$appointment->id}/start");

        $response->assertOk();
        $response->assertJson([
            'message' => 'Conversation started',
            'google_meet_link' => 'https://meet.google.com/real-meet-link',
        ]);

        $fresh = $appointment->fresh();
        $this->assertEquals('https://meet.google.com/real-meet-link', $fresh->google_meet_link);
        $this->assertEquals('google-event-123', $fresh->google_event_id);
        $this->assertTrue($fresh->meeting_started);
    }

    public function test_teacher_cannot_start_expired_meeting(): void
    {
        $teacher = User::factory()->create([
            'role' => 'teacher',
            'google_connected' => true,
            'google_refresh_token' => 'mock-refresh-token',
        ]);
        $pupil = User::factory()->create(['role' => 'pupil']);

        $appointment = Appointment::create([
            'teacher_id' => $teacher->id,
            'pupil_id' => $pupil->id,
            'start_at' => now()->subMinutes(60),
            'end_at' => now()->subMinutes(10), // Expired
            'status' => 'confirmed',
        ]);

        $response = $this->actingAs($teacher)
            ->postJson("/teacher/appointments/{$appointment->id}/start");

        $response->assertStatus(403);
    }

    public function test_non_owner_teacher_cannot_start_meeting(): void
    {
        $ownerTeacher = User::factory()->create(['role' => 'teacher']);
        $otherTeacher = User::factory()->create(['role' => 'teacher', 'google_connected' => true, 'google_refresh_token' => 'token']);
        $pupil = User::factory()->create(['role' => 'pupil']);

        $appointment = Appointment::create([
            'teacher_id' => $ownerTeacher->id,
            'pupil_id' => $pupil->id,
            'start_at' => now()->addMinutes(10),
            'end_at' => now()->addMinutes(40),
            'status' => 'confirmed',
        ]);

        $response = $this->actingAs($otherTeacher)
            ->postJson("/teacher/appointments/{$appointment->id}/start");

        $response->assertStatus(403);
    }

    public function test_starting_already_started_meeting_returns_existing_link_without_creating_new_event(): void
    {
        $teacher = User::factory()->create([
            'role' => 'teacher',
            'google_connected' => true,
            'google_refresh_token' => 'mock-refresh-token',
        ]);
        $pupil = User::factory()->create(['role' => 'pupil']);

        $appointment = Appointment::create([
            'teacher_id' => $teacher->id,
            'pupil_id' => $pupil->id,
            'start_at' => now()->addMinutes(10),
            'end_at' => now()->addMinutes(40),
            'status' => 'confirmed',
            'meeting_started' => true,
            'google_event_id' => 'existing-event-id',
            'google_meet_link' => 'https://meet.google.com/existing-room',
        ]);

        // Mock calendar service should NOT receive any createEvent calls
        $mockCalendar = \Mockery::mock(GoogleCalendarService::class);
        $mockCalendar->shouldNotReceive('createEvent');
        $this->app->instance(GoogleCalendarService::class, $mockCalendar);

        $response = $this->actingAs($teacher)
            ->postJson("/teacher/appointments/{$appointment->id}/start");

        $response->assertOk();
        $response->assertJson([
            'google_meet_link' => 'https://meet.google.com/existing-room',
        ]);
    }
}

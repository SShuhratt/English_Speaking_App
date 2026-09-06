<?php

namespace Tests\Feature;

use App\Events\BookingUpdated;
use App\Models\Appointment;
use App\Models\TeacherAvailability;
use App\Models\User;
use App\Services\GoogleCalendarService;
use App\Services\SlotService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithoutMiddleware;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

class BookingWorkflowTest extends TestCase
{
    use RefreshDatabase, WithoutMiddleware;

    public function test_pupil_can_book_an_appointment_and_it_is_pending()
    {
        Event::fake([BookingUpdated::class]);

        $teacher = User::factory()->create(['role' => 'teacher']);
        $pupil = User::factory()->create(['role' => 'pupil']);

        // Create availability for a Monday
        TeacherAvailability::create([
            'teacher_id' => $teacher->id,
            'type' => 'recurring',
            'day_of_week' => 'monday',
            'start_time' => '09:00:00',
            'end_time' => '12:00:00',
            'slot_duration' => 60,
        ]);

        $startAt = Carbon::parse('next monday 09:00:00', 'Asia/Tashkent');
        $endAt = $startAt->copy()->addHour();

        $response = $this->actingAs($pupil)->postJson('/bookings', [
            'teacher_id' => $teacher->id,
            'pupil_id' => $pupil->id,
            'start_at' => $startAt->toDateTimeString(),
            'end_at' => $endAt->toDateTimeString(),
            'topics' => ['freestyle'],
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('appointments', [
            'teacher_id' => $teacher->id,
            'pupil_id' => $pupil->id,
            'status' => 'pending',
        ]);

        Event::assertDispatched(BookingUpdated::class);
    }

    public function test_teacher_can_approve_an_appointment()
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        $pupil = User::factory()->create(['role' => 'pupil']);

        $appointment = Appointment::create([
            'teacher_id' => $teacher->id,
            'pupil_id' => $pupil->id,
            'start_at' => now()->addDay(),
            'end_at' => now()->addDay()->addHour(),
            'status' => 'pending',
            'topics' => ['freestyle'],
        ]);

        $response = $this->actingAs($teacher)->postJson("/teacher/appointments/{$appointment->id}/approve");

        $response->assertStatus(200);
        $this->assertDatabaseHas('appointments', [
            'id' => $appointment->id,
            'status' => 'accepted',
            'payment_status' => 'verifying',
        ]);
    }

    public function test_teacher_can_reject_an_appointment()
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        $pupil = User::factory()->create(['role' => 'pupil']);

        $appointment = Appointment::create([
            'teacher_id' => $teacher->id,
            'pupil_id' => $pupil->id,
            'start_at' => now()->addDay(),
            'end_at' => now()->addDay()->addHour(),
            'status' => 'pending',
            'topics' => ['freestyle'],
        ]);

        $response = $this->actingAs($teacher)->postJson("/teacher/appointments/{$appointment->id}/reject", [
            'reason' => 'Schedule conflict',
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('appointments', [
            'id' => $appointment->id,
            'status' => 'rejected',
            'cancellation_reason' => 'Schedule conflict',
        ]);
    }

    public function test_teacher_can_start_conversation_and_generate_link()
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
            'start_at' => now()->addDay(),
            'end_at' => now()->addDay()->addHour(),
            'status' => 'confirmed',
            'topics' => ['freestyle'],
        ]);

        $mockCalendar = \Mockery::mock(GoogleCalendarService::class);
        $mockCalendar->shouldReceive('createEvent')
            ->once()
            ->andReturn([
                'event_id' => 'google-event-test-123',
                'meet_link' => 'https://meet.google.com/test-meet-link',
            ]);
        $this->app->instance(GoogleCalendarService::class, $mockCalendar);

        $response = $this->actingAs($teacher)->postJson("/teacher/appointments/{$appointment->id}/start");

        $response->assertStatus(200);
        $response->assertJsonStructure(['google_meet_link']);
        $this->assertEquals('https://meet.google.com/test-meet-link', $appointment->fresh()->google_meet_link);
    }

    public function test_booking_conflict_returns_422_status()
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        $pupil = User::factory()->create(['role' => 'pupil']);
        $otherPupil = User::factory()->create(['role' => 'pupil']);

        TeacherAvailability::create([
            'teacher_id' => $teacher->id,
            'type' => 'recurring',
            'day_of_week' => 'monday',
            'start_time' => '09:00:00',
            'end_time' => '12:00:00',
            'slot_duration' => 60,
        ]);

        $startAt = Carbon::parse('next monday 09:00:00', 'Asia/Tashkent');
        $endAt = $startAt->copy()->addHour();

        // Book it first
        Appointment::create([
            'teacher_id' => $teacher->id,
            'pupil_id' => $pupil->id,
            'start_at' => $startAt->copy()->utc(),
            'end_at' => $endAt->copy()->utc(),
            'status' => 'confirmed',
            'topics' => ['freestyle'],
        ]);

        // Attempt to book the same slot again
        $response = $this->actingAs($otherPupil)->postJson('/bookings', [
            'teacher_id' => $teacher->id,
            'pupil_id' => $otherPupil->id,
            'start_at' => $startAt->toDateTimeString(),
            'end_at' => $endAt->toDateTimeString(),
            'topics' => ['freestyle'],
        ]);

        $response->assertStatus(422);
        $response->assertJson([
            'message' => 'Time slot already booked.',
        ]);
    }

    public function test_booking_custom_time_matching_availability()
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        $pupil = User::factory()->create(['role' => 'pupil']);

        // Teacher availability from 01:30 PM to 06:30 PM on Monday
        TeacherAvailability::create([
            'teacher_id' => $teacher->id,
            'type' => 'recurring',
            'day_of_week' => 'monday',
            'start_time' => '13:30:00',
            'end_time' => '18:30:00',
            'slot_duration' => 30,
        ]);

        $monday = Carbon::parse('next monday', 'Asia/Tashkent');

        // 1. Time starting before 01:30 PM (e.g., 01:00 PM to 02:00 PM)
        $startBefore = $monday->copy()->setTime(13, 0, 0);
        $endBefore = $monday->copy()->setTime(14, 0, 0);
        $response = $this->actingAs($pupil)->postJson('/bookings', [
            'teacher_id' => $teacher->id,
            'pupil_id' => $pupil->id,
            'start_at' => $startBefore->toDateTimeString(),
            'end_at' => $endBefore->toDateTimeString(),
            'topics' => ['freestyle'],
        ]);
        $response->assertStatus(422);
        $response->assertJson([
            'message' => "not suitable to teacher's availability",
        ]);

        // 2. Time ending after 06:30 PM (e.g., 06:00 PM to 07:00 PM)
        $startAfter = $monday->copy()->setTime(18, 0, 0);
        $endAfter = $monday->copy()->setTime(19, 0, 0);
        $response = $this->actingAs($pupil)->postJson('/bookings', [
            'teacher_id' => $teacher->id,
            'pupil_id' => $pupil->id,
            'start_at' => $startAfter->toDateTimeString(),
            'end_at' => $endAfter->toDateTimeString(),
            'topics' => ['freestyle'],
        ]);
        $response->assertStatus(422);
        $response->assertJson([
            'message' => "not suitable to teacher's availability",
        ]);

        // 3. Time fully within availability (e.g., 02:48 PM to 03:17 PM)
        $startValid = $monday->copy()->setTime(14, 48, 0);
        $endValid = $monday->copy()->setTime(15, 17, 0);
        $response = $this->actingAs($pupil)->postJson('/bookings', [
            'teacher_id' => $teacher->id,
            'pupil_id' => $pupil->id,
            'start_at' => $startValid->toDateTimeString(),
            'end_at' => $endValid->toDateTimeString(),
            'topics' => ['freestyle'],
        ]);
        $response->assertStatus(201);
    }

    public function test_booking_custom_date_availability()
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        $pupil = User::factory()->create(['role' => 'pupil']);

        // Custom availability on 16.06.2026 from 02:55 AM (UTC 02:55:00) to 05:00 PM (UTC 17:00:00)
        TeacherAvailability::create([
            'teacher_id' => $teacher->id,
            'type' => 'custom',
            'start_at' => Carbon::parse('2026-06-16 02:55:00'),
            'end_at' => Carbon::parse('2026-06-16 17:00:00'),
            'slot_duration' => 30,
            'is_active' => true,
        ]);

        // Requesting 02:12 PM (14:12) to 02:42 PM (14:42) on 2026-06-16 UTC
        $startValid = Carbon::parse('2026-06-16 14:12:00');
        $endValid = Carbon::parse('2026-06-16 14:42:00');

        $response = $this->actingAs($pupil)->postJson('/bookings', [
            'teacher_id' => $teacher->id,
            'pupil_id' => $pupil->id,
            'start_at' => $startValid->toIso8601String(),
            'end_at' => $endValid->toIso8601String(),
            'topics' => ['freestyle'],
        ]);

        $response->assertStatus(201);
    }

    public function test_get_available_slots_all_time()
    {
        Carbon::setTestNow(Carbon::parse('2026-07-20 08:00:00', 'Asia/Tashkent'));

        $teacher = User::factory()->create(['role' => 'teacher']);

        // Teacher availability: Monday 09:00:00 to 12:00:00
        TeacherAvailability::create([
            'teacher_id' => $teacher->id,
            'type' => 'recurring',
            'day_of_week' => 'monday',
            'start_time' => '09:00:00',
            'end_time' => '12:00:00',
            'slot_duration' => 30,
        ]);

        $monday = Carbon::parse('next monday', 'Asia/Tashkent');
        $dateStr = $monday->toDateString();

        // Initially we should have 6 30-min slots: 09:00 to 12:00
        $slots = app(SlotService::class)->getAvailableSlots($teacher->id, $dateStr);

        $this->assertCount(6, $slots);

        Appointment::create([
            'teacher_id' => $teacher->id,
            'pupil_id' => User::factory()->create(['role' => 'pupil'])->id,
            'start_at' => Carbon::parse("{$dateStr} 10:00:00", 'Asia/Tashkent'),
            'end_at' => Carbon::parse("{$dateStr} 11:00:00", 'Asia/Tashkent'),
            'status' => 'confirmed',
            'topics' => ['freestyle'],
        ]);

        Cache::forget("teacher:{$teacher->id}:slots:{$dateStr}");
        $slots = app(SlotService::class)->getAvailableSlots($teacher->id, $dateStr);
        // Should remove 10:00-10:30 and 10:30-11:00, leaving 4 available slots
        $this->assertCount(4, $slots);

        Carbon::setTestNow();
    }

    public function test_pupil_can_book_with_iso_utc_timestamp_and_matches_tashkent_availability()
    {
        Event::fake([BookingUpdated::class]);

        $teacher = User::factory()->create(['role' => 'teacher']);
        $pupil = User::factory()->create(['role' => 'pupil']);

        // Teacher has availability on Sunday from 14:00 to 20:00 Asia/Tashkent
        TeacherAvailability::create([
            'teacher_id' => $teacher->id,
            'type' => 'recurring',
            'day_of_week' => 'sunday',
            'start_time' => '14:00:00',
            'end_time' => '20:00:00',
            'slot_duration' => 30,
        ]);

        // Pupil chooses 15:00:00 to 16:00:00 Asia/Tashkent (which is 10:00:00 to 11:00:00 UTC)
        $sundayTashkent = Carbon::parse('next sunday 15:00:00', 'Asia/Tashkent');
        $startUtcIso = $sundayTashkent->copy()->utc()->toISOString(); // "2026-...T10:00:00.000000Z"
        $endUtcIso = $sundayTashkent->copy()->addHour()->utc()->toISOString(); // "2026-...T11:00:00.000000Z"

        $response = $this->actingAs($pupil)->postJson('/bookings', [
            'teacher_id' => $teacher->id,
            'pupil_id' => $pupil->id,
            'start_at' => $startUtcIso,
            'end_at' => $endUtcIso,
            'topics' => ['Mock Exam / Interview'],
            'duration_minutes' => 60,
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('appointments', [
            'teacher_id' => $teacher->id,
            'pupil_id' => $pupil->id,
            'start_at' => $sundayTashkent->copy()->utc()->format('Y-m-d H:i:s'),
            'duration_minutes' => 60,
            'status' => 'pending',
        ]);
    }
}

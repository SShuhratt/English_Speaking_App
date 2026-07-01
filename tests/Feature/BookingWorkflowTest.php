<?php

namespace Tests\Feature;

use App\Events\BookingUpdated;
use App\Models\Appointment;
use App\Models\TeacherAvailability;
use App\Models\User;
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

        $startAt = Carbon::parse('next monday 09:00:00');
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
            'status' => 'confirmed',
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
        $teacher = User::factory()->create(['role' => 'teacher', 'google_connected' => false]);
        $pupil = User::factory()->create(['role' => 'pupil']);

        $appointment = Appointment::create([
            'teacher_id' => $teacher->id,
            'pupil_id' => $pupil->id,
            'start_at' => now()->addDay(),
            'end_at' => now()->addDay()->addHour(),
            'status' => 'confirmed',
            'topics' => ['freestyle'],
        ]);

        $response = $this->actingAs($teacher)->postJson("/teacher/appointments/{$appointment->id}/start");

        $response->assertStatus(200);
        $response->assertJsonStructure(['google_meet_link']);
        $this->assertNotNull($appointment->fresh()->google_meet_link);
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

        $startAt = Carbon::parse('next monday 09:00:00');
        $endAt = $startAt->copy()->addHour();

        // Book it first
        Appointment::create([
            'teacher_id' => $teacher->id,
            'pupil_id' => $pupil->id,
            'start_at' => $startAt,
            'end_at' => $endAt,
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

        $monday = Carbon::parse('next monday');

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
        $teacher = User::factory()->create(['role' => 'teacher']);

        // Teacher availability: Monday 09:00:00 to 12:00:00, slot_duration = 0 (All time)
        TeacherAvailability::create([
            'teacher_id' => $teacher->id,
            'type' => 'recurring',
            'day_of_week' => 'monday',
            'start_time' => '09:00:00',
            'end_time' => '12:00:00',
            'slot_duration' => 0,
        ]);

        $monday = Carbon::parse('next monday');
        $dateStr = $monday->toDateString();

        // Initially we should have 1 all-time block: 09:00 to 12:00
        $slots = app(SlotService::class)->getAvailableSlots($teacher->id, $dateStr);

        $this->assertCount(1, $slots);
        $this->assertEquals(Carbon::parse('next monday 09:00:00')->toIso8601String(), $slots[0]['start_at']);
        $this->assertEquals(Carbon::parse('next monday 12:00:00')->toIso8601String(), $slots[0]['end_at']);
        $this->assertTrue($slots[0]['is_all_time']);

        // Now book an appointment from 10:00 to 10:45
        Appointment::create([
            'teacher_id' => $teacher->id,
            'pupil_id' => User::factory()->create(['role' => 'pupil'])->id,
            'start_at' => Carbon::parse('next monday 10:00:00'),
            'end_at' => Carbon::parse('next monday 10:45:00'),
            'status' => 'confirmed',
            'topics' => ['freestyle'],
        ]);

        // Refresh cache and get slots
        Cache::flush();
        $slots = app(SlotService::class)->getAvailableSlots($teacher->id, $dateStr);

        // Should split into two slots: 09:00-10:00 and 10:45-12:00
        $this->assertCount(2, $slots);
        $this->assertEquals(Carbon::parse('next monday 09:00:00')->toIso8601String(), $slots[0]['start_at']);
        $this->assertEquals(Carbon::parse('next monday 10:00:00')->toIso8601String(), $slots[0]['end_at']);
        $this->assertEquals(Carbon::parse('next monday 10:45:00')->toIso8601String(), $slots[1]['start_at']);
        $this->assertEquals(Carbon::parse('next monday 12:00:00')->toIso8601String(), $slots[1]['end_at']);
    }
}

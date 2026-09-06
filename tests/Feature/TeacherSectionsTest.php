<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\TeacherAvailability;
use App\Models\User;
use App\Services\GoogleCalendarService;
use App\Services\SlotService;
use App\Support\PlatformTime;
use Carbon\Carbon;
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
        $futureStart = Carbon::now('Asia/Tashkent')->addDays(3)->setTime(9, 0, 0);
        $futureEnd = Carbon::now('Asia/Tashkent')->addDays(3)->setTime(17, 0, 0);

        $response = $this->actingAs($teacher)->post('/teacher/availability', [
            'type' => 'custom',
            'start_at' => $futureStart->toDateTimeString(),
            'end_at' => $futureEnd->toDateTimeString(),
            'slot_duration' => 30,
        ]);

        $response->assertRedirect();

        $this->assertDatabaseHas('teacher_availabilities', [
            'teacher_id' => $teacher->id,
            'type' => 'custom',
            'start_at' => $futureStart->copy()->utc()->toDateTimeString(),
            'end_at' => $futureEnd->copy()->utc()->toDateTimeString(),
            'slot_duration' => 30,
        ]);
    }

    public function test_teacher_can_store_multi_day_recurring_availability_for_all_days()
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        $allDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

        $response = $this->actingAs($teacher)->post('/teacher/availability', [
            'type' => 'recurring',
            'days_of_week' => $allDays,
            'start_time' => '10:00',
            'end_time' => '21:00',
            'slot_duration' => 60,
        ]);

        $response->assertRedirect();

        $count = TeacherAvailability::where('teacher_id', $teacher->id)
            ->where('type', 'recurring')
            ->where('start_time', '10:00:00')
            ->where('end_time', '21:00:00')
            ->where('slot_duration', 60)
            ->count();

        $this->assertEquals(7, $count);
    }

    public function test_teacher_can_store_multi_day_recurring_availability_for_weekdays()
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        $weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

        $response = $this->actingAs($teacher)->post('/teacher/availability', [
            'type' => 'recurring',
            'days_of_week' => $weekdays,
            'start_time' => '09:00',
            'end_time' => '18:00',
            'slot_duration' => 30,
        ]);

        $response->assertRedirect();

        $count = TeacherAvailability::where('teacher_id', $teacher->id)
            ->where('type', 'recurring')
            ->whereIn('day_of_week', $weekdays)
            ->count();

        $this->assertEquals(5, $count);
    }

    public function test_teacher_can_store_custom_date_range_availability()
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        $startDate = Carbon::now('Asia/Tashkent')->addDays(1)->format('Y-m-d');
        $endDate = Carbon::now('Asia/Tashkent')->addDays(4)->format('Y-m-d');

        $response = $this->actingAs($teacher)->post('/teacher/availability', [
            'type' => 'custom',
            'start_date' => $startDate,
            'end_date' => $endDate,
            'start_time' => '10:00',
            'end_time' => '20:00',
            'slot_duration' => 30,
        ]);

        $response->assertRedirect();

        // 4 days from tomorrow
        $count = TeacherAvailability::where('teacher_id', $teacher->id)
            ->where('type', 'custom')
            ->count();

        $this->assertEquals(4, $count);
    }

    public function test_teacher_cannot_create_custom_availability_for_fully_passed_time()
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        $pastStart = Carbon::now('Asia/Tashkent')->subDays(2)->setTime(9, 0);
        $pastEnd = Carbon::now('Asia/Tashkent')->subDays(2)->setTime(17, 0);

        $response = $this->actingAs($teacher)->post('/teacher/availability', [
            'type' => 'custom',
            'start_at' => $pastStart->toDateTimeString(),
            'end_at' => $pastEnd->toDateTimeString(),
            'slot_duration' => 30,
        ]);

        $response->assertSessionHasErrors(['start_at']);

        $count = TeacherAvailability::where('teacher_id', $teacher->id)
            ->where('type', 'custom')
            ->count();

        $this->assertEquals(0, $count);
    }

    public function test_custom_availability_for_today_clamps_to_current_time_forward()
    {
        $teacher = User::factory()->create(['role' => 'teacher']);

        // Travel to 14:00 today
        $testNow = Carbon::now('Asia/Tashkent')->setTime(14, 0, 0);
        Carbon::setTestNow($testNow);

        $response = $this->actingAs($teacher)->post('/teacher/availability', [
            'type' => 'custom',
            'start_date' => $testNow->format('Y-m-d'),
            'end_date' => $testNow->format('Y-m-d'),
            'start_time' => '10:00', // in the past relative to 14:00
            'end_time' => '21:00',   // in the future
            'slot_duration' => 30,
        ]);

        $response->assertRedirect();

        $availability = TeacherAvailability::where('teacher_id', $teacher->id)
            ->where('type', 'custom')
            ->first();

        $this->assertNotNull($availability);
        // Stored start_at in Tashkent time must be clamped to 14:00
        $startTashkent = $availability->start_at->setTimezone('Asia/Tashkent');
        $this->assertEquals('14:00:00', $startTashkent->format('H:i:s'));
        $this->assertEquals('21:00:00', $availability->end_at->setTimezone('Asia/Tashkent')->format('H:i:s'));

        Carbon::setTestNow(null);
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
            'range_start' => '09:00',
            'range_end' => '12:00',
        ]);

        $response->assertRedirect();

        $this->assertDatabaseHas('teacher_availabilities', [
            'id' => $availability->id,
            'start_at' => PlatformTime::toUtc('2026-08-10 12:00:00')->format('Y-m-d H:i:s'),
            'end_at' => PlatformTime::toUtc('2026-08-10 17:00:00')->format('Y-m-d H:i:s'),
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

    public function test_teacher_can_remove_slot_from_recurring_for_specific_date_only()
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        $tz = 'Asia/Tashkent';

        // Monday recurring 10:00 - 12:00
        $availability = TeacherAvailability::create([
            'teacher_id' => $teacher->id,
            'type' => 'recurring',
            'day_of_week' => 'monday',
            'start_time' => '10:00',
            'end_time' => '12:00',
            'slot_duration' => 30,
            'is_active' => true,
        ]);

        $nextMonday = Carbon::now($tz)->next('monday')->format('Y-m-d');

        // Delete slot 10:30 - 11:00 for that specific date only (Option C)
        $response = $this->actingAs($teacher)->delete("/teacher/availability/{$availability->id}", [
            'delete_type' => 'range',
            'scope' => 'date_only',
            'date' => $nextMonday,
            'range_start' => '10:30',
            'range_end' => '11:00',
        ]);

        $response->assertRedirect();

        // Recurring rule must still exist
        $this->assertDatabaseHas('teacher_availabilities', [
            'id' => $availability->id,
            'is_active' => true,
        ]);

        // A custom blackout record must be created
        $this->assertDatabaseHas('teacher_availabilities', [
            'teacher_id' => $teacher->id,
            'type' => 'custom',
            'is_active' => false,
            'start_at' => PlatformTime::toUtc("{$nextMonday} 10:30:00")->format('Y-m-d H:i:s'),
            'end_at' => PlatformTime::toUtc("{$nextMonday} 11:00:00")->format('Y-m-d H:i:s'),
        ]);

        // SlotService must omit 10:30 slot on nextMonday
        $slotService = app(SlotService::class);
        $slots = $slotService->getAvailableSlots($teacher->id, $nextMonday);
        $times = array_map(fn ($s) => Carbon::parse($s['start_at'])->setTimezone($tz)->format('H:i'), $slots);

        $this->assertContains('10:00', $times);
        $this->assertNotContains('10:30', $times);
        $this->assertContains('11:00', $times);
        $this->assertContains('11:30', $times);
    }

    public function test_teacher_can_remove_range_from_custom_availability()
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        $tz = 'Asia/Tashkent';
        $targetDate = Carbon::now($tz)->addDays(5)->format('Y-m-d');

        $availability = TeacherAvailability::create([
            'teacher_id' => $teacher->id,
            'type' => 'custom',
            'start_at' => Carbon::parse("{$targetDate} 10:00:00", $tz),
            'end_at' => Carbon::parse("{$targetDate} 15:00:00", $tz),
            'slot_duration' => 30,
            'is_active' => true,
        ]);

        // Delete range 12:00 to 13:00 from custom block
        $response = $this->actingAs($teacher)->delete("/teacher/availability/{$availability->id}", [
            'delete_type' => 'range',
            'range_start' => '12:00',
            'range_end' => '13:00',
        ]);

        $response->assertRedirect();

        // Original record updated to end at 12:00
        $this->assertDatabaseHas('teacher_availabilities', [
            'id' => $availability->id,
            'start_at' => PlatformTime::toUtc("{$targetDate} 10:00:00")->format('Y-m-d H:i:s'),
            'end_at' => PlatformTime::toUtc("{$targetDate} 12:00:00")->format('Y-m-d H:i:s'),
        ]);

        // Second record created from 13:00 to 15:00
        $this->assertDatabaseHas('teacher_availabilities', [
            'teacher_id' => $teacher->id,
            'type' => 'custom',
            'start_at' => PlatformTime::toUtc("{$targetDate} 13:00:00")->format('Y-m-d H:i:s'),
            'end_at' => PlatformTime::toUtc("{$targetDate} 15:00:00")->format('Y-m-d H:i:s'),
        ]);
    }

    public function test_teacher_cannot_remove_availability_with_booked_appointments()
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        $pupil = User::factory()->create(['role' => 'pupil']);
        $tz = 'Asia/Tashkent';
        $targetDate = Carbon::now($tz)->addDays(3)->format('Y-m-d');

        $availability = TeacherAvailability::create([
            'teacher_id' => $teacher->id,
            'type' => 'custom',
            'start_at' => Carbon::parse("{$targetDate} 10:00:00", $tz),
            'end_at' => Carbon::parse("{$targetDate} 12:00:00", $tz),
            'slot_duration' => 30,
            'is_active' => true,
        ]);

        // Book an appointment in that window
        Appointment::create([
            'teacher_id' => $teacher->id,
            'pupil_id' => $pupil->id,
            'start_at' => Carbon::parse("{$targetDate} 10:30:00", $tz),
            'end_at' => Carbon::parse("{$targetDate} 11:00:00", $tz),
            'status' => 'confirmed',
        ]);

        $response = $this->actingAs($teacher)->delete("/teacher/availability/{$availability->id}");

        $response->assertSessionHasErrors('range');
        $this->assertDatabaseHas('teacher_availabilities', ['id' => $availability->id]);
    }

    public function test_teacher_can_clear_single_day_availability()
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        $tz = 'Asia/Tashkent';
        $targetDate = Carbon::now($tz)->addDays(4)->format('Y-m-d');

        $custom = TeacherAvailability::create([
            'teacher_id' => $teacher->id,
            'type' => 'custom',
            'start_at' => Carbon::parse("{$targetDate} 09:00:00", $tz),
            'end_at' => Carbon::parse("{$targetDate} 17:00:00", $tz),
            'slot_duration' => 30,
            'is_active' => true,
        ]);

        $response = $this->actingAs($teacher)->post('/teacher/availability/clear', [
            'date' => $targetDate,
            'scope' => 'date_only',
        ]);

        $response->assertRedirect();

        $this->assertDatabaseMissing('teacher_availabilities', [
            'id' => $custom->id,
        ]);
    }

    public function test_teacher_can_clear_multiple_selected_days()
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        $tz = 'Asia/Tashkent';
        $date1 = Carbon::now($tz)->addDays(6)->format('Y-m-d');
        $date2 = Carbon::now($tz)->addDays(7)->format('Y-m-d');

        $custom1 = TeacherAvailability::create([
            'teacher_id' => $teacher->id,
            'type' => 'custom',
            'start_at' => Carbon::parse("{$date1} 10:00:00", $tz),
            'end_at' => Carbon::parse("{$date1} 18:00:00", $tz),
            'slot_duration' => 30,
            'is_active' => true,
        ]);

        $custom2 = TeacherAvailability::create([
            'teacher_id' => $teacher->id,
            'type' => 'custom',
            'start_at' => Carbon::parse("{$date2} 10:00:00", $tz),
            'end_at' => Carbon::parse("{$date2} 18:00:00", $tz),
            'slot_duration' => 30,
            'is_active' => true,
        ]);

        $response = $this->actingAs($teacher)->post('/teacher/availability/clear', [
            'dates' => [$date1, $date2],
            'scope' => 'date_only',
        ]);

        $response->assertRedirect();

        $this->assertDatabaseMissing('teacher_availabilities', ['id' => $custom1->id]);
        $this->assertDatabaseMissing('teacher_availabilities', ['id' => $custom2->id]);
    }
}

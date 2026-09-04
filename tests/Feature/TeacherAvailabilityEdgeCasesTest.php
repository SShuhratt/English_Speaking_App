<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\TeacherAvailability;
use App\Models\User;
use App\Services\BookingService;
use App\Services\SlotService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TeacherAvailabilityEdgeCasesTest extends TestCase
{
    use RefreshDatabase;

    protected string $tz = 'Asia/Tashkent';

    /**
     * Edge Case 1: Teacher cannot delete another teacher's availability (Tenancy / Auth guard).
     */
    public function test_teacher_cannot_delete_another_teachers_availability(): void
    {
        $teacherA = User::factory()->create(['role' => 'teacher']);
        $teacherB = User::factory()->create(['role' => 'teacher']);

        $availability = TeacherAvailability::create([
            'teacher_id' => $teacherB->id,
            'type' => 'recurring',
            'day_of_week' => 'monday',
            'start_time' => '10:00:00',
            'end_time' => '14:00:00',
            'slot_duration' => 30,
            'is_active' => true,
        ]);

        $response = $this->actingAs($teacherA)->delete("/teacher/availability/{$availability->id}");

        $response->assertRedirect();
        $response->assertSessionHasErrors('range');
        $this->assertDatabaseHas('teacher_availabilities', ['id' => $availability->id]);
    }

    /**
     * Edge Case 2: Clearing a day only affects the authenticated teacher, never other teachers.
     */
    public function test_clearing_day_only_affects_authenticated_teacher(): void
    {
        $teacherA = User::factory()->create(['role' => 'teacher']);
        $teacherB = User::factory()->create(['role' => 'teacher']);
        $targetDate = Carbon::now($this->tz)->addDays(4)->format('Y-m-d');

        $availA = TeacherAvailability::create([
            'teacher_id' => $teacherA->id,
            'type' => 'custom',
            'start_at' => Carbon::parse("{$targetDate} 10:00:00", $this->tz),
            'end_at' => Carbon::parse("{$targetDate} 15:00:00", $this->tz),
            'slot_duration' => 30,
            'is_active' => true,
        ]);

        $availB = TeacherAvailability::create([
            'teacher_id' => $teacherB->id,
            'type' => 'custom',
            'start_at' => Carbon::parse("{$targetDate} 10:00:00", $this->tz),
            'end_at' => Carbon::parse("{$targetDate} 15:00:00", $this->tz),
            'slot_duration' => 30,
            'is_active' => true,
        ]);

        $response = $this->actingAs($teacherA)->post('/teacher/availability/clear', [
            'date' => $targetDate,
            'scope' => 'date_only',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseMissing('teacher_availabilities', ['id' => $availA->id]);
        $this->assertDatabaseHas('teacher_availabilities', ['id' => $availB->id]);
    }

    /**
     * Edge Case 3: Deletion is allowed if an appointment in that time slot was cancelled.
     */
    public function test_deletion_allowed_if_appointment_in_slot_is_cancelled(): void
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        $pupil = User::factory()->create(['role' => 'pupil']);
        $targetDate = Carbon::now($this->tz)->addDays(3)->format('Y-m-d');

        $availability = TeacherAvailability::create([
            'teacher_id' => $teacher->id,
            'type' => 'custom',
            'start_at' => Carbon::parse("{$targetDate} 10:00:00", $this->tz),
            'end_at' => Carbon::parse("{$targetDate} 12:00:00", $this->tz),
            'slot_duration' => 30,
            'is_active' => true,
        ]);

        // Cancelled appointment in the slot
        Appointment::create([
            'teacher_id' => $teacher->id,
            'pupil_id' => $pupil->id,
            'start_at' => Carbon::parse("{$targetDate} 10:30:00", $this->tz),
            'end_at' => Carbon::parse("{$targetDate} 11:00:00", $this->tz),
            'status' => 'cancelled',
        ]);

        $response = $this->actingAs($teacher)->delete("/teacher/availability/{$availability->id}");

        $response->assertRedirect();
        $this->assertDatabaseMissing('teacher_availabilities', ['id' => $availability->id]);
    }

    /**
     * Edge Case 4: Deletion blocked for pending, accepted, and confirmed appointments.
     */
    public function test_deletion_blocked_for_active_appointment_statuses(): void
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        $pupil = User::factory()->create(['role' => 'pupil']);
        $targetDate = Carbon::now($this->tz)->addDays(3)->format('Y-m-d');

        foreach (['pending', 'accepted', 'confirmed'] as $status) {
            $availability = TeacherAvailability::create([
                'teacher_id' => $teacher->id,
                'type' => 'custom',
                'start_at' => Carbon::parse("{$targetDate} 10:00:00", $this->tz),
                'end_at' => Carbon::parse("{$targetDate} 12:00:00", $this->tz),
                'slot_duration' => 30,
                'is_active' => true,
            ]);

            $appt = Appointment::create([
                'teacher_id' => $teacher->id,
                'pupil_id' => $pupil->id,
                'start_at' => Carbon::parse("{$targetDate} 10:30:00", $this->tz),
                'end_at' => Carbon::parse("{$targetDate} 11:00:00", $this->tz),
                'status' => $status,
            ]);

            $response = $this->actingAs($teacher)->delete("/teacher/availability/{$availability->id}");
            $response->assertSessionHasErrors('range');
            $this->assertDatabaseHas('teacher_availabilities', ['id' => $availability->id]);

            // Clean up for next iteration
            $appt->delete();
            $availability->delete();
        }
    }

    /**
     * Edge Case 5: Custom block trimming - start edge removal.
     */
    public function test_custom_block_trim_start(): void
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        $targetDate = Carbon::now($this->tz)->addDays(4)->format('Y-m-d');

        $availability = TeacherAvailability::create([
            'teacher_id' => $teacher->id,
            'type' => 'custom',
            'start_at' => Carbon::parse("{$targetDate} 10:00:00", $this->tz),
            'end_at' => Carbon::parse("{$targetDate} 15:00:00", $this->tz),
            'slot_duration' => 30,
            'is_active' => true,
        ]);

        // Remove 10:00 to 12:00
        $response = $this->actingAs($teacher)->delete("/teacher/availability/{$availability->id}", [
            'delete_type' => 'range',
            'range_start' => '10:00',
            'range_end' => '12:00',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('teacher_availabilities', [
            'id' => $availability->id,
            'start_at' => "{$targetDate} 12:00:00",
            'end_at' => "{$targetDate} 15:00:00",
        ]);
    }

    /**
     * Edge Case 6: Custom block trimming - end edge removal.
     */
    public function test_custom_block_trim_end(): void
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        $targetDate = Carbon::now($this->tz)->addDays(4)->format('Y-m-d');

        $availability = TeacherAvailability::create([
            'teacher_id' => $teacher->id,
            'type' => 'custom',
            'start_at' => Carbon::parse("{$targetDate} 10:00:00", $this->tz),
            'end_at' => Carbon::parse("{$targetDate} 15:00:00", $this->tz),
            'slot_duration' => 30,
            'is_active' => true,
        ]);

        // Remove 13:00 to 15:00
        $response = $this->actingAs($teacher)->delete("/teacher/availability/{$availability->id}", [
            'delete_type' => 'range',
            'range_start' => '13:00',
            'range_end' => '15:00',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('teacher_availabilities', [
            'id' => $availability->id,
            'start_at' => "{$targetDate} 10:00:00",
            'end_at' => "{$targetDate} 13:00:00",
        ]);
    }

    /**
     * Edge Case 7: Custom block trimming - entire block removal via range.
     */
    public function test_custom_block_delete_entire_range(): void
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        $targetDate = Carbon::now($this->tz)->addDays(4)->format('Y-m-d');

        $availability = TeacherAvailability::create([
            'teacher_id' => $teacher->id,
            'type' => 'custom',
            'start_at' => Carbon::parse("{$targetDate} 10:00:00", $this->tz),
            'end_at' => Carbon::parse("{$targetDate} 15:00:00", $this->tz),
            'slot_duration' => 30,
            'is_active' => true,
        ]);

        // Remove entire range 10:00 to 15:00
        $response = $this->actingAs($teacher)->delete("/teacher/availability/{$availability->id}", [
            'delete_type' => 'range',
            'range_start' => '10:00',
            'range_end' => '15:00',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseMissing('teacher_availabilities', ['id' => $availability->id]);
    }

    /**
     * Edge Case 8: Invalid range where end time is before or equal to start time.
     */
    public function test_invalid_range_end_before_start_is_rejected(): void
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        $targetDate = Carbon::now($this->tz)->addDays(4)->format('Y-m-d');

        $availability = TeacherAvailability::create([
            'teacher_id' => $teacher->id,
            'type' => 'custom',
            'start_at' => Carbon::parse("{$targetDate} 10:00:00", $this->tz),
            'end_at' => Carbon::parse("{$targetDate} 15:00:00", $this->tz),
            'slot_duration' => 30,
            'is_active' => true,
        ]);

        $response = $this->actingAs($teacher)->delete("/teacher/availability/{$availability->id}", [
            'delete_type' => 'range',
            'range_start' => '14:00',
            'range_end' => '12:00',
        ]);

        $response->assertSessionHasErrors('range');
        $this->assertDatabaseHas('teacher_availabilities', ['id' => $availability->id]);
    }

    /**
     * Edge Case 9: Trimming middle range for all upcoming weeks on a recurring rule.
     */
    public function test_recurring_rule_trimmed_for_all_weeks_splits_into_two_rules(): void
    {
        $teacher = User::factory()->create(['role' => 'teacher']);

        $availability = TeacherAvailability::create([
            'teacher_id' => $teacher->id,
            'type' => 'recurring',
            'day_of_week' => 'wednesday',
            'start_time' => '09:00:00',
            'end_time' => '17:00:00',
            'slot_duration' => 60,
            'is_active' => true,
        ]);

        // Remove 12:00 to 13:00 for all weeks
        $response = $this->actingAs($teacher)->delete("/teacher/availability/{$availability->id}", [
            'delete_type' => 'range',
            'scope' => 'all_weeks',
            'range_start' => '12:00',
            'range_end' => '13:00',
        ]);

        $response->assertRedirect();

        // First part updated: 09:00 to 12:00
        $this->assertDatabaseHas('teacher_availabilities', [
            'id' => $availability->id,
            'start_time' => '09:00:00',
            'end_time' => '12:00:00',
        ]);

        // Second part created: 13:00 to 17:00
        $this->assertDatabaseHas('teacher_availabilities', [
            'teacher_id' => $teacher->id,
            'type' => 'recurring',
            'day_of_week' => 'wednesday',
            'start_time' => '13:00:00',
            'end_time' => '17:00:00',
        ]);

        // Verify SlotService output for next Wednesday
        $nextWed = Carbon::now($this->tz)->next(Carbon::WEDNESDAY)->format('Y-m-d');
        $slotService = app(SlotService::class);
        $slots = $slotService->getAvailableSlots($teacher->id, $nextWed);
        $times = array_map(fn ($s) => Carbon::parse($s['start_at'])->setTimezone($this->tz)->format('H:i'), $slots);

        $this->assertContains('09:00', $times);
        $this->assertContains('10:00', $times);
        $this->assertContains('11:00', $times);
        $this->assertNotContains('12:00', $times);
        $this->assertContains('13:00', $times);
        $this->assertContains('14:00', $times);
        $this->assertContains('15:00', $times);
        $this->assertContains('16:00', $times);
    }

    /**
     * Edge Case 10: Option C verification - removing slot for date_only preserves future weeks.
     */
    public function test_recurring_slot_removed_for_date_only_preserves_next_week_slots(): void
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        $nextThursday = Carbon::now($this->tz)->next(Carbon::THURSDAY)->format('Y-m-d');
        $followingThursday = Carbon::parse($nextThursday, $this->tz)->addWeek()->format('Y-m-d');

        $availability = TeacherAvailability::create([
            'teacher_id' => $teacher->id,
            'type' => 'recurring',
            'day_of_week' => 'thursday',
            'start_time' => '10:00:00',
            'end_time' => '12:00:00',
            'slot_duration' => 30,
            'is_active' => true,
        ]);

        // Remove 10:30 to 11:00 on $nextThursday only
        $response = $this->actingAs($teacher)->delete("/teacher/availability/{$availability->id}", [
            'delete_type' => 'range',
            'scope' => 'date_only',
            'date' => $nextThursday,
            'range_start' => '10:30',
            'range_end' => '11:00',
        ]);

        $response->assertRedirect();

        $slotService = app(SlotService::class);

        // On $nextThursday, 10:30 is blacked out
        $nextSlots = $slotService->getAvailableSlots($teacher->id, $nextThursday);
        $nextTimes = array_map(fn ($s) => Carbon::parse($s['start_at'])->setTimezone($this->tz)->format('H:i'), $nextSlots);
        $this->assertContains('10:00', $nextTimes);
        $this->assertNotContains('10:30', $nextTimes);
        $this->assertContains('11:00', $nextTimes);
        $this->assertContains('11:30', $nextTimes);

        // On $followingThursday, ALL slots (including 10:30) are intact!
        $followingSlots = $slotService->getAvailableSlots($teacher->id, $followingThursday);
        $followingTimes = array_map(fn ($s) => Carbon::parse($s['start_at'])->setTimezone($this->tz)->format('H:i'), $followingSlots);
        $this->assertContains('10:00', $followingTimes);
        $this->assertContains('10:30', $followingTimes);
        $this->assertContains('11:00', $followingTimes);
        $this->assertContains('11:30', $followingTimes);
    }

    /**
     * Edge Case 11: Direct pupil booking on a blacked-out slot is rejected via BookingService.
     */
    public function test_pupil_booking_on_blacked_out_slot_is_rejected(): void
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        $pupil = User::factory()->create(['role' => 'pupil']);
        $nextFriday = Carbon::now($this->tz)->next(Carbon::FRIDAY)->format('Y-m-d');
        $followingFriday = Carbon::parse($nextFriday, $this->tz)->addWeek()->format('Y-m-d');

        // Teacher has recurring Friday 14:00 to 18:00
        TeacherAvailability::create([
            'teacher_id' => $teacher->id,
            'type' => 'recurring',
            'day_of_week' => 'friday',
            'start_time' => '14:00:00',
            'end_time' => '18:00:00',
            'slot_duration' => 60,
            'is_active' => true,
        ]);

        // Blackout Friday 15:00 to 16:00 on $nextFriday
        TeacherAvailability::create([
            'teacher_id' => $teacher->id,
            'type' => 'custom',
            'start_at' => Carbon::parse("{$nextFriday} 15:00:00", $this->tz),
            'end_at' => Carbon::parse("{$nextFriday} 16:00:00", $this->tz),
            'slot_duration' => 60,
            'is_active' => false,
        ]);

        // 1. Booking attempt on blacked-out slot must fail
        $responseFail = $this->actingAs($pupil)->postJson('/bookings', [
            'teacher_id' => $teacher->id,
            'pupil_id' => $pupil->id,
            'start_at' => "{$nextFriday} 15:00:00",
            'end_at' => "{$nextFriday} 16:00:00",
            'topics' => ['grammar'],
        ]);

        $responseFail->assertStatus(422);

        // 2. Booking attempt on following Friday 15:00 to 16:00 must SUCCEED
        $responseSuccess = $this->actingAs($pupil)->postJson('/bookings', [
            'teacher_id' => $teacher->id,
            'pupil_id' => $pupil->id,
            'start_at' => "{$followingFriday} 15:00:00",
            'end_at' => "{$followingFriday} 16:00:00",
            'topics' => ['grammar'],
        ]);

        $responseSuccess->assertStatus(201);
        $this->assertDatabaseHas('appointments', [
            'teacher_id' => $teacher->id,
            'pupil_id' => $pupil->id,
            'start_at' => "{$followingFriday} 15:00:00",
            'status' => 'pending',
        ]);
    }

    /**
     * Edge Case 12: Clearing day with mixed availabilities (custom block + recurring).
     */
    public function test_clearing_day_with_both_custom_and_recurring_availabilities(): void
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        $nextSaturday = Carbon::now($this->tz)->next(Carbon::SATURDAY)->format('Y-m-d');
        $followingSaturday = Carbon::parse($nextSaturday, $this->tz)->addWeek()->format('Y-m-d');

        // Recurring Saturday rule
        TeacherAvailability::create([
            'teacher_id' => $teacher->id,
            'type' => 'recurring',
            'day_of_week' => 'saturday',
            'start_time' => '10:00:00',
            'end_time' => '14:00:00',
            'slot_duration' => 60,
            'is_active' => true,
        ]);

        // Custom Saturday extra override block
        $custom = TeacherAvailability::create([
            'teacher_id' => $teacher->id,
            'type' => 'custom',
            'start_at' => Carbon::parse("{$nextSaturday} 16:00:00", $this->tz),
            'end_at' => Carbon::parse("{$nextSaturday} 18:00:00", $this->tz),
            'slot_duration' => 60,
            'is_active' => true,
        ]);

        // Clear $nextSaturday with date_only
        $response = $this->actingAs($teacher)->post('/teacher/availability/clear', [
            'date' => $nextSaturday,
            'scope' => 'date_only',
        ]);

        $response->assertRedirect();

        // Custom override must be deleted
        $this->assertDatabaseMissing('teacher_availabilities', ['id' => $custom->id]);

        // Blackout record must be created for the recurring rule
        $this->assertDatabaseHas('teacher_availabilities', [
            'teacher_id' => $teacher->id,
            'type' => 'custom',
            'is_active' => false,
            'start_at' => "{$nextSaturday} 10:00:00",
            'end_at' => "{$nextSaturday} 14:00:00",
        ]);

        $slotService = app(SlotService::class);

        // $nextSaturday must have NO slots
        $this->assertEmpty($slotService->getAvailableSlots($teacher->id, $nextSaturday));

        // $followingSaturday must still have recurring slots!
        $futureSlots = $slotService->getAvailableSlots($teacher->id, $followingSaturday);
        $this->assertNotEmpty($futureSlots);
        $this->assertCount(4, $futureSlots);
    }

    /**
     * Edge Case 13: Clearing multiple days aborts if any selected day has an active booked appointment.
     */
    public function test_clearing_multiple_days_aborts_if_any_day_has_active_booking(): void
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        $pupil = User::factory()->create(['role' => 'pupil']);

        $date1 = Carbon::now($this->tz)->addDays(5)->format('Y-m-d');
        $date2 = Carbon::now($this->tz)->addDays(6)->format('Y-m-d');

        $avail1 = TeacherAvailability::create([
            'teacher_id' => $teacher->id,
            'type' => 'custom',
            'start_at' => Carbon::parse("{$date1} 10:00:00", $this->tz),
            'end_at' => Carbon::parse("{$date1} 14:00:00", $this->tz),
            'slot_duration' => 60,
            'is_active' => true,
        ]);

        $avail2 = TeacherAvailability::create([
            'teacher_id' => $teacher->id,
            'type' => 'custom',
            'start_at' => Carbon::parse("{$date2} 10:00:00", $this->tz),
            'end_at' => Carbon::parse("{$date2} 14:00:00", $this->tz),
            'slot_duration' => 60,
            'is_active' => true,
        ]);

        // Active booking on Day 2
        Appointment::create([
            'teacher_id' => $teacher->id,
            'pupil_id' => $pupil->id,
            'start_at' => Carbon::parse("{$date2} 11:00:00", $this->tz),
            'end_at' => Carbon::parse("{$date2} 12:00:00", $this->tz),
            'status' => 'confirmed',
        ]);

        $response = $this->actingAs($teacher)->post('/teacher/availability/clear', [
            'dates' => [$date1, $date2],
            'scope' => 'date_only',
        ]);

        $response->assertSessionHasErrors('range');

        // Day 2 must still exist
        $this->assertDatabaseHas('teacher_availabilities', ['id' => $avail2->id]);
    }

    /**
     * Edge Case 14: Clearing with scope all_weeks deletes the recurring rule entirely.
     */
    public function test_clearing_day_with_all_weeks_scope_deletes_recurring_rule_entirely(): void
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        $nextSunday = Carbon::now($this->tz)->next(Carbon::SUNDAY)->format('Y-m-d');

        $recurring = TeacherAvailability::create([
            'teacher_id' => $teacher->id,
            'type' => 'recurring',
            'day_of_week' => 'sunday',
            'start_time' => '10:00:00',
            'end_time' => '15:00:00',
            'slot_duration' => 60,
            'is_active' => true,
        ]);

        $response = $this->actingAs($teacher)->post('/teacher/availability/clear', [
            'date' => $nextSunday,
            'scope' => 'all_weeks',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseMissing('teacher_availabilities', ['id' => $recurring->id]);

        $slotService = app(SlotService::class);
        $this->assertEmpty($slotService->getAvailableSlots($teacher->id, $nextSunday));
    }

    /**
     * Edge Case 15: Sub-window clearing on custom availability trims/splits the block.
     */
    public function test_clearing_sub_window_on_custom_availability_splits_block(): void
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        $targetDate = Carbon::now($this->tz)->addDays(4)->format('Y-m-d');

        $availability = TeacherAvailability::create([
            'teacher_id' => $teacher->id,
            'type' => 'custom',
            'start_at' => Carbon::parse("{$targetDate} 09:00:00", $this->tz),
            'end_at' => Carbon::parse("{$targetDate} 17:00:00", $this->tz),
            'slot_duration' => 60,
            'is_active' => true,
        ]);

        // Clear 12:00 to 14:00 sub-window
        $response = $this->actingAs($teacher)->post('/teacher/availability/clear', [
            'date' => $targetDate,
            'start_time' => '12:00',
            'end_time' => '14:00',
            'scope' => 'date_only',
        ]);

        $response->assertRedirect();

        // First part updated: 09:00 to 12:00
        $this->assertDatabaseHas('teacher_availabilities', [
            'id' => $availability->id,
            'start_at' => "{$targetDate} 09:00:00",
            'end_at' => "{$targetDate} 12:00:00",
        ]);

        // Second part created: 14:00 to 17:00
        $this->assertDatabaseHas('teacher_availabilities', [
            'teacher_id' => $teacher->id,
            'type' => 'custom',
            'start_at' => "{$targetDate} 14:00:00",
            'end_at' => "{$targetDate} 17:00:00",
        ]);

        $slotService = app(SlotService::class);
        $slots = $slotService->getAvailableSlots($teacher->id, $targetDate);
        $times = array_map(fn ($s) => Carbon::parse($s['start_at'])->setTimezone($this->tz)->format('H:i'), $slots);

        $this->assertContains('09:00', $times);
        $this->assertContains('10:00', $times);
        $this->assertContains('11:00', $times);
        $this->assertNotContains('12:00', $times);
        $this->assertNotContains('13:00', $times);
        $this->assertContains('14:00', $times);
        $this->assertContains('15:00', $times);
        $this->assertContains('16:00', $times);
    }

    /**
     * Edge Case 16: Clearing a day with multiple recurring shifts creates blackouts for all shifts.
     */
    public function test_clearing_day_with_multiple_recurring_shifts(): void
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        $nextMonday = Carbon::now($this->tz)->next(Carbon::MONDAY)->format('Y-m-d');
        $followingMonday = Carbon::parse($nextMonday, $this->tz)->addWeek()->format('Y-m-d');

        // Shift 1: 09:00 to 12:00
        TeacherAvailability::create([
            'teacher_id' => $teacher->id,
            'type' => 'recurring',
            'day_of_week' => 'monday',
            'start_time' => '09:00:00',
            'end_time' => '12:00:00',
            'slot_duration' => 60,
            'is_active' => true,
        ]);

        // Shift 2: 15:00 to 18:00
        TeacherAvailability::create([
            'teacher_id' => $teacher->id,
            'type' => 'recurring',
            'day_of_week' => 'monday',
            'start_time' => '15:00:00',
            'end_time' => '18:00:00',
            'slot_duration' => 60,
            'is_active' => true,
        ]);

        // Clear $nextMonday only
        $response = $this->actingAs($teacher)->post('/teacher/availability/clear', [
            'date' => $nextMonday,
            'scope' => 'date_only',
        ]);

        $response->assertRedirect();

        // Both shifts should have blackout records for $nextMonday
        $this->assertDatabaseHas('teacher_availabilities', [
            'teacher_id' => $teacher->id,
            'type' => 'custom',
            'is_active' => false,
            'start_at' => "{$nextMonday} 09:00:00",
            'end_at' => "{$nextMonday} 12:00:00",
        ]);

        $this->assertDatabaseHas('teacher_availabilities', [
            'teacher_id' => $teacher->id,
            'type' => 'custom',
            'is_active' => false,
            'start_at' => "{$nextMonday} 15:00:00",
            'end_at' => "{$nextMonday} 18:00:00",
        ]);

        $slotService = app(SlotService::class);

        // $nextMonday has 0 slots
        $this->assertEmpty($slotService->getAvailableSlots($teacher->id, $nextMonday));

        // $followingMonday has all 6 slots intact
        $followingSlots = $slotService->getAvailableSlots($teacher->id, $followingMonday);
        $this->assertCount(6, $followingSlots);
    }

    /**
     * Edge Case 17: Removing multiple non-contiguous individual slots on the same day.
     */
    public function test_removing_multiple_non_contiguous_individual_slots_on_same_day(): void
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        $nextTuesday = Carbon::now($this->tz)->next(Carbon::TUESDAY)->format('Y-m-d');
        $followingTuesday = Carbon::parse($nextTuesday, $this->tz)->addWeek()->format('Y-m-d');

        $availability = TeacherAvailability::create([
            'teacher_id' => $teacher->id,
            'type' => 'recurring',
            'day_of_week' => 'tuesday',
            'start_time' => '10:00:00',
            'end_time' => '14:00:00',
            'slot_duration' => 30,
            'is_active' => true,
        ]);

        // Remove slot 1: 10:30 to 11:00
        $this->actingAs($teacher)->delete("/teacher/availability/{$availability->id}", [
            'delete_type' => 'range',
            'scope' => 'date_only',
            'date' => $nextTuesday,
            'range_start' => '10:30',
            'range_end' => '11:00',
        ])->assertRedirect();

        // Remove slot 2: 12:00 to 12:30
        $this->actingAs($teacher)->delete("/teacher/availability/{$availability->id}", [
            'delete_type' => 'range',
            'scope' => 'date_only',
            'date' => $nextTuesday,
            'range_start' => '12:00',
            'range_end' => '12:30',
        ])->assertRedirect();

        $slotService = app(SlotService::class);
        $slots = $slotService->getAvailableSlots($teacher->id, $nextTuesday);
        $times = array_map(fn ($s) => Carbon::parse($s['start_at'])->setTimezone($this->tz)->format('H:i'), $slots);

        // Intact slots
        $this->assertContains('10:00', $times);
        $this->assertContains('11:00', $times);
        $this->assertContains('11:30', $times);
        $this->assertContains('12:30', $times);
        $this->assertContains('13:00', $times);
        $this->assertContains('13:30', $times);

        // Removed slots
        $this->assertNotContains('10:30', $times);
        $this->assertNotContains('12:00', $times);

        // Following Tuesday still has 8 slots intact
        $followingSlots = $slotService->getAvailableSlots($teacher->id, $followingTuesday);
        $this->assertCount(8, $followingSlots);
    }

    /**
     * Edge Case 18: Clearing multiple recurring weekdays via days_of_week array.
     */
    public function test_clearing_multiple_recurring_weekdays_with_days_of_week_array(): void
    {
        $teacher = User::factory()->create(['role' => 'teacher']);

        $tue = TeacherAvailability::create([
            'teacher_id' => $teacher->id,
            'type' => 'recurring',
            'day_of_week' => 'tuesday',
            'start_time' => '09:00:00',
            'end_time' => '12:00:00',
            'slot_duration' => 60,
            'is_active' => true,
        ]);

        $wed = TeacherAvailability::create([
            'teacher_id' => $teacher->id,
            'type' => 'recurring',
            'day_of_week' => 'wednesday',
            'start_time' => '09:00:00',
            'end_time' => '12:00:00',
            'slot_duration' => 60,
            'is_active' => true,
        ]);

        $thu = TeacherAvailability::create([
            'teacher_id' => $teacher->id,
            'type' => 'recurring',
            'day_of_week' => 'thursday',
            'start_time' => '09:00:00',
            'end_time' => '12:00:00',
            'slot_duration' => 60,
            'is_active' => true,
        ]);

        $response = $this->actingAs($teacher)->post('/teacher/availability/clear', [
            'days_of_week' => ['tuesday', 'thursday'],
            'scope' => 'all_weeks',
        ]);

        $response->assertRedirect();

        $this->assertDatabaseMissing('teacher_availabilities', ['id' => $tue->id]);
        $this->assertDatabaseHas('teacher_availabilities', ['id' => $wed->id]);
        $this->assertDatabaseMissing('teacher_availabilities', ['id' => $thu->id]);

        $slotService = app(SlotService::class);
        $nextTue = Carbon::now($this->tz)->next(Carbon::TUESDAY)->format('Y-m-d');
        $nextWed = Carbon::now($this->tz)->next(Carbon::WEDNESDAY)->format('Y-m-d');
        $nextThu = Carbon::now($this->tz)->next(Carbon::THURSDAY)->format('Y-m-d');

        $this->assertEmpty($slotService->getAvailableSlots($teacher->id, $nextTue));
        $this->assertNotEmpty($slotService->getAvailableSlots($teacher->id, $nextWed));
        $this->assertEmpty($slotService->getAvailableSlots($teacher->id, $nextThu));
    }

    /**
     * Edge Case 19: Clearing a sub-window on a recurring day creates a targeted blackout for that window.
     */
    public function test_clearing_sub_window_on_recurring_day_creates_targeted_blackout(): void
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        $nextWed = Carbon::now($this->tz)->next(Carbon::WEDNESDAY)->format('Y-m-d');
        $followingWed = Carbon::parse($nextWed, $this->tz)->addWeek()->format('Y-m-d');

        TeacherAvailability::create([
            'teacher_id' => $teacher->id,
            'type' => 'recurring',
            'day_of_week' => 'wednesday',
            'start_time' => '09:00:00',
            'end_time' => '17:00:00',
            'slot_duration' => 60,
            'is_active' => true,
        ]);

        $response = $this->actingAs($teacher)->post('/teacher/availability/clear', [
            'date' => $nextWed,
            'start_time' => '12:00',
            'end_time' => '14:00',
            'scope' => 'date_only',
        ]);

        $response->assertRedirect();

        // Blackout from 12:00 to 14:00 on $nextWed
        $this->assertDatabaseHas('teacher_availabilities', [
            'teacher_id' => $teacher->id,
            'type' => 'custom',
            'is_active' => false,
            'start_at' => "{$nextWed} 12:00:00",
            'end_at' => "{$nextWed} 14:00:00",
        ]);

        $slotService = app(SlotService::class);
        $nextSlots = $slotService->getAvailableSlots($teacher->id, $nextWed);
        $nextTimes = array_map(fn ($s) => Carbon::parse($s['start_at'])->setTimezone($this->tz)->format('H:i'), $nextSlots);

        $this->assertContains('09:00', $nextTimes);
        $this->assertContains('10:00', $nextTimes);
        $this->assertContains('11:00', $nextTimes);
        $this->assertNotContains('12:00', $nextTimes);
        $this->assertNotContains('13:00', $nextTimes);
        $this->assertContains('14:00', $nextTimes);
        $this->assertContains('15:00', $nextTimes);
        $this->assertContains('16:00', $nextTimes);

        // Following Wednesday has all 8 hours available
        $followingSlots = $slotService->getAvailableSlots($teacher->id, $followingWed);
        $this->assertCount(8, $followingSlots);
    }

    /**
     * Edge Case 20: Sub-window clearing is blocked if that sub-window has an active appointment,
     * but succeeds if targeting a non-overlapping sub-window.
     */
    public function test_sub_window_clearing_blocked_if_sub_window_has_active_appointment(): void
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        $pupil = User::factory()->create(['role' => 'pupil']);
        $targetDate = Carbon::now($this->tz)->addDays(5)->format('Y-m-d');

        $availability = TeacherAvailability::create([
            'teacher_id' => $teacher->id,
            'type' => 'custom',
            'start_at' => Carbon::parse("{$targetDate} 09:00:00", $this->tz),
            'end_at' => Carbon::parse("{$targetDate} 17:00:00", $this->tz),
            'slot_duration' => 60,
            'is_active' => true,
        ]);

        // Booked appointment at 13:00 - 14:00
        Appointment::create([
            'teacher_id' => $teacher->id,
            'pupil_id' => $pupil->id,
            'start_at' => Carbon::parse("{$targetDate} 13:00:00", $this->tz),
            'end_at' => Carbon::parse("{$targetDate} 14:00:00", $this->tz),
            'status' => 'confirmed',
        ]);

        // Attempt 1: Clear sub-window 12:00 to 14:00 (overlaps appointment) -> must FAIL
        $responseFail = $this->actingAs($teacher)->post('/teacher/availability/clear', [
            'date' => $targetDate,
            'start_time' => '12:00',
            'end_time' => '14:00',
            'scope' => 'date_only',
        ]);

        $responseFail->assertSessionHasErrors('range');
        $this->assertDatabaseHas('teacher_availabilities', [
            'id' => $availability->id,
            'start_at' => "{$targetDate} 09:00:00",
            'end_at' => "{$targetDate} 17:00:00",
        ]);

        // Attempt 2: Clear sub-window 09:00 to 11:00 (does NOT overlap appointment) -> must SUCCEED
        $responseSuccess = $this->actingAs($teacher)->post('/teacher/availability/clear', [
            'date' => $targetDate,
            'start_time' => '09:00',
            'end_time' => '11:00',
            'scope' => 'date_only',
        ]);

        $responseSuccess->assertRedirect();
        // The original block's start should have been shifted to 11:00:00
        $this->assertDatabaseHas('teacher_availabilities', [
            'id' => $availability->id,
            'start_at' => "{$targetDate} 11:00:00",
            'end_at' => "{$targetDate} 17:00:00",
        ]);
    }

    /**
     * Edge Case 21: Creating recurring availability with multiple weekdays simultaneously.
     */
    public function test_creating_recurring_availability_with_multiple_weekdays(): void
    {
        $teacher = User::factory()->create(['role' => 'teacher']);

        $response = $this->actingAs($teacher)->post('/teacher/availability', [
            'type' => 'recurring',
            'days_of_week' => ['monday', 'wednesday', 'friday'],
            'start_time' => '10:00',
            'end_time' => '14:00',
            'slot_duration' => 60,
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        foreach (['monday', 'wednesday', 'friday'] as $day) {
            $this->assertDatabaseHas('teacher_availabilities', [
                'teacher_id' => $teacher->id,
                'type' => 'recurring',
                'day_of_week' => $day,
                'start_time' => '10:00',
                'end_time' => '14:00',
                'slot_duration' => 60,
                'is_active' => true,
            ]);
        }

        $slotService = app(SlotService::class);
        $nextMon = Carbon::now($this->tz)->next(Carbon::MONDAY)->format('Y-m-d');
        $slots = $slotService->getAvailableSlots($teacher->id, $nextMon);
        $times = array_map(fn ($s) => Carbon::parse($s['start_at'])->setTimezone($this->tz)->format('H:i'), $slots);

        $this->assertEquals(['10:00', '11:00', '12:00', '13:00'], $times);
    }

    /**
     * Edge Case 22: Creating custom availability over a multi-day calendar date range.
     */
    public function test_creating_custom_availability_over_date_range(): void
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        $startDay = Carbon::now($this->tz)->addDays(10)->format('Y-m-d');
        $endDay = Carbon::now($this->tz)->addDays(12)->format('Y-m-d');

        $response = $this->actingAs($teacher)->post('/teacher/availability', [
            'type' => 'custom',
            'start_date' => $startDay,
            'end_date' => $endDay,
            'start_time' => '10:00',
            'end_time' => '13:00',
            'slot_duration' => 60,
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $cursor = Carbon::parse($startDay, $this->tz);
        $limit = Carbon::parse($endDay, $this->tz);
        $slotService = app(SlotService::class);

        while ($cursor->lte($limit)) {
            $dStr = $cursor->format('Y-m-d');
            $this->assertDatabaseHas('teacher_availabilities', [
                'teacher_id' => $teacher->id,
                'type' => 'custom',
                'start_at' => "{$dStr} 10:00:00",
                'end_at' => "{$dStr} 13:00:00",
                'slot_duration' => 60,
            ]);

            $slots = $slotService->getAvailableSlots($teacher->id, $dStr);
            $times = array_map(fn ($s) => Carbon::parse($s['start_at'])->setTimezone($this->tz)->format('H:i'), $slots);
            $this->assertEquals(['10:00', '11:00', '12:00'], $times);

            $cursor->addDay();
        }
    }

    /**
     * Edge Case 23: Creating availability for today when time has partially passed clamps to current time forward.
     */
    public function test_creating_availability_today_clamps_passed_hours(): void
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        Carbon::setTestNow(Carbon::parse('2026-09-15 14:15:00', $this->tz));

        try {
            $response = $this->actingAs($teacher)->post('/teacher/availability', [
                'type' => 'custom',
                'start_date' => '2026-09-15',
                'end_date' => '2026-09-15',
                'start_time' => '10:00',
                'end_time' => '21:00',
                'slot_duration' => 30,
            ]);

            $response->assertRedirect();
            $response->assertSessionHas('success');

            // 14:15 rounded to next 30-min boundary is 14:30
            $this->assertDatabaseHas('teacher_availabilities', [
                'teacher_id' => $teacher->id,
                'type' => 'custom',
                'start_at' => '2026-09-15 14:30:00',
                'end_at' => '2026-09-15 21:00:00',
            ]);

            $slotService = app(SlotService::class);
            $slots = $slotService->getAvailableSlots($teacher->id, '2026-09-15');
            $times = array_map(fn ($s) => Carbon::parse($s['start_at'])->setTimezone($this->tz)->format('H:i'), $slots);

            // Passed hours skipped
            $this->assertNotContains('10:00', $times);
            $this->assertNotContains('12:00', $times);
            $this->assertNotContains('14:00', $times);

            // Forward hours present
            $this->assertContains('14:30', $times);
            $this->assertContains('15:00', $times);
            $this->assertContains('20:30', $times);
        } finally {
            Carbon::setTestNow();
        }
    }

    /**
     * Edge Case 24: Date range creation clamps today while future days start at the full requested start time.
     */
    public function test_creating_availability_date_range_clamps_today_future_days_full(): void
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        Carbon::setTestNow(Carbon::parse('2026-09-15 14:15:00', $this->tz));

        try {
            $response = $this->actingAs($teacher)->post('/teacher/availability', [
                'type' => 'custom',
                'start_date' => '2026-09-15',
                'end_date' => '2026-09-16',
                'start_time' => '10:00',
                'end_time' => '18:00',
                'slot_duration' => 60,
            ]);

            $response->assertRedirect();
            $response->assertSessionHas('success');

            // Today clamped to 15:00:00 (next 60-min boundary after 14:15)
            $this->assertDatabaseHas('teacher_availabilities', [
                'teacher_id' => $teacher->id,
                'type' => 'custom',
                'start_at' => '2026-09-15 15:00:00',
                'end_at' => '2026-09-15 18:00:00',
            ]);

            // Tomorrow starts at full 10:00:00
            $this->assertDatabaseHas('teacher_availabilities', [
                'teacher_id' => $teacher->id,
                'type' => 'custom',
                'start_at' => '2026-09-16 10:00:00',
                'end_at' => '2026-09-16 18:00:00',
            ]);

            $slotService = app(SlotService::class);
            $tomorrowSlots = $slotService->getAvailableSlots($teacher->id, '2026-09-16');
            $tomorrowTimes = array_map(fn ($s) => Carbon::parse($s['start_at'])->setTimezone($this->tz)->format('H:i'), $tomorrowSlots);

            $this->assertContains('10:00', $tomorrowTimes);
            $this->assertContains('17:00', $tomorrowTimes);
            $this->assertCount(8, $tomorrowTimes);
        } finally {
            Carbon::setTestNow();
        }
    }

    /**
     * Edge Case 25: Skips today if entire window has passed, but successfully creates future days.
     */
    public function test_skips_today_if_window_passed_but_creates_future_days(): void
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        Carbon::setTestNow(Carbon::parse('2026-09-15 22:00:00', $this->tz));

        try {
            $response = $this->actingAs($teacher)->post('/teacher/availability', [
                'type' => 'custom',
                'start_date' => '2026-09-15',
                'end_date' => '2026-09-16',
                'start_time' => '10:00',
                'end_time' => '18:00',
                'slot_duration' => 60,
            ]);

            $response->assertRedirect();
            $response->assertSessionHas('success');

            // Today has NO records because window 10:00-18:00 was completely passed at 22:00
            $this->assertDatabaseMissing('teacher_availabilities', [
                'teacher_id' => $teacher->id,
                'type' => 'custom',
                'start_at' => '2026-09-15 10:00:00',
            ]);

            // Tomorrow has full record
            $this->assertDatabaseHas('teacher_availabilities', [
                'teacher_id' => $teacher->id,
                'type' => 'custom',
                'start_at' => '2026-09-16 10:00:00',
                'end_at' => '2026-09-16 18:00:00',
            ]);
        } finally {
            Carbon::setTestNow();
        }
    }

    /**
     * Edge Case 26: Attempting to create availability entirely in the past is rejected.
     */
    public function test_creating_availability_entirely_in_past_is_rejected(): void
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        Carbon::setTestNow(Carbon::parse('2026-09-15 22:00:00', $this->tz));

        try {
            $response = $this->actingAs($teacher)->post('/teacher/availability', [
                'type' => 'custom',
                'start_date' => '2026-09-15',
                'end_date' => '2026-09-15',
                'start_time' => '10:00',
                'end_time' => '18:00',
                'slot_duration' => 60,
            ]);

            $response->assertSessionHasErrors('start_date');
        } finally {
            Carbon::setTestNow();
        }
    }
}

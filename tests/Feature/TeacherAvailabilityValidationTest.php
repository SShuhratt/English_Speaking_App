<?php

namespace Tests\Feature;

use App\Models\TeacherAvailability;
use App\Models\User;
use App\Services\SlotService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TeacherAvailabilityValidationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Carbon::setTestNow('2026-10-05 10:00:00'); // Monday in Tashkent (+05:00 is 15:00)
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    public function test_cannot_store_overlapping_recurring_availability_on_same_weekday(): void
    {
        $teacher = User::factory()->create(['role' => 'teacher']);

        // First recurring: Monday 13:00 - 21:00
        TeacherAvailability::create([
            'teacher_id' => $teacher->id,
            'type' => 'recurring',
            'day_of_week' => 'monday',
            'start_time' => '13:00',
            'end_time' => '21:00',
            'slot_duration' => 30,
            'is_active' => true,
        ]);

        // Attempt second overlapping recurring: Monday 12:45 - 23:15
        $response = $this->actingAs($teacher)->post('/teacher/availability', [
            'type' => 'recurring',
            'days_of_week' => ['monday'],
            'start_time' => '12:45',
            'end_time' => '23:15',
            'slot_duration' => 30,
        ]);

        $response->assertSessionHasErrors(['start_time']);

        // Assert only 1 availability exists
        $this->assertEquals(1, TeacherAvailability::where('teacher_id', $teacher->id)->where('type', 'recurring')->count());
    }

    public function test_can_store_non_overlapping_recurring_availability_on_same_weekday(): void
    {
        $teacher = User::factory()->create(['role' => 'teacher']);

        // First recurring: Monday 09:00 - 12:00
        TeacherAvailability::create([
            'teacher_id' => $teacher->id,
            'type' => 'recurring',
            'day_of_week' => 'monday',
            'start_time' => '09:00',
            'end_time' => '12:00',
            'slot_duration' => 30,
            'is_active' => true,
        ]);

        // Second non-overlapping: Monday 14:00 - 18:00
        $response = $this->actingAs($teacher)->post('/teacher/availability', [
            'type' => 'recurring',
            'days_of_week' => ['monday'],
            'start_time' => '14:00',
            'end_time' => '18:00',
            'slot_duration' => 30,
        ]);

        $response->assertRedirect();
        $this->assertEquals(2, TeacherAvailability::where('teacher_id', $teacher->id)->where('type', 'recurring')->count());
    }

    public function test_cannot_store_custom_availability_when_recurring_exists_without_clearing_first(): void
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        $targetDate = '2026-10-12'; // Next Monday

        // Active recurring schedule for Monday
        TeacherAvailability::create([
            'teacher_id' => $teacher->id,
            'type' => 'recurring',
            'day_of_week' => 'monday',
            'start_time' => '10:00',
            'end_time' => '20:00',
            'slot_duration' => 30,
            'is_active' => true,
        ]);

        // Attempt custom availability on that Monday without clearing first
        $response = $this->actingAs($teacher)->post('/teacher/availability', [
            'type' => 'custom',
            'start_date' => $targetDate,
            'end_date' => $targetDate,
            'start_time' => '12:45',
            'end_time' => '18:00',
            'slot_duration' => 30,
        ]);

        $response->assertSessionHasErrors(['start_date']);
        $this->assertEquals(0, TeacherAvailability::where('teacher_id', $teacher->id)->where('type', 'custom')->count());
    }

    public function test_can_store_custom_availability_after_recurring_is_cleared_for_that_date(): void
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        $targetDate = '2026-10-12'; // Next Monday

        TeacherAvailability::create([
            'teacher_id' => $teacher->id,
            'type' => 'recurring',
            'day_of_week' => 'monday',
            'start_time' => '10:00',
            'end_time' => '20:00',
            'slot_duration' => 30,
            'is_active' => true,
        ]);

        // Clear the day first for date_only
        $this->actingAs($teacher)->post('/teacher/availability/clear', [
            'date' => $targetDate,
            'scope' => 'date_only',
        ]);

        // Now adding custom availability on the cleared date should succeed
        $response = $this->actingAs($teacher)->post('/teacher/availability', [
            'type' => 'custom',
            'start_date' => $targetDate,
            'end_date' => $targetDate,
            'start_time' => '12:45',
            'end_time' => '18:00',
            'slot_duration' => 30,
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('teacher_availabilities', [
            'teacher_id' => $teacher->id,
            'type' => 'custom',
            'is_active' => true,
        ]);

        // Verify SlotService returns ONLY the custom slots, not recurring slots
        $slotService = app(SlotService::class);
        $slots = $slotService->getAvailableSlots($teacher->id, $targetDate);

        // Every slot must start at :45 or :15 (from 12:45 to 18:00), no :00 or :30 recurring slots
        $this->assertNotEmpty($slots);
        foreach ($slots as $slot) {
            $carbon = Carbon::parse($slot['start_at'])->setTimezone('Asia/Tashkent');
            $this->assertContains($carbon->minute, [15, 45], "Slot at {$carbon->format('H:i')} is not aligned with custom 12:45 schedule");
        }
    }

    public function test_cannot_store_overlapping_custom_availability_on_same_date(): void
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        $targetDate = '2026-10-14'; // Wednesday (no recurring)

        // Store first custom availability: 10:00 - 15:00
        $this->actingAs($teacher)->post('/teacher/availability', [
            'type' => 'custom',
            'start_date' => $targetDate,
            'end_date' => $targetDate,
            'start_time' => '10:00',
            'end_time' => '15:00',
            'slot_duration' => 30,
        ]);

        // Attempt overlapping custom availability: 14:00 - 18:00
        $response = $this->actingAs($teacher)->post('/teacher/availability', [
            'type' => 'custom',
            'start_date' => $targetDate,
            'end_date' => $targetDate,
            'start_time' => '14:00',
            'end_time' => '18:00',
            'slot_duration' => 30,
        ]);

        $response->assertSessionHasErrors(['start_date']);
    }

    public function test_clearing_single_slot_on_recurring_schedule_leaves_remaining_slots_available(): void
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        $targetDate = '2026-10-12'; // Monday

        $recurring = TeacherAvailability::create([
            'teacher_id' => $teacher->id,
            'type' => 'recurring',
            'day_of_week' => 'monday',
            'start_time' => '10:00',
            'end_time' => '12:00',
            'slot_duration' => 30,
            'is_active' => true,
        ]);

        // Remove single slot 10:30 - 11:00 for date_only
        $response = $this->actingAs($teacher)->delete("/teacher/availability/{$recurring->id}", [
            'delete_type' => 'range',
            'scope' => 'date_only',
            'date' => $targetDate,
            'range_start' => '10:30',
            'range_end' => '11:00',
        ]);
        $response->assertRedirect();

        $slotService = app(SlotService::class);
        $slots = $slotService->getAvailableSlots($teacher->id, $targetDate);

        // Should have 10:00-10:30 and 11:00-11:30 and 11:30-12:00 (3 slots), but NOT 10:30
        $this->assertCount(3, $slots);
        $times = array_map(fn ($s) => Carbon::parse($s['start_at'])->setTimezone('Asia/Tashkent')->format('H:i'), $slots);
        $this->assertContains('10:00', $times);
        $this->assertNotContains('10:30', $times);
        $this->assertContains('11:00', $times);
        $this->assertContains('11:30', $times);
    }

    public function test_clearing_entire_day_leaves_zero_slots_for_that_date(): void
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        $targetDate = '2026-10-12'; // Monday

        TeacherAvailability::create([
            'teacher_id' => $teacher->id,
            'type' => 'recurring',
            'day_of_week' => 'monday',
            'start_time' => '10:00',
            'end_time' => '18:00',
            'slot_duration' => 30,
            'is_active' => true,
        ]);

        // Clear day for date_only
        $response = $this->actingAs($teacher)->post('/teacher/availability/clear', [
            'date' => $targetDate,
            'scope' => 'date_only',
        ]);
        $response->assertRedirect();

        $slotService = app(SlotService::class);
        $slots = $slotService->getAvailableSlots($teacher->id, $targetDate);

        // Exactly 0 slots
        $this->assertEmpty($slots);
    }

    public function test_cannot_store_recurring_availability_when_conflicting_custom_availability_exists(): void
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        $targetDate = '2026-10-12'; // Next Monday

        // First store custom availability on next Monday: 10:00 - 15:00
        TeacherAvailability::create([
            'teacher_id' => $teacher->id,
            'type' => 'custom',
            'start_at' => Carbon::parse("{$targetDate} 10:00:00", 'Asia/Tashkent'),
            'end_at' => Carbon::parse("{$targetDate} 15:00:00", 'Asia/Tashkent'),
            'slot_duration' => 30,
            'is_active' => true,
        ]);

        // Attempt to create recurring schedule for Monday: 12:00 - 18:00
        $response = $this->actingAs($teacher)->post('/teacher/availability', [
            'type' => 'recurring',
            'days_of_week' => ['monday'],
            'start_time' => '12:00',
            'end_time' => '18:00',
            'slot_duration' => 30,
        ]);

        $response->assertSessionHasErrors(['start_time']);
    }
}

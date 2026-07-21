<?php

namespace Tests\Feature;

use App\Models\TeacherAvailability;
use App\Models\User;
use App\Services\SlotService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithoutMiddleware;
use Tests\TestCase;

class AvailabilityTimezoneTest extends TestCase
{
    use RefreshDatabase, WithoutMiddleware;

    public function test_recurring_slots_are_generated_in_tashkent_timezone_without_hour_shift()
    {
        $teacher = User::factory()->create(['role' => 'teacher']);

        TeacherAvailability::create([
            'teacher_id' => $teacher->id,
            'type' => 'recurring',
            'day_of_week' => 'monday',
            'start_time' => '10:00:00',
            'end_time' => '12:00:00',
            'slot_duration' => 30,
            'is_active' => true,
        ]);

        $futureMonday = Carbon::now('Asia/Tashkent')->next(Carbon::MONDAY);
        $dateStr = $futureMonday->format('Y-m-d');

        $slotService = new SlotService;
        $slots = $slotService->getAvailableSlots($teacher->id, $dateStr);

        $this->assertNotEmpty($slots);

        // First slot should start at 10:00 in Asia/Tashkent
        $firstSlotStart = Carbon::parse($slots[0]['start_at'])->setTimezone('Asia/Tashkent');
        $this->assertEquals('10:00', $firstSlotStart->format('H:i'));
        $this->assertEquals($dateStr, $firstSlotStart->format('Y-m-d'));
    }

    public function test_duplicate_slots_are_removed()
    {
        $teacher = User::factory()->create(['role' => 'teacher']);

        // Create two identical recurring availabilities
        TeacherAvailability::create([
            'teacher_id' => $teacher->id,
            'type' => 'recurring',
            'day_of_week' => 'tuesday',
            'start_time' => '14:00:00',
            'end_time' => '15:00:00',
            'slot_duration' => 30,
            'is_active' => true,
        ]);

        TeacherAvailability::create([
            'teacher_id' => $teacher->id,
            'type' => 'recurring',
            'day_of_week' => 'tuesday',
            'start_time' => '14:00:00',
            'end_time' => '15:00:00',
            'slot_duration' => 30,
            'is_active' => true,
        ]);

        $futureTuesday = Carbon::now('Asia/Tashkent')->next(Carbon::TUESDAY);
        $dateStr = $futureTuesday->format('Y-m-d');

        $slotService = new SlotService;
        $slots = $slotService->getAvailableSlots($teacher->id, $dateStr);

        // Should only have 2 unique slots (14:00 and 14:30), not 4
        $this->assertCount(2, $slots);
        $startTimes = array_map(function ($s) {
            return Carbon::parse($s['start_at'])->setTimezone('Asia/Tashkent')->format('H:i');
        }, $slots);

        $this->assertEquals(['14:00', '14:30'], $startTimes);
    }

    public function test_past_slots_for_today_are_filtered_out()
    {
        $teacher = User::factory()->create(['role' => 'teacher']);

        // Set Carbon::setTestNow to a fixed Monday at 11:15 AM
        $testNow = Carbon::parse('2026-07-20 11:15:00', 'Asia/Tashkent');
        Carbon::setTestNow($testNow);

        TeacherAvailability::create([
            'teacher_id' => $teacher->id,
            'type' => 'recurring',
            'day_of_week' => 'monday',
            'start_time' => '10:00:00',
            'end_time' => '13:00:00',
            'slot_duration' => 30,
            'is_active' => true,
        ]);

        $slotService = new SlotService;
        $slots = $slotService->getAvailableSlots($teacher->id, '2026-07-20');

        $startTimes = array_map(function ($s) {
            return Carbon::parse($s['start_at'])->setTimezone('Asia/Tashkent')->format('H:i');
        }, $slots);

        // 10:00, 10:30, 11:00 have passed (since testNow is 11:15).
        // Only 11:30, 12:00, 12:30 should be available.
        $this->assertNotContains('10:00', $startTimes);
        $this->assertNotContains('10:30', $startTimes);
        $this->assertNotContains('11:00', $startTimes);
        $this->assertContains('11:30', $startTimes);
        $this->assertContains('12:00', $startTimes);
        $this->assertContains('12:30', $startTimes);

        Carbon::setTestNow(); // Reset testNow
    }

    public function test_updating_profile_does_not_affect_teacher_availabilities()
    {
        $teacher = User::factory()->create(['role' => 'teacher']);

        TeacherAvailability::create([
            'teacher_id' => $teacher->id,
            'type' => 'recurring',
            'day_of_week' => 'monday',
            'start_time' => '10:00:00',
            'end_time' => '12:00:00',
            'slot_duration' => 30,
            'is_active' => true,
        ]);

        $response = $this->actingAs($teacher)->patch('/settings/profile', [
            'name' => 'Updated Teacher Name',
            'email' => $teacher->email,
            'headline' => 'New Headline',
            'bio' => 'New bio text',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('users', [
            'id' => $teacher->id,
            'full_name' => 'Updated Teacher Name',
        ]);

        // Availability should remain intact
        $this->assertDatabaseHas('teacher_availabilities', [
            'teacher_id' => $teacher->id,
            'day_of_week' => 'monday',
            'start_time' => '10:00:00',
        ]);
    }
}

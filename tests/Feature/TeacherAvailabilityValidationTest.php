<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\TeacherAvailability;
use App\Models\User;
use App\Services\SlotService;
use App\Support\PlatformTime;
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

    public function test_storing_overlapping_custom_availability_merges_into_continuous_range(): void
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

        // Attempt overlapping custom availability: 14:00 - 18:00 -> should automatically merge
        $response = $this->actingAs($teacher)->post('/teacher/availability', [
            'type' => 'custom',
            'start_date' => $targetDate,
            'end_date' => $targetDate,
            'start_time' => '14:00',
            'end_time' => '18:00',
            'slot_duration' => 30,
        ]);

        $response->assertSessionHasNoErrors();
        $response->assertRedirect();

        $records = TeacherAvailability::where('teacher_id', $teacher->id)
            ->where('type', 'custom')
            ->where('is_active', true)
            ->get();

        $this->assertCount(1, $records);
        $merged = $records->first();
        $this->assertEquals('10:00', PlatformTime::toLocal($merged->start_at)->format('H:i'));
        $this->assertEquals('18:00', PlatformTime::toLocal($merged->end_at)->format('H:i'));
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

    public function test_past_appointments_do_not_block_updating_availability(): void
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        $pupil = User::factory()->create(['role' => 'pupil']);

        // Past custom availability (e.g. yesterday 2026-10-04 10:00 - 18:00)
        $avail = TeacherAvailability::create([
            'teacher_id' => $teacher->id,
            'type' => 'custom',
            'start_at' => Carbon::parse('2026-10-04 10:00:00', 'Asia/Tashkent'),
            'end_at' => Carbon::parse('2026-10-04 18:00:00', 'Asia/Tashkent'),
            'slot_duration' => 30,
            'is_active' => true,
        ]);

        // Past confirmed appointment that ended yesterday
        Appointment::create([
            'teacher_id' => $teacher->id,
            'pupil_id' => $pupil->id,
            'start_at' => Carbon::parse('2026-10-04 11:00:00', 'Asia/Tashkent'),
            'end_at' => Carbon::parse('2026-10-04 11:30:00', 'Asia/Tashkent'),
            'status' => 'confirmed',
            'duration_minutes' => 30,
        ]);

        // Update the availability hours: should SUCCEED because appointment has already elapsed
        $response = $this->actingAs($teacher)->put("/teacher/availability/{$avail->id}", [
            'type' => 'custom',
            'start_at' => Carbon::parse('2026-10-04 09:00:00', 'Asia/Tashkent')->toISOString(),
            'end_at' => Carbon::parse('2026-10-04 19:00:00', 'Asia/Tashkent')->toISOString(),
            'slot_duration' => 30,
        ]);

        $response->assertSessionHasNoErrors();
        $response->assertRedirect();
    }

    public function test_upcoming_appointments_block_updating_availability(): void
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        $pupil = User::factory()->create(['role' => 'pupil']);

        // Upcoming custom availability for tomorrow (2026-10-06 10:00 - 18:00)
        $avail = TeacherAvailability::create([
            'teacher_id' => $teacher->id,
            'type' => 'custom',
            'start_at' => Carbon::parse('2026-10-06 10:00:00', 'Asia/Tashkent'),
            'end_at' => Carbon::parse('2026-10-06 18:00:00', 'Asia/Tashkent'),
            'slot_duration' => 30,
            'is_active' => true,
        ]);

        // Upcoming booked appointment tomorrow
        Appointment::create([
            'teacher_id' => $teacher->id,
            'pupil_id' => $pupil->id,
            'start_at' => Carbon::parse('2026-10-06 11:00:00', 'Asia/Tashkent'),
            'end_at' => Carbon::parse('2026-10-06 11:30:00', 'Asia/Tashkent'),
            'status' => 'confirmed',
            'duration_minutes' => 30,
        ]);

        // Try to update availability: should be blocked
        $response = $this->actingAs($teacher)->put("/teacher/availability/{$avail->id}", [
            'type' => 'custom',
            'start_at' => Carbon::parse('2026-10-06 14:00:00', 'Asia/Tashkent')->toISOString(),
            'end_at' => Carbon::parse('2026-10-06 18:00:00', 'Asia/Tashkent')->toISOString(),
            'slot_duration' => 30,
        ]);

        $response->assertSessionHasErrors(['range']);
    }

    public function test_cannot_change_availability_type_on_update(): void
    {
        $teacher = User::factory()->create(['role' => 'teacher']);

        $recurring = TeacherAvailability::create([
            'teacher_id' => $teacher->id,
            'type' => 'recurring',
            'day_of_week' => 'monday',
            'start_time' => '10:00',
            'end_time' => '18:00',
            'slot_duration' => 30,
            'is_active' => true,
        ]);

        $response = $this->actingAs($teacher)->put("/teacher/availability/{$recurring->id}", [
            'type' => 'custom',
            'start_at' => Carbon::parse('2026-10-12 10:00:00', 'Asia/Tashkent')->toISOString(),
            'end_at' => Carbon::parse('2026-10-12 18:00:00', 'Asia/Tashkent')->toISOString(),
            'slot_duration' => 30,
        ]);

        $response->assertSessionHasErrors(['range']);
    }

    public function test_can_edit_custom_availability_across_free_time_gap(): void
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        $targetDate = '2026-10-06';

        // Split availability on target date with a gap in between:
        // Chunk 1: 15:45 - 16:15
        $chunk1 = TeacherAvailability::create([
            'teacher_id' => $teacher->id,
            'type' => 'custom',
            'start_at' => Carbon::parse("{$targetDate} 15:45:00", 'Asia/Tashkent'),
            'end_at' => Carbon::parse("{$targetDate} 16:15:00", 'Asia/Tashkent'),
            'slot_duration' => 30,
            'is_active' => true,
        ]);

        // Gap: 16:15 - 16:45 (free time)

        // Chunk 2: 16:45 - 23:15
        TeacherAvailability::create([
            'teacher_id' => $teacher->id,
            'type' => 'custom',
            'start_at' => Carbon::parse("{$targetDate} 16:45:00", 'Asia/Tashkent'),
            'end_at' => Carbon::parse("{$targetDate} 23:15:00", 'Asia/Tashkent'),
            'slot_duration' => 30,
            'is_active' => true,
        ]);

        // Edit Chunk 1 to expand from 15:20 to 23:20 across the free time gap and encompassing Chunk 2
        $response = $this->actingAs($teacher)->put("/teacher/availability/{$chunk1->id}", [
            'type' => 'custom',
            'start_at' => Carbon::parse("{$targetDate} 15:20:00", 'Asia/Tashkent')->toISOString(),
            'end_at' => Carbon::parse("{$targetDate} 23:20:00", 'Asia/Tashkent')->toISOString(),
            'slot_duration' => 30,
        ]);

        $response->assertSessionHasNoErrors();
        $response->assertRedirect();

        // Chunk 2 should be absorbed/deleted, Chunk 1 should span 15:20 - 23:20
        $activeChunks = TeacherAvailability::where('teacher_id', $teacher->id)
            ->where('type', 'custom')
            ->where('is_active', true)
            ->get();

        $this->assertCount(1, $activeChunks);
        $finalChunk = $activeChunks->first();
        $this->assertEquals($chunk1->id, $finalChunk->id);
        $this->assertEquals('15:20', PlatformTime::toLocal($finalChunk->start_at)->format('H:i'));
        $this->assertEquals('23:20', PlatformTime::toLocal($finalChunk->end_at)->format('H:i'));
    }

    public function test_validation_messages_are_translated_into_russian_and_uzbek(): void
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        $pupil = User::factory()->create(['role' => 'pupil']);

        $avail = TeacherAvailability::create([
            'teacher_id' => $teacher->id,
            'type' => 'custom',
            'start_at' => Carbon::parse('2026-10-08 10:00:00', 'Asia/Tashkent'),
            'end_at' => Carbon::parse('2026-10-08 18:00:00', 'Asia/Tashkent'),
            'slot_duration' => 30,
            'is_active' => true,
        ]);

        Appointment::create([
            'teacher_id' => $teacher->id,
            'pupil_id' => $pupil->id,
            'start_at' => Carbon::parse('2026-10-08 11:00:00', 'Asia/Tashkent'),
            'end_at' => Carbon::parse('2026-10-08 11:30:00', 'Asia/Tashkent'),
            'status' => 'confirmed',
            'duration_minutes' => 30,
        ]);

        // Request with Russian locale cookie
        $responseRu = $this->actingAs($teacher)
            ->withUnencryptedCookie('locale', 'ru')
            ->put("/teacher/availability/{$avail->id}", [
                'type' => 'custom',
                'start_at' => Carbon::parse('2026-10-08 14:00:00', 'Asia/Tashkent')->toISOString(),
                'end_at' => Carbon::parse('2026-10-08 18:00:00', 'Asia/Tashkent')->toISOString(),
                'slot_duration' => 30,
            ]);

        $responseRu->assertSessionHasErrors(['range' => 'Невозможно обновить это расписание, так как на него есть запланированные уроки. Пожалуйста, сначала отмените или перенесите их.']);

        // Request with Uzbek locale cookie
        $responseUz = $this->actingAs($teacher)
            ->withUnencryptedCookie('locale', 'uz')
            ->put("/teacher/availability/{$avail->id}", [
                'type' => 'custom',
                'start_at' => Carbon::parse('2026-10-08 14:00:00', 'Asia/Tashkent')->toISOString(),
                'end_at' => Carbon::parse('2026-10-08 18:00:00', 'Asia/Tashkent')->toISOString(),
                'slot_duration' => 30,
            ]);

        $responseUz->assertSessionHasErrors(['range' => "Ushbu bandlikni yangilab bo'lmaydi, chunki unda rejalashtirilgan suhbatlar mavjud. Iltimos, avval ularni bekor qiling yoki boshqa vaqtga ko'chiring."]);
    }

    public function test_can_edit_custom_availability_across_blackout_in_gap(): void
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        $targetDate = '2026-10-07';

        // Chunk 1: 10:00 - 12:00
        $chunk1 = TeacherAvailability::create([
            'teacher_id' => $teacher->id,
            'type' => 'custom',
            'start_at' => Carbon::parse("{$targetDate} 10:00:00", 'Asia/Tashkent'),
            'end_at' => Carbon::parse("{$targetDate} 12:00:00", 'Asia/Tashkent'),
            'slot_duration' => 30,
            'is_active' => true,
        ]);

        // Blackout in gap: 12:00 - 13:00 (is_active = false)
        TeacherAvailability::create([
            'teacher_id' => $teacher->id,
            'type' => 'custom',
            'start_at' => Carbon::parse("{$targetDate} 12:00:00", 'Asia/Tashkent'),
            'end_at' => Carbon::parse("{$targetDate} 13:00:00", 'Asia/Tashkent'),
            'slot_duration' => 30,
            'is_active' => false,
        ]);

        // Chunk 2: 13:00 - 17:00
        TeacherAvailability::create([
            'teacher_id' => $teacher->id,
            'type' => 'custom',
            'start_at' => Carbon::parse("{$targetDate} 13:00:00", 'Asia/Tashkent'),
            'end_at' => Carbon::parse("{$targetDate} 17:00:00", 'Asia/Tashkent'),
            'slot_duration' => 30,
            'is_active' => true,
        ]);

        // Edit Chunk 1 to expand across the blackout and Chunk 2: 09:00 - 18:00
        $response = $this->actingAs($teacher)->put("/teacher/availability/{$chunk1->id}", [
            'type' => 'custom',
            'start_at' => Carbon::parse("{$targetDate} 09:00:00", 'Asia/Tashkent')->toISOString(),
            'end_at' => Carbon::parse("{$targetDate} 18:00:00", 'Asia/Tashkent')->toISOString(),
            'slot_duration' => 30,
        ]);

        $response->assertSessionHasNoErrors();
        $response->assertRedirect();

        // The blackout must be deleted, Chunk 2 must be deleted, and Chunk 1 must be 09:00 - 18:00
        $this->assertDatabaseMissing('teacher_availabilities', [
            'teacher_id' => $teacher->id,
            'type' => 'custom',
            'is_active' => false,
        ]);

        $activeChunks = TeacherAvailability::where('teacher_id', $teacher->id)
            ->where('type', 'custom')
            ->where('is_active', true)
            ->get();

        $this->assertCount(1, $activeChunks);
        $this->assertEquals('09:00', PlatformTime::toLocal($activeChunks->first()->start_at)->format('H:i'));
        $this->assertEquals('18:00', PlatformTime::toLocal($activeChunks->first()->end_at)->format('H:i'));
    }
}

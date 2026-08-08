<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\TeacherAvailability;
use App\Models\User;
use App\Services\SlotService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TeacherSlotStatusTest extends TestCase
{
    use RefreshDatabase;

    public function test_pending_and_confirmed_appointments_are_hidden_from_pupil_available_slots()
    {
        Carbon::setTestNow(Carbon::parse('2026-08-08 08:00:00', 'Asia/Tashkent'));

        $teacher = User::factory()->create(['role' => 'teacher']);
        $pupil = User::factory()->create(['role' => 'pupil']);

        // Availability: Saturday 11:30 to 16:30 (10 slots)
        TeacherAvailability::create([
            'teacher_id' => $teacher->id,
            'type' => 'recurring',
            'day_of_week' => 'saturday',
            'start_time' => '11:30:00',
            'end_time' => '16:30:00',
            'slot_duration' => 30,
        ]);

        $dateStr = '2026-08-08';

        // 1. Check initial slot count = 10
        $slotService = app(SlotService::class);
        $initialSlots = $slotService->getAvailableSlots($teacher->id, $dateStr);
        $this->assertCount(10, $initialSlots);

        // 2. Book appointment from 11:30 to 13:00 (3 30-min slots: 11:30, 12:00, 12:30)
        Appointment::create([
            'teacher_id' => $teacher->id,
            'pupil_id' => $pupil->id,
            'start_at' => Carbon::parse('2026-08-08 11:30:00', 'Asia/Tashkent'),
            'end_at' => Carbon::parse('2026-08-08 13:00:00', 'Asia/Tashkent'),
            'status' => 'pending',
            'payment_status' => 'verifying',
            'topics' => ['freestyle'],
        ]);

        // 3. Pupil should now see only 7 available slots (11:30, 12:00, 12:30 removed)
        $availableSlots = $slotService->getAvailableSlots($teacher->id, $dateStr);
        $this->assertCount(7, $availableSlots);

        $startTimes = array_map(function ($s) {
            return Carbon::parse($s['start_at'])->setTimezone('Asia/Tashkent')->format('H:i');
        }, $availableSlots);

        $this->assertNotContains('11:30', $startTimes);
        $this->assertNotContains('12:00', $startTimes);
        $this->assertNotContains('12:30', $startTimes);
        $this->assertContains('13:00', $startTimes);

        Carbon::setTestNow();
    }

    public function test_teacher_availability_page_receives_appointments_prop()
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        $pupil = User::factory()->create(['role' => 'pupil']);

        Appointment::create([
            'teacher_id' => $teacher->id,
            'pupil_id' => $pupil->id,
            'start_at' => Carbon::parse('2026-08-08 11:30:00', 'Asia/Tashkent'),
            'end_at' => Carbon::parse('2026-08-08 13:00:00', 'Asia/Tashkent'),
            'status' => 'pending',
            'payment_status' => 'verifying',
            'topics' => ['freestyle'],
        ]);

        $response = $this->actingAs($teacher)->get('/teacher/availability');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('teacher/availability')
            ->has('availabilities')
            ->has('appointments', 1)
        );
    }

    public function test_expired_slots_in_past_are_hidden_from_pupil_available_slots()
    {
        // Set test now to 13:24 on Saturday Aug 8
        Carbon::setTestNow(Carbon::parse('2026-08-08 13:24:00', 'Asia/Tashkent'));

        $teacher = User::factory()->create(['role' => 'teacher']);

        // Teacher is available from 11:30 to 16:30 (10 slots)
        TeacherAvailability::create([
            'teacher_id' => $teacher->id,
            'type' => 'recurring',
            'day_of_week' => 'saturday',
            'start_time' => '11:30:00',
            'end_time' => '16:30:00',
            'slot_duration' => 30,
        ]);

        $slotService = app(SlotService::class);
        $availableSlots = $slotService->getAvailableSlots($teacher->id, '2026-08-08');

        // 11:30, 12:00, 12:30, 13:00 (4 slots) are in the past relative to 13:24.
        // Only 13:30, 14:00, 14:30, 15:00, 15:30, 16:00 should remain (6 slots).
        $this->assertCount(6, $availableSlots);

        $startTimes = array_map(function ($s) {
            return Carbon::parse($s['start_at'])->setTimezone('Asia/Tashkent')->format('H:i');
        }, $availableSlots);

        $this->assertNotContains('11:30', $startTimes);
        $this->assertNotContains('12:00', $startTimes);
        $this->assertNotContains('12:30', $startTimes);
        $this->assertNotContains('13:00', $startTimes);
        $this->assertContains('13:30', $startTimes);

        Carbon::setTestNow();
    }
}

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

    public function test_unpaid_appointments_past_scheduled_time_are_cancelled_as_expired_on_availability_index(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-08-08 18:19:00', 'Asia/Tashkent'));

        $teacher = User::factory()->create(['role' => 'teacher']);
        $pupil = User::factory()->create(['role' => 'pupil']);

        // Appointment 17:00 - 17:30 awaiting payment (in the past relative to 18:19)
        $appointment = Appointment::create([
            'teacher_id' => $teacher->id,
            'pupil_id' => $pupil->id,
            'start_at' => Carbon::parse('2026-08-08 17:00:00', 'Asia/Tashkent')->copy()->utc(),
            'end_at' => Carbon::parse('2026-08-08 17:30:00', 'Asia/Tashkent')->copy()->utc(),
            'status' => 'pending',
            'payment_status' => 'verifying',
            'topics' => ['freestyle'],
        ]);

        $response = $this->actingAs($teacher)->get('/teacher/availability');

        $response->assertStatus(200);

        // Assert database appointment was expired and cancelled
        $appointment->refresh();
        $this->assertEquals('cancelled', $appointment->status);
        $this->assertEquals('Conversation time expired without payment', $appointment->cancellation_reason);
        $this->assertEquals('rejected', $appointment->payment_status);
        $this->assertEquals('Payment time expired', $appointment->payment_rejection_reason);

        // Assert Inertia page receives the cancelled appointment with the expiration reason
        $response->assertInertia(fn ($page) => $page
            ->component('teacher/availability')
            ->has('appointments', 1)
            ->where('appointments.0.status', 'cancelled')
            ->where('appointments.0.cancellation_reason', 'Conversation time expired without payment')
        );

        Carbon::setTestNow();
    }

    public function test_multi_slot_unpaid_appointment_expires_only_after_entire_conversation_ends(): void
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        $pupil = User::factory()->create(['role' => 'pupil']);

        // Multi-slot appointment: 17:00 - 18:00 (60 mins, 2 30-min slots)
        $appointment = Appointment::create([
            'teacher_id' => $teacher->id,
            'pupil_id' => $pupil->id,
            'start_at' => Carbon::parse('2026-08-08 17:00:00', 'Asia/Tashkent')->copy()->utc(),
            'end_at' => Carbon::parse('2026-08-08 18:00:00', 'Asia/Tashkent')->copy()->utc(),
            'status' => 'pending',
            'payment_status' => 'verifying',
            'topics' => ['grammar'],
        ]);

        // 1. During the lesson (17:45:00) - should NOT expire yet
        Carbon::setTestNow(Carbon::parse('2026-08-08 17:45:00', 'Asia/Tashkent'));
        $response = $this->actingAs($teacher)->get('/teacher/availability');
        $response->assertStatus(200);

        $appointment->refresh();
        $this->assertEquals('pending', $appointment->status);

        // 2. After the entire lesson ends (18:05:00) - now should expire
        Carbon::setTestNow(Carbon::parse('2026-08-08 18:05:00', 'Asia/Tashkent'));
        $response = $this->actingAs($teacher)->get('/teacher/availability');
        $response->assertStatus(200);

        $appointment->refresh();
        $this->assertEquals('cancelled', $appointment->status);
        $this->assertEquals('Conversation time expired without payment', $appointment->cancellation_reason);

        Carbon::setTestNow();
    }

    public function test_paid_appointment_in_the_past_is_not_cancelled_or_expired(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-08-08 18:19:00', 'Asia/Tashkent'));

        $teacher = User::factory()->create(['role' => 'teacher']);
        $pupil = User::factory()->create(['role' => 'pupil']);

        // Paid appointment 17:00 - 18:00
        $appointment = Appointment::create([
            'teacher_id' => $teacher->id,
            'pupil_id' => $pupil->id,
            'start_at' => Carbon::parse('2026-08-08 17:00:00', 'Asia/Tashkent')->copy()->utc(),
            'end_at' => Carbon::parse('2026-08-08 18:00:00', 'Asia/Tashkent')->copy()->utc(),
            'status' => 'confirmed',
            'payment_status' => 'paid',
            'topics' => ['ielts_mock'],
        ]);

        $response = $this->actingAs($teacher)->get('/teacher/availability');
        $response->assertStatus(200);

        $appointment->refresh();
        $this->assertEquals('confirmed', $appointment->status);
        $this->assertEquals('paid', $appointment->payment_status);
        $this->assertNull($appointment->cancellation_reason);

        Carbon::setTestNow();
    }

    public function test_upcoming_unpaid_appointment_does_not_expire_prematurely(): void
    {
        // Current time is 18:35 Asia/Tashkent (13:35 UTC)
        Carbon::setTestNow(Carbon::parse('2026-08-08 18:35:00', 'Asia/Tashkent'));

        $teacher = User::factory()->create(['role' => 'teacher']);
        $pupil = User::factory()->create(['role' => 'pupil']);

        // Appointment scheduled for 19:00 - 19:30 Asia/Tashkent (14:00 - 14:30 UTC), awaiting payment
        $appointment = Appointment::create([
            'teacher_id' => $teacher->id,
            'pupil_id' => $pupil->id,
            'start_at' => Carbon::parse('2026-08-08 19:00:00', 'Asia/Tashkent')->copy()->utc(),
            'end_at' => Carbon::parse('2026-08-08 19:30:00', 'Asia/Tashkent')->copy()->utc(),
            'status' => 'accepted',
            'payment_status' => 'verifying',
            'topics' => ['freestyle'],
        ]);

        $response = $this->actingAs($teacher)->get('/teacher/availability');
        $response->assertStatus(200);

        // Assert appointment is NOT cancelled or expired
        $appointment->refresh();
        $this->assertEquals('accepted', $appointment->status);
        $this->assertEquals('verifying', $appointment->payment_status);
        $this->assertNull($appointment->cancellation_reason);

        // Assert Inertia receives it in active status
        $response->assertInertia(fn ($page) => $page
            ->component('teacher/availability')
            ->has('appointments', 1)
            ->where('appointments.0.status', 'accepted')
            ->where('appointments.0.cancellation_reason', null)
        );

        Carbon::setTestNow();
    }
}

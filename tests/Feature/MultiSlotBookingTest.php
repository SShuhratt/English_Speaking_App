<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\TeacherAvailability;
use App\Models\User;
use App\Services\BookingService;
use App\Services\SlotService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithoutMiddleware;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class MultiSlotBookingTest extends TestCase
{
    use RefreshDatabase, WithoutMiddleware;

    protected User $teacher;

    protected User $pupil;

    protected SlotService $slotService;

    protected BookingService $bookingService;

    protected function setUp(): void
    {
        parent::setUp();

        $this->teacher = User::factory()->create(['role' => 'teacher']);
        $this->teacher->teacherProfile()->create([
            'price' => 100000,
        ]);

        $this->pupil = User::factory()->create(['role' => 'pupil']);
        $this->pupil->pupilProfile()->create([]);

        $this->slotService = app(SlotService::class);
        $this->bookingService = app(BookingService::class);
    }

    public function test_pupil_can_book_one_hour_reserving_two_consecutive_30min_slots()
    {
        // Teacher has availability for Monday 21:00 to 22:00 (9-10 PM)
        TeacherAvailability::create([
            'teacher_id' => $this->teacher->id,
            'type' => 'recurring',
            'day_of_week' => 'monday',
            'start_time' => '21:00:00',
            'end_time' => '22:00:00',
            'slot_duration' => 30,
            'is_active' => true,
        ]);

        $mondayStr = Carbon::parse('next monday')->format('Y-m-d');

        // Initially 2 30-min slots are available: 21:00 and 21:30
        $initialSlots = $this->slotService->getAvailableSlots($this->teacher->id, $mondayStr);
        $this->assertCount(2, $initialSlots);

        // Pupil books 1 hour starting at 21:00
        $startAt = Carbon::parse("{$mondayStr} 21:00:00", 'Asia/Tashkent')->toIso8601String();
        $endAt = Carbon::parse("{$mondayStr} 22:00:00", 'Asia/Tashkent')->toIso8601String();

        $response = $this->actingAs($this->pupil)->postJson('/bookings', [
            'teacher_id' => $this->teacher->id,
            'pupil_id' => $this->pupil->id,
            'start_at' => $startAt,
            'end_at' => $endAt,
            'duration_minutes' => 60,
            'topics' => ['freestyle'],
        ]);

        if ($response->status() !== 201) {
            dump($response->json());
        }
        $response->assertStatus(201);

        // Clear cache and verify both 21:00 and 21:30 slots are now booked and removed from available slots
        Cache::flush();
        $remainingSlots = $this->slotService->getAvailableSlots($this->teacher->id, $mondayStr);
        $this->assertCount(0, $remainingSlots);
    }

    public function test_pupil_cannot_book_duration_exceeding_available_consecutive_slots()
    {
        // Teacher available Monday 21:00 to 22:00 (1 hour total)
        TeacherAvailability::create([
            'teacher_id' => $this->teacher->id,
            'type' => 'recurring',
            'day_of_week' => 'monday',
            'start_time' => '21:00:00',
            'end_time' => '22:00:00',
            'slot_duration' => 30,
            'is_active' => true,
        ]);

        $mondayStr = Carbon::parse('next monday')->format('Y-m-d');

        // Pupil tries to book 1.5 hours (90 minutes) starting at 21:00
        $startAt = Carbon::parse("{$mondayStr} 21:00:00", 'Asia/Tashkent')->toIso8601String();
        $endAt = Carbon::parse("{$mondayStr} 22:30:00", 'Asia/Tashkent')->toIso8601String();

        $response = $this->actingAs($this->pupil)->postJson('/bookings', [
            'teacher_id' => $this->teacher->id,
            'pupil_id' => $this->pupil->id,
            'start_at' => $startAt,
            'end_at' => $endAt,
            'duration_minutes' => 90,
            'topics' => ['freestyle'],
        ]);

        $response->assertStatus(422);
    }

    public function test_pupil_cannot_book_when_intermediate_slot_is_already_booked()
    {
        // Teacher available Monday 21:00 to 23:00 (4 slots)
        TeacherAvailability::create([
            'teacher_id' => $this->teacher->id,
            'type' => 'recurring',
            'day_of_week' => 'monday',
            'start_time' => '21:00:00',
            'end_time' => '23:00:00',
            'slot_duration' => 30,
            'is_active' => true,
        ]);

        $mondayStr = Carbon::parse('next monday')->format('Y-m-d');
        $midStart = Carbon::parse("{$mondayStr} 21:30:00", 'Asia/Tashkent')->utc();
        $midEnd = Carbon::parse("{$mondayStr} 22:00:00", 'Asia/Tashkent')->utc();

        // Intermediate slot 21:30-22:00 is already booked by another student
        Appointment::create([
            'teacher_id' => $this->teacher->id,
            'pupil_id' => User::factory()->create(['role' => 'pupil'])->id,
            'start_at' => $midStart,
            'end_at' => $midEnd,
            'status' => 'pending',
            'topics' => ['freestyle'],
        ]);

        // Pupil tries to book 1.5 hours starting at 21:00 (21:00 to 22:30)
        $startAt = Carbon::parse("{$mondayStr} 21:00:00", 'Asia/Tashkent')->toIso8601String();
        $endAt = Carbon::parse("{$mondayStr} 22:30:00", 'Asia/Tashkent')->toIso8601String();

        $response = $this->actingAs($this->pupil)->postJson('/bookings', [
            'teacher_id' => $this->teacher->id,
            'pupil_id' => $this->pupil->id,
            'start_at' => $startAt,
            'end_at' => $endAt,
            'duration_minutes' => 90,
            'topics' => ['freestyle'],
        ]);

        $response->assertStatus(422);
    }

    public function test_pre_start_cancellation_frees_all_consecutive_slots()
    {
        TeacherAvailability::create([
            'teacher_id' => $this->teacher->id,
            'type' => 'recurring',
            'day_of_week' => 'monday',
            'start_time' => '21:00:00',
            'end_time' => '22:00:00',
            'slot_duration' => 30,
            'is_active' => true,
        ]);

        $mondayStr = Carbon::parse('next monday')->format('Y-m-d');
        $start = Carbon::parse("{$mondayStr} 21:00:00", 'Asia/Tashkent');
        $end = Carbon::parse("{$mondayStr} 22:00:00", 'Asia/Tashkent');

        $appointment = Appointment::create([
            'teacher_id' => $this->teacher->id,
            'pupil_id' => $this->pupil->id,
            'start_at' => $start,
            'end_at' => $end,
            'status' => 'cancelled',
            'cancellation_reason' => 'User cancelled in advance',
            'cancelled_by' => $this->pupil->id,
            'updated_at' => $start->copy()->subHours(5),
            'topics' => ['freestyle'],
        ]);

        Cache::forget("teacher:{$this->teacher->id}:slots:{$mondayStr}");
        $availableSlots = $this->slotService->getAvailableSlots($this->teacher->id, $mondayStr);

        // Both 21:00 and 21:30 slots are freed up
        $this->assertCount(2, $availableSlots);
    }

    public function test_mid_session_cancellation_keeps_past_slot_booked_and_frees_future_slot()
    {
        TeacherAvailability::create([
            'teacher_id' => $this->teacher->id,
            'type' => 'recurring',
            'day_of_week' => 'monday',
            'start_time' => '21:00:00',
            'end_time' => '22:00:00',
            'slot_duration' => 30,
            'is_active' => true,
        ]);

        $mondayStr = Carbon::parse('next monday')->format('Y-m-d');
        $start = Carbon::parse("{$mondayStr} 21:00:00", 'Asia/Tashkent');
        $end = Carbon::parse("{$mondayStr} 22:00:00", 'Asia/Tashkent');

        $appointment = new Appointment([
            'teacher_id' => $this->teacher->id,
            'pupil_id' => $this->pupil->id,
            'start_at' => $start,
            'end_at' => $end,
            'status' => 'cancelled',
            'cancellation_reason' => 'Cancelled mid-session',
            'cancelled_by' => $this->pupil->id,
            'topics' => ['freestyle'],
        ]);
        $appointment->timestamps = false;
        $appointment->updated_at = $start->copy()->addMinutes(15)->utc();
        $appointment->save();

        Cache::flush();
        $availableSlots = $this->slotService->getAvailableSlots($this->teacher->id, $mondayStr);

        // 21:00-21:30 remains unavailable, while 21:30-22:00 becomes available again
        $this->assertCount(1, $availableSlots);
        $this->assertStringContainsString('21:30', $availableSlots[0]['start_at']);
    }
}

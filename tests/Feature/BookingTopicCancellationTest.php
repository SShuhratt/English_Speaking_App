<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\TeacherAvailability;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BookingTopicCancellationTest extends TestCase
{
    use RefreshDatabase;

    protected User $teacher;

    protected User $pupil;

    protected Carbon $startAt;

    protected Carbon $endAt;

    protected function setUp(): void
    {
        parent::setUp();

        $this->teacher = User::factory()->create(['role' => 'teacher']);
        $this->pupil = User::factory()->create(['role' => 'pupil']);

        // Create availability for a Monday
        TeacherAvailability::create([
            'teacher_id' => $this->teacher->id,
            'type' => 'recurring',
            'day_of_week' => 'monday',
            'start_time' => '09:00:00',
            'end_time' => '12:00:00',
            'slot_duration' => 60,
        ]);

        $this->startAt = Carbon::parse('next monday 09:00:00');
        $this->endAt = $this->startAt->copy()->addHour();
    }

    public function test_pupil_cannot_book_without_topics()
    {
        $response = $this->actingAs($this->pupil)->post('/bookings', [
            'teacher_id' => $this->teacher->id,
            'pupil_id' => $this->pupil->id,
            'start_at' => $this->startAt->toDateTimeString(),
            'end_at' => $this->endAt->toDateTimeString(),
        ]);

        $response->assertStatus(302);
        $response->assertSessionHasErrors(['topics']);
    }

    public function test_pupil_can_book_with_topics()
    {
        $response = $this->actingAs($this->pupil)->post('/bookings', [
            'teacher_id' => $this->teacher->id,
            'pupil_id' => $this->pupil->id,
            'start_at' => $this->startAt->toDateTimeString(),
            'end_at' => $this->endAt->toDateTimeString(),
            'topics' => ['grammar', 'freestyle', 'custom-topic'],
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('appointments', [
            'teacher_id' => $this->teacher->id,
            'pupil_id' => $this->pupil->id,
            'status' => 'pending',
        ]);

        $appointment = Appointment::first();
        $this->assertEquals(['grammar', 'freestyle', 'custom-topic'], $appointment->topics);
    }

    public function test_pupil_and_teacher_cannot_cancel_without_reason()
    {
        $appointment = Appointment::create([
            'teacher_id' => $this->teacher->id,
            'pupil_id' => $this->pupil->id,
            'start_at' => $this->startAt,
            'end_at' => $this->endAt,
            'status' => 'confirmed',
            'topics' => ['freestyle'],
        ]);

        // Attempt pupil cancel without reason
        $response = $this->actingAs($this->pupil)->delete("/bookings/{$appointment->id}");
        $response->assertStatus(302);
        $response->assertSessionHasErrors(['reason']);

        // Attempt teacher cancel without reason
        $response = $this->actingAs($this->teacher)->delete("/bookings/{$appointment->id}");
        $response->assertStatus(302);
        $response->assertSessionHasErrors(['reason']);
    }

    public function test_pupil_can_cancel_with_valid_reason()
    {
        $appointment = Appointment::create([
            'teacher_id' => $this->teacher->id,
            'pupil_id' => $this->pupil->id,
            'start_at' => $this->startAt,
            'end_at' => $this->endAt,
            'status' => 'confirmed',
            'topics' => ['freestyle'],
        ]);

        $response = $this->actingAs($this->pupil)->delete("/bookings/{$appointment->id}", [
            'reason' => 'I am feeling sick today.',
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('appointments', [
            'id' => $appointment->id,
            'status' => 'cancelled',
            'cancellation_reason' => 'I am feeling sick today.',
            'cancelled_by' => $this->pupil->id,
        ]);
    }

    public function test_teacher_can_cancel_with_valid_reason()
    {
        $appointment = Appointment::create([
            'teacher_id' => $this->teacher->id,
            'pupil_id' => $this->pupil->id,
            'start_at' => $this->startAt,
            'end_at' => $this->endAt,
            'status' => 'confirmed',
            'topics' => ['freestyle'],
        ]);

        $response = $this->actingAs($this->teacher)->delete("/bookings/{$appointment->id}", [
            'reason' => 'Teacher emergency meeting.',
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('appointments', [
            'id' => $appointment->id,
            'status' => 'cancelled',
            'cancellation_reason' => 'Teacher emergency meeting.',
            'cancelled_by' => $this->teacher->id,
        ]);
    }

    public function test_teacher_cannot_reject_without_reason()
    {
        $appointment = Appointment::create([
            'teacher_id' => $this->teacher->id,
            'pupil_id' => $this->pupil->id,
            'start_at' => $this->startAt,
            'end_at' => $this->endAt,
            'status' => 'pending',
            'topics' => ['freestyle'],
        ]);

        $response = $this->actingAs($this->teacher)->post("/teacher/appointments/{$appointment->id}/reject");
        $response->assertStatus(302);
        $response->assertSessionHasErrors(['reason']);
    }

    public function test_teacher_can_reject_with_valid_reason()
    {
        $appointment = Appointment::create([
            'teacher_id' => $this->teacher->id,
            'pupil_id' => $this->pupil->id,
            'start_at' => $this->startAt,
            'end_at' => $this->endAt,
            'status' => 'pending',
            'topics' => ['freestyle'],
        ]);

        $response = $this->actingAs($this->teacher)->post("/teacher/appointments/{$appointment->id}/reject", [
            'reason' => 'I have another event scheduled outside the app.',
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('appointments', [
            'id' => $appointment->id,
            'status' => 'rejected',
            'cancellation_reason' => 'I have another event scheduled outside the app.',
            'cancelled_by' => $this->teacher->id,
        ]);
    }
}

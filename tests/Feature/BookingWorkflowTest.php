<?php

namespace Tests\Feature;

use App\Events\BookingUpdated;
use App\Models\Appointment;
use App\Models\TeacherAvailability;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithoutMiddleware;
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
        ]);

        $response = $this->actingAs($teacher)->postJson("/teacher/appointments/{$appointment->id}/reject");

        $response->assertStatus(200);
        $this->assertDatabaseHas('appointments', [
            'id' => $appointment->id,
            'status' => 'rejected',
        ]);
    }
}

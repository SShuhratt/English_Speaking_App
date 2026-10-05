<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TeacherAppointmentBadgeTest extends TestCase
{
    use RefreshDatabase;

    public function test_approving_appointment_decrements_pending_requests_count_in_inertia_props(): void
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        $pupil = User::factory()->create(['role' => 'pupil']);

        $appointment = Appointment::create([
            'teacher_id' => $teacher->id,
            'pupil_id' => $pupil->id,
            'status' => 'pending',
            'start_at' => now()->addDays(2),
            'end_at' => now()->addDays(2)->addMinutes(30),
        ]);

        // Prior to approval, Inertia shared props has pending_requests_count = 1
        $responseBefore = $this->actingAs($teacher)->get('/teacher/appointments');
        $propsBefore = $responseBefore->viewData('page')['props'];
        $this->assertEquals(1, $propsBefore['auth']['pending_requests_count']);

        // Approve appointment
        $approveResponse = $this->actingAs($teacher)->postJson("/teacher/appointments/{$appointment->id}/approve");
        $approveResponse->assertOk();

        // After approval, Inertia shared props has pending_requests_count = 0
        $responseAfter = $this->actingAs($teacher)->get('/teacher/appointments');
        $propsAfter = $responseAfter->viewData('page')['props'];
        $this->assertEquals(0, $propsAfter['auth']['pending_requests_count']);
    }

    public function test_rejecting_appointment_decrements_pending_requests_count_in_inertia_props(): void
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        $pupil = User::factory()->create(['role' => 'pupil']);

        $appointment = Appointment::create([
            'teacher_id' => $teacher->id,
            'pupil_id' => $pupil->id,
            'status' => 'pending',
            'start_at' => now()->addDays(2),
            'end_at' => now()->addDays(2)->addMinutes(30),
        ]);

        // Prior to rejection, count is 1
        $responseBefore = $this->actingAs($teacher)->get('/teacher/appointments');
        $this->assertEquals(1, $responseBefore->viewData('page')['props']['auth']['pending_requests_count']);

        // Reject appointment
        $rejectResponse = $this->actingAs($teacher)->postJson("/teacher/appointments/{$appointment->id}/reject", [
            'reason' => 'Schedule conflict with another university lecture',
        ]);
        $rejectResponse->assertOk();

        // After rejection, count is 0
        $responseAfter = $this->actingAs($teacher)->get('/teacher/appointments');
        $this->assertEquals(0, $responseAfter->viewData('page')['props']['auth']['pending_requests_count']);
    }
}

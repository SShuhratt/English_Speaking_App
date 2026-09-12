<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class BookingLifecycleEdgeCasesTest extends TestCase
{
    use RefreshDatabase;

    public function test_teacher_cannot_approve_already_cancelled_appointment(): void
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        $pupil = User::factory()->create(['role' => 'pupil']);

        $appointment = Appointment::create([
            'teacher_id' => $teacher->id,
            'pupil_id' => $pupil->id,
            'start_at' => now()->addDay(),
            'end_at' => now()->addDay()->addHour(),
            'status' => 'cancelled',
            'cancellation_reason' => 'Pupil cancelled before approval',
            'cancelled_by' => $pupil->id,
            'topics' => ['freestyle'],
        ]);

        $response = $this->actingAs($teacher)
            ->postJson("/teacher/appointments/{$appointment->id}/approve");

        $response->assertStatus(422);
        $this->assertEquals('cancelled', $appointment->fresh()->status);
    }

    public function test_unauthorized_teacher_cannot_approve_another_teachers_appointment(): void
    {
        $teacherA = User::factory()->create(['role' => 'teacher']);
        $teacherB = User::factory()->create(['role' => 'teacher']);
        $pupil = User::factory()->create(['role' => 'pupil']);

        $appointment = Appointment::create([
            'teacher_id' => $teacherA->id,
            'pupil_id' => $pupil->id,
            'start_at' => now()->addDay(),
            'end_at' => now()->addDay()->addHour(),
            'status' => 'pending',
            'topics' => ['freestyle'],
        ]);

        $response = $this->actingAs($teacherB)
            ->postJson("/teacher/appointments/{$appointment->id}/approve");

        $response->assertStatus(422);
        $this->assertEquals('pending', $appointment->fresh()->status);
    }

    public function test_teacher_cannot_approve_past_expired_appointment(): void
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        $pupil = User::factory()->create(['role' => 'pupil']);

        $appointment = Appointment::create([
            'teacher_id' => $teacher->id,
            'pupil_id' => $pupil->id,
            'start_at' => now()->subHours(2),
            'end_at' => now()->subHour(),
            'status' => 'pending',
            'topics' => ['freestyle'],
        ]);

        $response = $this->actingAs($teacher)
            ->postJson("/teacher/appointments/{$appointment->id}/approve");

        $response->assertStatus(422);
        $this->assertEquals('pending', $appointment->fresh()->status);
    }

    public function test_admin_confirm_payment_on_cancelled_booking_redirects_gracefully_with_error(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $teacher = User::factory()->create(['role' => 'teacher']);
        $pupil = User::factory()->create(['role' => 'pupil']);

        $appointment = Appointment::create([
            'teacher_id' => $teacher->id,
            'pupil_id' => $pupil->id,
            'start_at' => now()->addDay(),
            'end_at' => now()->addDay()->addHour(),
            'status' => 'cancelled',
            'cancellation_reason' => 'Changed mind',
            'cancelled_by' => $pupil->id,
            'topics' => ['freestyle'],
        ]);

        $response = $this->actingAs($admin)
            ->post("/admin/appointments/{$appointment->id}/confirm-payment");

        $response->assertRedirect();
        $response->assertSessionHas('error');
        $this->assertEquals('cancelled', $appointment->fresh()->status);
    }

    public function test_admin_reject_payment_on_cancelled_booking_does_not_overwrite_status(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $teacher = User::factory()->create(['role' => 'teacher']);
        $pupil = User::factory()->create(['role' => 'pupil']);

        $appointment = Appointment::create([
            'teacher_id' => $teacher->id,
            'pupil_id' => $pupil->id,
            'start_at' => now()->addDay(),
            'end_at' => now()->addDay()->addHour(),
            'status' => 'cancelled',
            'cancellation_reason' => 'Pupil family emergency',
            'cancelled_by' => $pupil->id,
            'topics' => ['freestyle'],
        ]);

        $response = $this->actingAs($admin)
            ->post("/admin/appointments/{$appointment->id}/reject-payment", [
                'reason' => 'Invalid transaction slip',
            ]);

        $response->assertRedirect();
        $response->assertSessionHas('error');

        $fresh = $appointment->fresh();
        $this->assertEquals('cancelled', $fresh->status);
        $this->assertEquals('Pupil family emergency', $fresh->cancellation_reason);
        $this->assertEquals($pupil->id, $fresh->cancelled_by);
    }

    public function test_user_cannot_cancel_past_or_completed_appointment(): void
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        $pupil = User::factory()->create(['role' => 'pupil']);

        $pastAppointment = Appointment::create([
            'teacher_id' => $teacher->id,
            'pupil_id' => $pupil->id,
            'start_at' => now()->subHours(2),
            'end_at' => now()->subHour(),
            'status' => 'confirmed',
            'topics' => ['freestyle'],
        ]);

        $response = $this->actingAs($pupil)
            ->deleteJson("/bookings/{$pastAppointment->id}", [
                'reason' => 'Too late to attend',
            ]);

        $response->assertStatus(422);
        $this->assertEquals('confirmed', $pastAppointment->fresh()->status);
    }

    public function test_admin_dashboard_shows_cancelled_appointments_with_metadata(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $teacher = User::factory()->create(['role' => 'teacher']);
        $pupil = User::factory()->create(['role' => 'pupil']);

        Appointment::create([
            'teacher_id' => $teacher->id,
            'pupil_id' => $pupil->id,
            'start_at' => now()->addDay(),
            'end_at' => now()->addDay()->addHour(),
            'status' => 'cancelled',
            'cancellation_reason' => 'Schedule conflict with university exam',
            'cancelled_by' => $pupil->id,
            'topics' => ['freestyle'],
        ]);

        $response = $this->actingAs($admin)
            ->get('/admin/dashboard?status=cancelled');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('admin/dashboard')
            ->where('currentFilter', 'cancelled')
            ->has('stats.total_cancelled')
            ->has('appointments.data', 1)
            ->where('appointments.data.0.status', 'cancelled')
            ->where('appointments.data.0.cancellation_reason', 'Schedule conflict with university exam')
        );
    }

    public function test_admin_deleting_teacher_triggers_google_oauth_revocation(): void
    {
        Http::fake([
            'https://oauth2.googleapis.com/revoke' => Http::response(['status' => 'ok'], 200),
        ]);

        $admin = User::factory()->create(['role' => 'admin']);
        $teacher = User::factory()->create([
            'role' => 'teacher',
            'google_connected' => true,
            'google_refresh_token' => 'mock-google-refresh-token-12345',
            'google_access_token' => 'mock-google-access-token-12345',
        ]);

        $response = $this->actingAs($admin)
            ->delete("/admin/users/{$teacher->id}");

        $response->assertRedirect();
        $this->assertDatabaseMissing('users', ['id' => $teacher->id]);

        Http::assertSent(function ($request) {
            return $request->url() === 'https://oauth2.googleapis.com/revoke'
                && $request['token'] === 'mock-google-refresh-token-12345';
        });
    }
}

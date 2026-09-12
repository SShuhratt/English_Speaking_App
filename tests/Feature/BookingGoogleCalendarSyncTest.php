<?php

namespace Tests\Feature;

use App\Jobs\SyncAppointmentToGoogleJob;
use App\Models\Appointment;
use App\Models\User;
use App\Services\BookingService;
use App\Services\GoogleCalendarService;
use Carbon\Carbon;
use Exception;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Mockery;
use Tests\TestCase;

class BookingGoogleCalendarSyncTest extends TestCase
{
    use RefreshDatabase;

    protected User $teacher;

    protected User $pupil;

    protected function setUp(): void
    {
        parent::setUp();

        $this->teacher = User::factory()->create([
            'role' => 'teacher',
            'google_connected' => true,
            'google_access_token' => 'access-token-123',
            'google_refresh_token' => 'refresh-token-456',
            'google_token_expires_at' => now()->addHour(),
        ]);

        $this->pupil = User::factory()->create(['role' => 'pupil']);
    }

    public function test_sync_job_does_not_create_event_if_appointment_is_cancelled(): void
    {
        $appointment = Appointment::create([
            'teacher_id' => $this->teacher->id,
            'pupil_id' => $this->pupil->id,
            'start_at' => Carbon::tomorrow()->setHour(10),
            'end_at' => Carbon::tomorrow()->setHour(11),
            'status' => 'cancelled',
            'topics' => ['freestyle'],
        ]);

        $mockCalendar = $this->mock(GoogleCalendarService::class);
        $mockCalendar->shouldNotReceive('createEvent');

        $job = new SyncAppointmentToGoogleJob($appointment->id);
        $job->handle($mockCalendar);

        $fresh = $appointment->fresh();
        $this->assertNull($fresh->google_event_id);
    }

    public function test_sync_job_is_idempotent_and_does_not_create_duplicate_event(): void
    {
        $appointment = Appointment::create([
            'teacher_id' => $this->teacher->id,
            'pupil_id' => $this->pupil->id,
            'start_at' => Carbon::tomorrow()->setHour(10),
            'end_at' => Carbon::tomorrow()->setHour(11),
            'status' => 'confirmed',
            'google_event_id' => 'existing-google-event-123',
            'topics' => ['freestyle'],
        ]);

        $mockCalendar = $this->mock(GoogleCalendarService::class);
        $mockCalendar->shouldNotReceive('createEvent');

        $job = new SyncAppointmentToGoogleJob($appointment->id);
        $job->handle($mockCalendar);

        $fresh = $appointment->fresh();
        $this->assertEquals('existing-google-event-123', $fresh->google_event_id);
    }

    public function test_pupil_cancellation_deletes_google_calendar_event_and_nulls_event_id(): void
    {
        $appointment = Appointment::create([
            'teacher_id' => $this->teacher->id,
            'pupil_id' => $this->pupil->id,
            'start_at' => Carbon::tomorrow()->setHour(10),
            'end_at' => Carbon::tomorrow()->setHour(11),
            'status' => 'accepted',
            'google_event_id' => 'cal-event-999',
            'google_meet_link' => 'https://meet.google.com/abc-defg-hij',
            'topics' => ['freestyle'],
        ]);

        $mockCalendar = $this->mock(GoogleCalendarService::class);
        $mockCalendar->shouldReceive('deleteEvent')
            ->once()
            ->with(
                Mockery::on(fn ($t) => $t->id === $this->teacher->id),
                'cal-event-999'
            );

        $response = $this->actingAs($this->pupil)->delete("/bookings/{$appointment->id}", [
            'reason' => 'Pupil cancelled ahead of time.',
        ]);

        $response->assertStatus(200);

        $fresh = $appointment->fresh();
        $this->assertEquals('cancelled', $fresh->status);
        $this->assertNull($fresh->google_event_id);
        $this->assertNull($fresh->google_meet_link);
    }

    public function test_admin_confirm_payment_refuses_to_confirm_already_cancelled_appointment(): void
    {
        $appointment = Appointment::create([
            'teacher_id' => $this->teacher->id,
            'pupil_id' => $this->pupil->id,
            'start_at' => Carbon::tomorrow()->setHour(10),
            'end_at' => Carbon::tomorrow()->setHour(11),
            'status' => 'cancelled',
            'topics' => ['freestyle'],
        ]);

        $this->expectException(Exception::class);
        $this->expectExceptionMessage('Cannot confirm payment for an appointment that is already cancelled.');

        app(BookingService::class)->adminConfirmPayment($appointment->id);
    }

    public function test_admin_reject_payment_deletes_google_calendar_event(): void
    {
        $appointment = Appointment::create([
            'teacher_id' => $this->teacher->id,
            'pupil_id' => $this->pupil->id,
            'start_at' => Carbon::tomorrow()->setHour(10),
            'end_at' => Carbon::tomorrow()->setHour(11),
            'status' => 'accepted',
            'google_event_id' => 'cal-event-reject-123',
            'google_meet_link' => 'https://meet.google.com/rej-test-xyz',
            'topics' => ['freestyle'],
        ]);

        $mockCalendar = $this->mock(GoogleCalendarService::class);
        $mockCalendar->shouldReceive('deleteEvent')
            ->once()
            ->with(
                Mockery::on(fn ($t) => $t->id === $this->teacher->id),
                'cal-event-reject-123'
            );

        $updated = app(BookingService::class)->adminRejectPayment($appointment->id, 'Invalid payment receipt.');

        $this->assertEquals('rejected', $updated->status);
        $this->assertNull($updated->google_event_id);
        $this->assertNull($updated->google_meet_link);
    }

    public function test_google_calendar_service_delete_event_handles_410_and_404_gracefully(): void
    {
        Http::fake([
            'https://www.googleapis.com/calendar/v3/calendars/primary/events/already-deleted' => Http::response([
                'error' => ['code' => 410, 'message' => 'Resource has been deleted'],
            ], 410),
            'https://www.googleapis.com/calendar/v3/calendars/primary/events/not-found' => Http::response([
                'error' => ['code' => 404, 'message' => 'Not Found'],
            ], 404),
            'https://www.googleapis.com/calendar/v3/calendars/primary/events/success-delete' => Http::response(null, 204),
        ]);

        $service = app(GoogleCalendarService::class);

        // All of these should complete with zero thrown exceptions
        $service->deleteEvent($this->teacher, 'already-deleted');
        $service->deleteEvent($this->teacher, 'not-found');
        $service->deleteEvent($this->teacher, 'success-delete');

        $this->assertTrue(true);
    }
}

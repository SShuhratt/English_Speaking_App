<?php

namespace Tests\Feature;

use App\Events\BookingUpdated;
use App\Models\Appointment;
use App\Models\User;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

class PupilJoinMeetingTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_cannot_join_meeting()
    {
        $pupil = User::factory()->create(['role' => 'pupil']);
        $teacher = User::factory()->create(['role' => 'teacher']);
        $appointment = Appointment::create([
            'pupil_id' => $pupil->id,
            'teacher_id' => $teacher->id,
            'start_at' => now(),
            'end_at' => now()->addMinutes(30),
            'status' => 'confirmed',
        ]);

        $response = $this->postJson(route('pupil.appointments.join', $appointment->id));

        $response->assertUnauthorized();
    }

    public function test_unauthorized_user_cannot_join_meeting()
    {
        $pupil = User::factory()->create(['role' => 'pupil']);
        $otherPupil = User::factory()->create(['role' => 'pupil']);
        $teacher = User::factory()->create(['role' => 'teacher']);

        $appointment = Appointment::create([
            'pupil_id' => $pupil->id,
            'teacher_id' => $teacher->id,
            'start_at' => now(),
            'end_at' => now()->addMinutes(30),
            'status' => 'confirmed',
        ]);

        $response = $this->actingAs($otherPupil)
            ->postJson(route('pupil.appointments.join', $appointment->id));

        $response->assertForbidden();
    }

    public function test_pupil_gets_not_ready_if_teacher_hasnt_started_meeting()
    {
        $pupil = User::factory()->create(['role' => 'pupil']);
        $teacher = User::factory()->create(['role' => 'teacher']);

        $appointment = Appointment::create([
            'pupil_id' => $pupil->id,
            'teacher_id' => $teacher->id,
            'start_at' => now(),
            'end_at' => now()->addMinutes(30),
            'status' => 'confirmed',
            'google_meet_link' => null,
            'meeting_started' => false,
        ]);

        $response = $this->actingAs($pupil)
            ->postJson(route('pupil.appointments.join', $appointment->id));

        $response->assertStatus(400);
        $response->assertJson([
            'message' => "Teacher hasn't started the meeting yet!",
        ]);
    }

    public function test_pupil_can_join_meeting_if_teacher_has_started_meeting()
    {
        $pupil = User::factory()->create(['role' => 'pupil']);
        $teacher = User::factory()->create(['role' => 'teacher']);

        $appointment = Appointment::create([
            'pupil_id' => $pupil->id,
            'teacher_id' => $teacher->id,
            'start_at' => now(),
            'end_at' => now()->addMinutes(30),
            'status' => 'confirmed',
            'google_meet_link' => 'https://meet.google.com/abc-defg-hij',
            'meeting_started' => true,
        ]);

        $response = $this->actingAs($pupil)
            ->postJson(route('pupil.appointments.join', $appointment->id));

        $response->assertOk();
        $response->assertJson([
            'google_meet_link' => 'https://meet.google.com/abc-defg-hij',
        ]);
    }

    public function test_booking_updated_event_broadcasts_on_private_channels_for_pupil_and_teacher()
    {
        $pupil = User::factory()->create(['role' => 'pupil']);
        $teacher = User::factory()->create(['role' => 'teacher']);

        $appointment = Appointment::create([
            'pupil_id' => $pupil->id,
            'teacher_id' => $teacher->id,
            'start_at' => now(),
            'end_at' => now()->addMinutes(30),
            'status' => 'confirmed',
            'meeting_started' => true,
        ]);

        $event = new BookingUpdated($appointment);
        $channels = $event->broadcastOn();

        $hasPupilPrivate = false;
        $hasTeacherPrivate = false;

        foreach ($channels as $channel) {
            if ($channel instanceof PrivateChannel && $channel->name === 'private-pupil.'.$pupil->id) {
                $hasPupilPrivate = true;
            }
            if ($channel instanceof PrivateChannel && $channel->name === 'private-teacher.'.$teacher->id) {
                $hasTeacherPrivate = true;
            }
        }

        $this->assertTrue($hasPupilPrivate, 'BookingUpdated must broadcast on private-pupil channel so Echo.private receives it.');
        $this->assertTrue($hasTeacherPrivate, 'BookingUpdated must broadcast on private-teacher channel so Echo.private receives it.');
        $this->assertEquals('booking.updated', $event->broadcastAs());
    }

    public function test_teacher_starting_session_dispatches_booking_updated_event()
    {
        Event::fake([BookingUpdated::class]);

        $pupil = User::factory()->create(['role' => 'pupil']);
        $teacher = User::factory()->create([
            'role' => 'teacher',
            'google_connected' => true,
            'google_refresh_token' => 'dummy-token',
        ]);

        $appointment = Appointment::create([
            'pupil_id' => $pupil->id,
            'teacher_id' => $teacher->id,
            'start_at' => now(),
            'end_at' => now()->addMinutes(30),
            'status' => 'confirmed',
            'google_meet_link' => 'https://meet.google.com/xyz-uvwx-rst',
            'google_event_id' => 'evt_123',
            'meeting_started' => false,
        ]);

        $response = $this->actingAs($teacher)
            ->postJson(route('teacher.appointments.start', $appointment->id));

        $response->assertOk();
        $this->assertTrue($appointment->fresh()->meeting_started);

        Event::assertDispatched(BookingUpdated::class, function ($event) use ($appointment) {
            return $event->appointment->id === $appointment->id && $event->appointment->meeting_started === true;
        });
    }
}

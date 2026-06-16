<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
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

        $response->assertRedirect(route('login'));
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
        ]);

        $response = $this->actingAs($pupil)
            ->postJson(route('pupil.appointments.join', $appointment->id));

        $response->assertStatus(400);
        $response->assertJson([
            'message' => 'Teacher is not ready yet',
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
        ]);

        $response = $this->actingAs($pupil)
            ->postJson(route('pupil.appointments.join', $appointment->id));

        $response->assertOk();
        $response->assertJson([
            'google_meet_link' => 'https://meet.google.com/abc-defg-hij',
        ]);
    }
}

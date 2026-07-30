<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\Conversation;
use App\Models\User;
use App\Services\StreakService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StreakTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_has_zero_streak()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $this->assertEquals(0, StreakService::calculateForUser($admin));
    }

    public function test_pupil_and_teacher_have_zero_streak_when_no_sessions()
    {
        $pupil = User::factory()->create(['role' => 'pupil']);
        $teacher = User::factory()->create(['role' => 'teacher']);

        $this->assertEquals(0, StreakService::calculateForUser($pupil));
        $this->assertEquals(0, StreakService::calculateForUser($teacher));
    }

    public function test_pupil_streak_with_teacher_appointment()
    {
        $pupil = User::factory()->create(['role' => 'pupil']);
        $teacher = User::factory()->create(['role' => 'teacher']);

        // Today's appointment with meeting_started = true
        Appointment::create([
            'teacher_id' => $teacher->id,
            'pupil_id' => $pupil->id,
            'start_at' => Carbon::now(),
            'end_at' => Carbon::now()->addHour(),
            'status' => 'accepted',
            'meeting_started' => true,
        ]);

        $this->assertEquals(1, StreakService::calculateForUser($pupil));
        $this->assertEquals(1, StreakService::calculateForUser($teacher));
    }

    public function test_pupil_streak_with_confirmed_or_completed_appointment()
    {
        $pupil = User::factory()->create(['role' => 'pupil']);
        $teacher = User::factory()->create(['role' => 'teacher']);

        Appointment::create([
            'teacher_id' => $teacher->id,
            'pupil_id' => $pupil->id,
            'start_at' => Carbon::now(),
            'end_at' => Carbon::now()->addHour(),
            'status' => 'confirmed',
            'meeting_started' => false,
        ]);

        $this->assertEquals(1, StreakService::calculateForUser($pupil));
    }

    public function test_pupil_streak_with_peer_speaking_conversation()
    {
        $pupil1 = User::factory()->create(['role' => 'pupil']);
        $pupil2 = User::factory()->create(['role' => 'pupil']);

        Conversation::create([
            'pupil_id' => $pupil1->id,
            'teacher_id' => $pupil2->id,
            'started_at' => Carbon::now(),
        ]);

        $this->assertEquals(1, StreakService::calculateForUser($pupil1));
        $this->assertEquals(1, StreakService::calculateForUser($pupil2));
    }

    public function test_consecutive_days_streak_calculation()
    {
        $pupil = User::factory()->create(['role' => 'pupil']);
        $teacher = User::factory()->create(['role' => 'teacher']);

        // Activity today, yesterday, and 2 days ago
        foreach ([0, 1, 2] as $daysAgo) {
            Appointment::create([
                'teacher_id' => $teacher->id,
                'pupil_id' => $pupil->id,
                'start_at' => Carbon::now()->subDays($daysAgo),
                'end_at' => Carbon::now()->subDays($daysAgo)->addHour(),
                'status' => 'confirmed',
            ]);
        }

        $this->assertEquals(3, StreakService::calculateForUser($pupil));
    }

    public function test_streak_preserved_from_yesterday_when_no_activity_today_yet()
    {
        $pupil = User::factory()->create(['role' => 'pupil']);
        $teacher = User::factory()->create(['role' => 'teacher']);

        // Activity yesterday and 2 days ago, but NONE today yet
        foreach ([1, 2] as $daysAgo) {
            Appointment::create([
                'teacher_id' => $teacher->id,
                'pupil_id' => $pupil->id,
                'start_at' => Carbon::now()->subDays($daysAgo),
                'end_at' => Carbon::now()->subDays($daysAgo)->addHour(),
                'status' => 'confirmed',
            ]);
        }

        // Streak is 2 (yesterday + day before yesterday)
        $this->assertEquals(2, StreakService::calculateForUser($pupil));
    }

    public function test_streak_resets_to_zero_after_two_days_inactivity()
    {
        $pupil = User::factory()->create(['role' => 'pupil']);
        $teacher = User::factory()->create(['role' => 'teacher']);

        // Activity 2 days ago (missed yesterday and today)
        Appointment::create([
            'teacher_id' => $teacher->id,
            'pupil_id' => $pupil->id,
            'start_at' => Carbon::now()->subDays(2),
            'end_at' => Carbon::now()->subDays(2)->addHour(),
            'status' => 'confirmed',
        ]);

        $this->assertEquals(0, StreakService::calculateForUser($pupil));
    }
}

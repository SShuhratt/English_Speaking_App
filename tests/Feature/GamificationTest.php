<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\Conversation;
use App\Models\User;
use App\Services\GamificationService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class GamificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_calculates_correct_xp_and_fluency_level()
    {
        $pupil = User::factory()->create(['role' => 'pupil']);
        $teacher = User::factory()->create(['role' => 'teacher']);

        // Empty state
        $initialFluency = GamificationService::calculateFluency($pupil);
        $this->assertEquals(1, $initialFluency['level']);
        $this->assertEquals(0, $initialFluency['total_xp']);
        $this->assertEquals(0, $initialFluency['progress_percent']);

        // Create 1 appointment of 60 minutes
        Appointment::create([
            'teacher_id' => $teacher->id,
            'pupil_id' => $pupil->id,
            'start_at' => Carbon::now()->subDays(2),
            'end_at' => Carbon::now()->subDays(2)->addMinutes(60),
            'status' => 'completed',
            'duration_minutes' => 60,
        ]);

        // Expected XP: (60 * 10) + (1 * 50) = 650 XP -> Level 2 (300 to 900 XP)
        $fluency = GamificationService::calculateFluency($pupil);
        $this->assertEquals(2, $fluency['level']);
        $this->assertEquals(650, $fluency['total_xp']);
        $this->assertEquals(60, $fluency['total_minutes']);
        $this->assertEquals(1, $fluency['total_sessions']);
        $this->assertEquals(350, $fluency['current_level_xp']); // 650 - 300
        $this->assertEquals(250, $fluency['xp_to_next_level']); // 900 - 650
    }

    public function test_max_level_5_boundary_and_overflow()
    {
        // Test level 5 threshold (4500 XP)
        $res4500 = GamificationService::resolveLevelFromXp(4500, 300, 30);
        $this->assertEquals(5, $res4500['level']);
        $this->assertTrue($res4500['is_max_level']);
        $this->assertEquals(0, $res4500['xp_to_next_level']);

        // Test super high XP overflow (15,000 XP)
        $res15000 = GamificationService::resolveLevelFromXp(15000, 1200, 60);
        $this->assertEquals(5, $res15000['level']);
        $this->assertTrue($res15000['is_max_level']);
        $this->assertEquals(100, $res15000['progress_percent']);
        $this->assertEquals(0, $res15000['xp_to_next_level']);
    }

    public function test_cancelled_or_rejected_appointments_do_not_count_towards_xp()
    {
        $pupil = User::factory()->create(['role' => 'pupil']);
        $teacher = User::factory()->create(['role' => 'teacher']);

        Appointment::create([
            'teacher_id' => $teacher->id,
            'pupil_id' => $pupil->id,
            'start_at' => Carbon::now()->subDays(1),
            'end_at' => Carbon::now()->subDays(1)->addMinutes(60),
            'status' => 'cancelled',
            'duration_minutes' => 60,
        ]);

        $fluency = GamificationService::calculateFluency($pupil);
        $this->assertEquals(0, $fluency['total_xp']);
        $this->assertEquals(0, $fluency['total_minutes']);
        $this->assertEquals(0, $fluency['total_sessions']);
    }

    public function test_peer_conversations_contribute_to_minutes_and_xp()
    {
        $pupil1 = User::factory()->create(['role' => 'pupil']);
        $pupil2 = User::factory()->create(['role' => 'pupil']);

        // 30 minute conversation
        Conversation::create([
            'pupil_id' => $pupil1->id,
            'teacher_id' => $pupil2->id,
            'started_at' => Carbon::now()->subHours(2),
            'ended_at' => Carbon::now()->subHours(2)->addMinutes(30),
        ]);

        $fluency = GamificationService::calculateFluency($pupil1);
        $this->assertEquals(30, $fluency['total_minutes']);
        $this->assertEquals(1, $fluency['total_sessions']);
        // (30 * 10) + (1 * 50) = 350 XP -> Level 2
        $this->assertEquals(350, $fluency['total_xp']);
        $this->assertEquals(2, $fluency['level']);
    }

    public function test_appointment_missing_duration_minutes_calculates_from_datetimes()
    {
        $pupil = User::factory()->create(['role' => 'pupil']);
        $teacher = User::factory()->create(['role' => 'teacher']);

        // 0 duration_minutes fallback
        Appointment::create([
            'teacher_id' => $teacher->id,
            'pupil_id' => $pupil->id,
            'start_at' => Carbon::now()->subDays(1),
            'end_at' => Carbon::now()->subDays(1)->addMinutes(45),
            'status' => 'completed',
            'duration_minutes' => 0,
        ]);

        $fluency = GamificationService::calculateFluency($pupil);
        $this->assertEquals(45, $fluency['total_minutes']);
        $this->assertEquals(500, $fluency['total_xp']); // (45 * 10) + 50
    }

    public function test_empty_leaderboard_when_no_sessions_this_week()
    {
        Cache::flush();
        $pupil = User::factory()->create(['role' => 'pupil']);

        $leaderboard = GamificationService::getWeeklyLeaderboard($pupil);

        $this->assertEmpty($leaderboard['top_speakers']);
        $this->assertEquals(0, $leaderboard['total_active_speakers']);
        $this->assertNotNull($leaderboard['user_standing']);
        $this->assertEquals(1, $leaderboard['user_standing']['rank']);
        $this->assertEquals(0, $leaderboard['user_standing']['minutes_spoken']);
        $this->assertFalse($leaderboard['user_standing']['is_in_top_five']);
    }

    public function test_leaderboard_with_more_than_five_speakers_places_user_outside_top_five()
    {
        Cache::flush();
        $teacher = User::factory()->create(['role' => 'teacher']);
        $pupils = [];

        // Create 7 pupils with decreasing minutes: 70m, 60m, 50m, 40m, 30m, 20m, 10m
        for ($i = 0; $i < 7; $i++) {
            $p = User::factory()->create([
                'role' => 'pupil',
                'full_name' => "Student {$i}",
            ]);
            $pupils[] = $p;

            Appointment::create([
                'teacher_id' => $teacher->id,
                'pupil_id' => $p->id,
                'start_at' => Carbon::now()->startOfWeek()->addHours($i),
                'end_at' => Carbon::now()->startOfWeek()->addHours($i)->addMinutes(70 - ($i * 10)),
                'status' => 'completed',
                'duration_minutes' => 70 - ($i * 10),
            ]);
        }

        // Test as student 6 (10 minutes -> rank 7)
        $leaderboard = GamificationService::getWeeklyLeaderboard($pupils[6]);

        $this->assertCount(5, $leaderboard['top_speakers']);
        $this->assertEquals(7, $leaderboard['total_active_speakers']);

        // Check top speaker is student 0 with 70 mins
        $this->assertEquals('Student 0', $leaderboard['top_speakers'][0]['full_name']);
        $this->assertEquals(70, $leaderboard['top_speakers'][0]['minutes_spoken']);
        $this->assertEquals(1, $leaderboard['top_speakers'][0]['rank']);

        // Check 5th speaker is student 4 with 30 mins
        $this->assertEquals('Student 4', $leaderboard['top_speakers'][4]['full_name']);
        $this->assertEquals(30, $leaderboard['top_speakers'][4]['minutes_spoken']);
        $this->assertEquals(5, $leaderboard['top_speakers'][4]['rank']);

        // Check current student (student 6) standing outside top 5
        $this->assertNotNull($leaderboard['user_standing']);
        $this->assertEquals(7, $leaderboard['user_standing']['rank']);
        $this->assertEquals(10, $leaderboard['user_standing']['minutes_spoken']);
        $this->assertFalse($leaderboard['user_standing']['is_in_top_five']);
    }

    public function test_leaderboard_handles_ties_gracefully()
    {
        Cache::flush();
        $teacher = User::factory()->create(['role' => 'teacher']);

        $pupilA = User::factory()->create(['role' => 'pupil', 'full_name' => 'Tied Pupil A']);
        $pupilB = User::factory()->create(['role' => 'pupil', 'full_name' => 'Tied Pupil B']);

        // Both have 50 minutes
        Appointment::create([
            'teacher_id' => $teacher->id,
            'pupil_id' => $pupilA->id,
            'start_at' => Carbon::now()->startOfWeek()->addHour(),
            'end_at' => Carbon::now()->startOfWeek()->addHours(1)->addMinutes(50),
            'status' => 'completed',
            'duration_minutes' => 50,
        ]);

        Appointment::create([
            'teacher_id' => $teacher->id,
            'pupil_id' => $pupilB->id,
            'start_at' => Carbon::now()->startOfWeek()->addHours(2),
            'end_at' => Carbon::now()->startOfWeek()->addHours(2)->addMinutes(50),
            'status' => 'completed',
            'duration_minutes' => 50,
        ]);

        $leaderboard = GamificationService::getWeeklyLeaderboard($pupilA);

        $this->assertCount(2, $leaderboard['top_speakers']);
        $this->assertEquals(50, $leaderboard['top_speakers'][0]['minutes_spoken']);
        $this->assertEquals(50, $leaderboard['top_speakers'][1]['minutes_spoken']);
        $this->assertEquals(1, $leaderboard['top_speakers'][0]['rank']);
        $this->assertEquals(2, $leaderboard['top_speakers'][1]['rank']);
    }

    public function test_streak_info_returns_correct_flame_tiers()
    {
        $pupil = User::factory()->create(['role' => 'pupil']);

        // 0 days -> dormant
        $dormant = GamificationService::getStreakInfo($pupil);
        $this->assertEquals('dormant', $dormant['tier']);
        $this->assertTrue($dormant['shield_active']);
        $this->assertArrayHasKey('flame_color', $dormant);
        $this->assertArrayHasKey('milestone_target', $dormant);
    }

    public function test_daily_spark_returns_structured_prompt()
    {
        $spark = GamificationService::getDailySpark();

        $this->assertArrayHasKey('question_key', $spark);
        $this->assertArrayHasKey('default_question', $spark);
        $this->assertArrayHasKey('category_key', $spark);
        $this->assertArrayHasKey('default_category', $spark);
        $this->assertArrayHasKey('default_tip', $spark);
    }

    public function test_pupil_dashboard_contains_gamification_props()
    {
        $pupil = User::factory()->create(['role' => 'pupil']);
        $this->actingAs($pupil);

        $response = $this->get(route('dashboard'));
        $response->assertOk();

        $response->assertInertia(fn ($page) => $page
            ->component('dashboard')
            ->has('gamification')
            ->has('gamification.fluency')
            ->has('gamification.streak')
            ->has('gamification.leaderboard')
            ->has('gamification.daily_spark')
        );
    }
}

<?php

namespace Tests\Feature\Gamification;

use App\Models\Appointment;
use App\Models\Conversation;
use App\Models\PupilProfile;
use App\Models\User;
use App\Services\GamificationService;
use App\Services\TopicService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Redis;
use Tests\TestCase;

class StageOneGamificationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Redis::del('speaking_matchmaking_queue');
        Redis::del('speaking_matchmaking_queue_low');
    }

    public function test_topic_service_returns_curated_topics_and_defaults_to_free_talk(): void
    {
        $allTopics = TopicService::getAll();
        $this->assertNotEmpty($allTopics);

        $defaultTopic = TopicService::find(null);
        $this->assertEquals('free_talk', $defaultTopic['id']);

        $travelTopic = TopicService::find('ielts_travel');
        $this->assertEquals('ielts_travel', $travelTopic['id']);
        $this->assertEquals('ielts_part2', $travelTopic['category']);
    }

    public function test_matchmaking_accepts_topic_and_propagates_to_matched_users(): void
    {
        $user1 = User::factory()->create(['role' => 'pupil']);
        $user2 = User::factory()->create(['role' => 'pupil']);

        // User 1 joins with a specific IELTS topic
        $res1 = $this->actingAs($user1)->postJson(route('matchmaking.join'), [
            'topic' => 'ielts_travel',
        ]);
        $res1->assertStatus(200);
        $res1->assertJson(['status' => 'waiting']);

        // User 2 joins
        $res2 = $this->actingAs($user2)->postJson(route('matchmaking.join'));
        $res2->assertStatus(200);
        $res2->assertJson([
            'status' => 'matched',
            'partner_id' => $user1->id,
            'topic' => 'ielts_travel',
        ]);

        // Assert conversation record in DB captures topic
        $conversation = Conversation::where('pupil_id', $user2->id)
            ->where('teacher_id', $user1->id)
            ->first();

        $this->assertNotNull($conversation);
        $this->assertEquals('ielts_travel', $conversation->topic);
    }

    public function test_weekly_momentum_calculates_correct_sessions_and_progress(): void
    {
        $pupil = User::factory()->create(['role' => 'pupil']);
        PupilProfile::create([
            'user_id' => $pupil->id,
            'weekly_goal' => 3,
            'karma_score' => 95,
            'streak_shields' => 2,
        ]);

        $teacher = User::factory()->create(['role' => 'teacher']);

        // Check initial state
        $momentum = GamificationService::getWeeklyMomentum($pupil);
        $this->assertEquals(3, $momentum['weekly_target']);
        $this->assertEquals(0, $momentum['sessions_this_week']);
        $this->assertEquals(0, $momentum['progress_percent']);
        $this->assertFalse($momentum['target_met']);
        $this->assertEquals('trusted', $momentum['karma_tier']);
        $this->assertEquals(95, $momentum['karma_score']);
        $this->assertEquals(2, $momentum['streak_shields']);

        // Create 2 completed appointments this week
        Appointment::create([
            'pupil_id' => $pupil->id,
            'teacher_id' => $teacher->id,
            'start_at' => Carbon::now()->startOfWeek()->addDay(),
            'end_at' => Carbon::now()->startOfWeek()->addDay()->addMinutes(30),
            'status' => 'completed',
        ]);

        Appointment::create([
            'pupil_id' => $pupil->id,
            'teacher_id' => $teacher->id,
            'start_at' => Carbon::now()->startOfWeek()->addDays(2),
            'end_at' => Carbon::now()->startOfWeek()->addDays(2)->addMinutes(30),
            'status' => 'completed',
        ]);

        $momentum = GamificationService::getWeeklyMomentum($pupil);
        $this->assertEquals(2, $momentum['sessions_this_week']);
        $this->assertEquals(67, $momentum['progress_percent']); // 2/3 = 67%
        $this->assertFalse($momentum['target_met']);

        // Add 1 peer conversation to hit target
        Conversation::create([
            'pupil_id' => $pupil->id,
            'teacher_id' => $teacher->id,
            'started_at' => Carbon::now()->startOfWeek()->addDays(3),
            'ended_at' => Carbon::now()->startOfWeek()->addDays(3)->addMinutes(15),
            'topic' => 'ielts_travel',
        ]);

        $momentum = GamificationService::getWeeklyMomentum($pupil);
        $this->assertEquals(3, $momentum['sessions_this_week']);
        $this->assertEquals(100, $momentum['progress_percent']);
        $this->assertTrue($momentum['target_met']);
    }

    public function test_endorsement_submits_tags_and_updates_karma(): void
    {
        $user1 = User::factory()->create(['role' => 'pupil']);
        $user2 = User::factory()->create(['role' => 'pupil']);

        PupilProfile::create([
            'user_id' => $user1->id,
            'karma_score' => 90,
        ]);

        PupilProfile::create([
            'user_id' => $user2->id,
            'karma_score' => 88,
        ]);

        $response = $this->actingAs($user1)->postJson(route('matchmaking.endorse'), [
            'receiver_id' => $user2->id,
            'duration_seconds' => 120,
            'tags' => ['great_listener', 'fluent_speaker'],
        ]);

        $response->assertStatus(200);
        $response->assertJson(['status' => 'endorsed']);

        $this->assertDatabaseHas('conversation_endorsements', [
            'giver_id' => $user1->id,
            'receiver_id' => $user2->id,
        ]);

        // Both users should gain +2 karma for healthy duration (>= 60s)
        $this->assertEquals(92, $user1->fresh()->pupilProfile->karma_score);
        $this->assertEquals(90, $user2->fresh()->pupilProfile->karma_score);
    }

    public function test_low_karma_users_placed_in_low_priority_queue(): void
    {
        $lowKarmaUser = User::factory()->create(['role' => 'pupil']);
        PupilProfile::create([
            'user_id' => $lowKarmaUser->id,
            'karma_score' => 60, // Below 70
        ]);

        $highKarmaUser = User::factory()->create(['role' => 'pupil']);
        PupilProfile::create([
            'user_id' => $highKarmaUser->id,
            'karma_score' => 95,
        ]);

        // Low karma user joins queue
        $this->actingAs($lowKarmaUser)->postJson(route('matchmaking.join'));
        $this->assertEquals(0, Redis::llen('speaking_matchmaking_queue'));
        $this->assertEquals(1, Redis::llen('speaking_matchmaking_queue_low'));

        // Low karma user leaves
        $this->actingAs($lowKarmaUser)->postJson(route('matchmaking.leave'));
        $this->assertEquals(0, Redis::llen('speaking_matchmaking_queue_low'));

        // High karma user joins queue
        $this->actingAs($highKarmaUser)->postJson(route('matchmaking.join'));
        $this->assertEquals(1, Redis::llen('speaking_matchmaking_queue'));
        $this->assertEquals(0, Redis::llen('speaking_matchmaking_queue_low'));
    }
}

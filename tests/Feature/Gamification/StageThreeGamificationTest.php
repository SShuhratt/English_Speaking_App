<?php

namespace Tests\Feature\Gamification;

use App\Actions\Fortify\CreateNewUser;
use App\Models\Conversation;
use App\Models\PupilProfile;
use App\Models\ReferralRecord;
use App\Models\User;
use App\Services\GamificationService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StageThreeGamificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_new_user_can_register_with_referral_code_and_creates_referral_record(): void
    {
        $referrer = User::factory()->create([
            'role' => 'pupil',
            'referral_code' => 'AZIZ7890',
        ]);
        PupilProfile::create([
            'user_id' => $referrer->id,
            'level' => 'pre-intermediate',
            'age' => 20,
            'phone_number' => '+998901234567',
            'streak_shields' => 1,
            'last_acknowledged_level' => 1,
        ]);

        $action = new CreateNewUser;
        $newUser = $action->create([
            'name' => 'Dilshod Karimov',
            'email' => 'dilshod@example.com',
            'password' => 'SecurePass123!@#',
            'password_confirmation' => 'SecurePass123!@#',
            'role' => 'pupil',
            'age' => 22,
            'phone_number' => '+998909876543',
            'level' => 'pre-intermediate',
            'ref' => 'AZIZ7890',
        ]);

        $this->assertNotNull($newUser->id);
        $this->assertEquals($referrer->id, $newUser->referred_by_id);
        $this->assertNotEmpty($newUser->referral_code);

        $this->assertDatabaseHas('referral_records', [
            'referrer_id' => $referrer->id,
            'referred_user_id' => $newUser->id,
            'reward_granted' => false,
        ]);
    }

    public function test_referral_reward_is_awarded_on_invitees_first_healthy_session(): void
    {
        $referrer = User::factory()->create([
            'role' => 'pupil',
            'referral_code' => 'TEST1234',
        ]);
        $referrerProfile = PupilProfile::create([
            'user_id' => $referrer->id,
            'level' => 'pre-intermediate',
            'age' => 20,
            'phone_number' => '+998901111111',
            'streak_shields' => 0,
            'last_acknowledged_level' => 1,
        ]);

        $referredUser = User::factory()->create([
            'role' => 'pupil',
            'referred_by_id' => $referrer->id,
            'referral_code' => 'NEWU5678',
        ]);
        $referredProfile = PupilProfile::create([
            'user_id' => $referredUser->id,
            'level' => 'beginner',
            'age' => 21,
            'phone_number' => '+998902222222',
            'streak_shields' => 0,
            'last_acknowledged_level' => 1,
        ]);

        ReferralRecord::create([
            'referrer_id' => $referrer->id,
            'referred_user_id' => $referredUser->id,
            'reward_granted' => false,
        ]);

        $partner = User::factory()->create(['role' => 'pupil']);
        PupilProfile::create([
            'user_id' => $partner->id,
            'level' => 'pre-intermediate',
            'age' => 22,
            'phone_number' => '+998903333333',
            'streak_shields' => 0,
            'last_acknowledged_level' => 1,
        ]);

        // Complete first conversation with duration >= 60 seconds
        $conv = Conversation::create([
            'pupil_id' => $referredUser->id,
            'teacher_id' => $partner->id,
            'topic' => 'free_talk',
            'started_at' => Carbon::now()->subMinutes(5),
            'ended_at' => Carbon::now(),
        ]);

        $res = $this->actingAs($referredUser)->postJson(route('matchmaking.endorse'), [
            'receiver_id' => $partner->id,
            'conversation_id' => $conv->id,
            'duration_seconds' => 300,
            'tags' => ['fluent'],
        ]);

        $res->assertStatus(200);

        // Check referral record was marked as rewarded
        $this->assertDatabaseHas('referral_records', [
            'referrer_id' => $referrer->id,
            'referred_user_id' => $referredUser->id,
            'reward_granted' => true,
        ]);

        // Check both users received +1 Streak Shield
        $this->assertEquals(1, $referrerProfile->fresh()->streak_shields);
        $this->assertEquals(1, $referredProfile->fresh()->streak_shields);

        // Verify +100 XP is calculated in Fluency
        $referrerFluency = GamificationService::calculateFluency($referrer);
        $this->assertGreaterThanOrEqual(100, $referrerFluency['total_xp']);

        $referredFluency = GamificationService::calculateFluency($referredUser);
        $this->assertGreaterThanOrEqual(100, $referredFluency['total_xp']);

        // A second session does NOT double-grant the referral reward
        $this->actingAs($referredUser)->postJson(route('matchmaking.endorse'), [
            'receiver_id' => $partner->id,
            'duration_seconds' => 120,
            'tags' => ['inspiring'],
        ]);

        $this->assertEquals(1, $referrerProfile->fresh()->streak_shields);
        $this->assertEquals(1, $referredProfile->fresh()->streak_shields);
    }

    public function test_challenge_topic_session_awards_bonus_25_xp(): void
    {
        $user1 = User::factory()->create(['role' => 'pupil']);
        $user2 = User::factory()->create(['role' => 'pupil']);

        $res = $this->actingAs($user1)->postJson(route('matchmaking.endorse'), [
            'receiver_id' => $user2->id,
            'duration_seconds' => 120,
            'tags' => ['fluent', 'inspiring'],
            'topic' => 'ielts_technology', // Challenge topic
        ]);

        $res->assertStatus(200);
        $res->assertJson([
            'status' => 'endorsed',
            'challenge_bonus' => true,
        ]);

        $this->assertDatabaseHas('conversation_endorsements', [
            'giver_id' => $user1->id,
            'receiver_id' => $user2->id,
            'is_challenge_session' => true,
            'challenge_bonus_awarded' => true,
        ]);

        // Non-challenge topic should not award challenge bonus
        $resRegular = $this->actingAs($user1)->postJson(route('matchmaking.endorse'), [
            'receiver_id' => $user2->id,
            'duration_seconds' => 120,
            'tags' => ['fluent'],
            'topic' => 'free_talk',
        ]);

        $resRegular->assertStatus(200);
        $resRegular->assertJson([
            'challenge_bonus' => false,
        ]);
    }

    public function test_level_up_detection_and_acknowledgment_flow(): void
    {
        $user = User::factory()->create(['role' => 'pupil']);
        $profile = PupilProfile::create([
            'user_id' => $user->id,
            'level' => 'beginner',
            'age' => 20,
            'phone_number' => '+998901234567',
            'streak_shields' => 0,
            'last_acknowledged_level' => 1,
        ]);

        // Initially at level 1 with 0 XP -> no new level-up
        $this->assertNull(GamificationService::getNewLevelUp($user));

        // Create enough conversations to surpass Level 2 threshold (300 XP)
        // 6 sessions * 50 XP = 300 XP + minutes XP
        for ($i = 0; $i < 6; $i++) {
            Conversation::create([
                'pupil_id' => $user->id,
                'teacher_id' => User::factory()->create()->id,
                'topic' => 'free_talk',
                'started_at' => Carbon::now()->subMinutes(10),
                'ended_at' => Carbon::now(),
            ]);
        }

        $fluency = GamificationService::calculateFluency($user);
        $this->assertGreaterThanOrEqual(2, $fluency['level']);

        $newLevelUp = GamificationService::getNewLevelUp($user);
        $this->assertNotNull($newLevelUp);
        $this->assertEquals(1, $newLevelUp['previous_level']);
        $this->assertEquals($fluency['level'], $newLevelUp['new_level']);
        $this->assertTrue($newLevelUp['celebration_active']);

        // Acknowledge level-up via API
        $response = $this->actingAs($user)->postJson(route('gamification.acknowledge-level'), [
            'level' => $fluency['level'],
        ]);

        $response->assertStatus(200);
        $response->assertJson([
            'success' => true,
            'acknowledged' => true,
        ]);

        $this->assertEquals($fluency['level'], $profile->fresh()->last_acknowledged_level);

        // After acknowledging, getNewLevelUp returns null
        $this->assertNull(GamificationService::getNewLevelUp($user));
    }

    public function test_get_referral_stats_returns_correct_counters(): void
    {
        $user = User::factory()->create([
            'role' => 'pupil',
            'referral_code' => 'REFTEST1',
        ]);

        $referred1 = User::factory()->create(['role' => 'pupil', 'referred_by_id' => $user->id]);
        $referred2 = User::factory()->create(['role' => 'pupil', 'referred_by_id' => $user->id]);

        ReferralRecord::create([
            'referrer_id' => $user->id,
            'referred_user_id' => $referred1->id,
            'reward_granted' => true,
        ]);

        ReferralRecord::create([
            'referrer_id' => $user->id,
            'referred_user_id' => $referred2->id,
            'reward_granted' => false,
        ]);

        $stats = GamificationService::getReferralStats($user);

        $this->assertEquals('REFTEST1', $stats['referral_code']);
        $this->assertEquals(2, $stats['friends_invited']);
        $this->assertEquals(1, $stats['friends_completed']);
        $this->assertEquals(1, $stats['streak_shields_earned']);
        $this->assertEquals(100, $stats['xp_earned']);
    }
}

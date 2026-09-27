<?php

namespace Tests\Feature\Gamification;

use App\Models\Appointment;
use App\Models\Conversation;
use App\Models\ConversationEndorsement;
use App\Models\PupilProfile;
use App\Models\TeacherProfile;
use App\Models\User;
use App\Services\GamificationService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StageTwoGamificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_endorsement_with_balanced_talk_time_ratio_awards_bonus_and_stores_ratio(): void
    {
        $user1 = User::factory()->create(['role' => 'pupil']);
        $user2 = User::factory()->create(['role' => 'pupil']);

        $res = $this->actingAs($user1)->postJson(route('matchmaking.endorse'), [
            'receiver_id' => $user2->id,
            'duration_seconds' => 120,
            'tags' => ['fluent', 'great_listener'],
            'talk_time_ratio' => 52,
        ]);

        $res->assertStatus(200);
        $res->assertJson([
            'status' => 'endorsed',
            'balanced_bonus' => true,
        ]);

        $this->assertDatabaseHas('conversation_endorsements', [
            'giver_id' => $user1->id,
            'receiver_id' => $user2->id,
            'talk_time_ratio' => 52,
            'balanced_bonus_awarded' => true,
        ]);
    }

    public function test_endorsement_outside_balanced_zone_does_not_award_bonus(): void
    {
        $user1 = User::factory()->create(['role' => 'pupil']);
        $user2 = User::factory()->create(['role' => 'pupil']);

        $res = $this->actingAs($user1)->postJson(route('matchmaking.endorse'), [
            'receiver_id' => $user2->id,
            'duration_seconds' => 120,
            'tags' => ['fluent'],
            'talk_time_ratio' => 85, // Outside 40-60%
        ]);

        $res->assertStatus(200);
        $res->assertJson([
            'status' => 'endorsed',
            'balanced_bonus' => false,
        ]);

        $this->assertDatabaseHas('conversation_endorsements', [
            'giver_id' => $user1->id,
            'receiver_id' => $user2->id,
            'talk_time_ratio' => 85,
            'balanced_bonus_awarded' => false,
        ]);
    }

    public function test_speaking_passport_aggregates_partners_and_countries(): void
    {
        $user = User::factory()->create(['role' => 'pupil']);

        // Partner 1: Uzbekistan
        $p1 = User::factory()->create(['role' => 'pupil']);
        PupilProfile::create([
            'user_id' => $p1->id,
            'country_code' => 'UZ',
            'city' => 'Tashkent',
        ]);

        // Partner 2: United Kingdom
        $p2 = User::factory()->create(['role' => 'pupil']);
        PupilProfile::create([
            'user_id' => $p2->id,
            'country_code' => 'GB',
            'city' => 'London',
        ]);

        // Partner 3: Teacher from Germany
        $t1 = User::factory()->create(['role' => 'teacher']);
        TeacherProfile::create([
            'user_id' => $t1->id,
            'country_code' => 'DE',
            'city' => 'Berlin',
        ]);

        // Conversation with p1 and p2
        Conversation::create([
            'pupil_id' => $user->id,
            'teacher_id' => $p1->id,
            'status' => 'completed',
        ]);
        Conversation::create([
            'pupil_id' => $user->id,
            'teacher_id' => $p2->id,
            'status' => 'completed',
        ]);

        // Appointment with t1
        Appointment::create([
            'pupil_id' => $user->id,
            'teacher_id' => $t1->id,
            'status' => 'confirmed',
            'start_at' => Carbon::now()->subHour(),
            'end_at' => Carbon::now(),
        ]);

        $passport = GamificationService::getSpeakingPassport($user);

        $this->assertEquals(3, $passport['unique_partners_count']);
        $this->assertEquals(3, $passport['countries_count']);
        $this->assertCount(3, $passport['stamps']);

        $countryCodes = array_column($passport['stamps'], 'country_code');
        $this->assertContains('UZ', $countryCodes);
        $this->assertContains('GB', $countryCodes);
        $this->assertContains('DE', $countryCodes);

        // Continental Connector rank (>= 3 countries)
        $this->assertEquals('gamification.passport_rank_3', $passport['passport_rank_key']);
    }

    public function test_milestone_badges_evaluates_unlocked_and_progress_accurately(): void
    {
        $user = User::factory()->create(['role' => 'pupil']);
        PupilProfile::create([
            'user_id' => $user->id,
            'karma_score' => 98,
        ]);

        $partner = User::factory()->create(['role' => 'pupil']);

        // 1 completed conversation
        $conversation = Conversation::create([
            'pupil_id' => $user->id,
            'teacher_id' => $partner->id,
            'status' => 'completed',
        ]);

        // 1 balanced dialogue endorsement
        ConversationEndorsement::create([
            'conversation_id' => $conversation->id,
            'giver_id' => $partner->id,
            'receiver_id' => $user->id,
            'tags' => ['fluent'],
            'talk_time_ratio' => 50,
            'balanced_bonus_awarded' => true,
        ]);

        $badges = GamificationService::getMilestoneBadges($user);
        $this->assertCount(6, $badges);

        $badgeMap = [];
        foreach ($badges as $b) {
            $badgeMap[$b['id']] = $b;
        }

        // First spark unlocked (1+ completed session)
        $this->assertTrue($badgeMap['first_spark']['unlocked']);
        $this->assertEquals(100, $badgeMap['first_spark']['progress_percent']);

        // Balanced voice unlocked (1+ balanced dialogue)
        $this->assertTrue($badgeMap['balanced_voice']['unlocked']);
        $this->assertEquals(100, $badgeMap['balanced_voice']['progress_percent']);

        // Century club locked (< 100 minutes)
        $this->assertFalse($badgeMap['century_club']['unlocked']);
    }

    public function test_profile_settings_update_saves_country_code_and_city_for_pupil_and_teacher(): void
    {
        // 1. Pupil update
        $pupil = User::factory()->create(['role' => 'pupil']);
        PupilProfile::create([
            'user_id' => $pupil->id,
        ]);

        $resPupil = $this->actingAs($pupil)->patch(route('profile.update'), [
            'name' => 'Alice Pupil',
            'email' => $pupil->email,
            'country_code' => 'GB',
            'city' => 'Manchester',
            'headline' => 'Passionate Learner',
        ]);

        $resPupil->assertSessionHasNoErrors();
        $this->assertDatabaseHas('pupil_profiles', [
            'user_id' => $pupil->id,
            'country_code' => 'GB',
            'city' => 'Manchester',
        ]);

        // 2. Teacher update
        $teacher = User::factory()->create(['role' => 'teacher']);
        TeacherProfile::create([
            'user_id' => $teacher->id,
        ]);

        $resTeacher = $this->actingAs($teacher)->patch(route('profile.update'), [
            'name' => 'John Teacher',
            'email' => $teacher->email,
            'country_code' => 'US',
            'city' => 'Chicago',
            'headline' => 'Experienced Coach',
        ]);

        $resTeacher->assertSessionHasNoErrors();
        $this->assertDatabaseHas('teacher_profiles', [
            'user_id' => $teacher->id,
            'country_code' => 'US',
            'city' => 'Chicago',
        ]);
    }
}

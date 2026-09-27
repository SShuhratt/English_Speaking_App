<?php

namespace Tests\Feature\Gamification;

use App\Models\Appointment;
use App\Models\PupilProfile;
use App\Models\TeacherProfile;
use App\Models\User;
use App\Models\UserDiscountVoucher;
use App\Services\GamificationService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StageFourGamificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_teacher_can_submit_post_lesson_rubric_assessment_with_band_calculation(): void
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        TeacherProfile::create(['user_id' => $teacher->id, 'is_verified' => true]);

        $pupil = User::factory()->create(['role' => 'pupil']);
        PupilProfile::create(['user_id' => $pupil->id]);

        $appointment = Appointment::create([
            'teacher_id' => $teacher->id,
            'pupil_id' => $pupil->id,
            'start_at' => Carbon::now()->subHours(2),
            'end_at' => Carbon::now()->subHour(),
            'status' => 'completed',
            'topics' => ['Travel', 'Culture'],
            'price' => 100000,
        ]);

        $response = $this->actingAs($teacher)->postJson("/teacher/appointments/{$appointment->id}/assess", [
            'fluency_score' => 7.0,
            'lexical_score' => 6.5,
            'grammar_score' => 7.0,
            'pronunciation_score' => 6.5,
            'teacher_notes' => 'Fluent and clear speaker with minor preposition issues.',
        ]);

        $response->assertOk()
            ->assertJsonPath('assessment.teacher_notes', 'Fluent and clear speaker with minor preposition issues.');

        $this->assertEquals(7.0, (float) $response->json('assessment.overall_score'));

        $this->assertDatabaseHas('appointment_assessments', [
            'appointment_id' => $appointment->id,
            'teacher_id' => $teacher->id,
            'pupil_id' => $pupil->id,
            'overall_score' => 7.0,
        ]);
    }

    public function test_unauthorized_user_cannot_submit_teacher_assessment(): void
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        $otherUser = User::factory()->create(['role' => 'pupil']);

        $pupil = User::factory()->create(['role' => 'pupil']);

        $appointment = Appointment::create([
            'teacher_id' => $teacher->id,
            'pupil_id' => $pupil->id,
            'start_at' => Carbon::now()->subHours(2),
            'end_at' => Carbon::now()->subHour(),
            'status' => 'completed',
            'topics' => ['Travel'],
            'price' => 50000,
        ]);

        // Attempting to submit as another user (pupil)
        $response = $this->actingAs($otherUser)->postJson("/teacher/appointments/{$appointment->id}/assess", [
            'fluency_score' => 8.0,
            'lexical_score' => 8.0,
            'grammar_score' => 8.0,
            'pronunciation_score' => 8.0,
        ]);

        $response->assertForbidden();
    }

    public function test_pupil_can_view_xp_store_catalog(): void
    {
        $pupil = User::factory()->create(['role' => 'pupil']);
        PupilProfile::create([
            'user_id' => $pupil->id,
            'spent_xp' => 100,
        ]);

        // Create completed appointment worth XP (60 minutes = 120 XP)
        Appointment::create([
            'teacher_id' => User::factory()->create(['role' => 'teacher'])->id,
            'pupil_id' => $pupil->id,
            'start_at' => Carbon::now()->subHours(2),
            'end_at' => Carbon::now()->subHour(),
            'duration_minutes' => 60,
            'status' => 'completed',
            'topics' => ['Travel'],
        ]);

        $response = $this->actingAs($pupil)->getJson('/gamification/store/catalog');

        $response->assertOk()
            ->assertJsonStructure([
                'available_xp',
                'total_xp',
                'spent_xp',
                'items',
                'active_vouchers',
            ]);
    }

    public function test_pupil_can_redeem_streak_shield_with_xp(): void
    {
        $pupil = User::factory()->create(['role' => 'pupil']);
        $profile = PupilProfile::create([
            'user_id' => $pupil->id,
            'streak_shields' => 0,
            'spent_xp' => 0,
        ]);

        // Generate 600 XP (each minute is 2 XP => 300 minutes = 600 XP)
        Appointment::create([
            'teacher_id' => User::factory()->create(['role' => 'teacher'])->id,
            'pupil_id' => $pupil->id,
            'start_at' => Carbon::now()->subHours(6),
            'end_at' => Carbon::now()->subHour(),
            'duration_minutes' => 300,
            'status' => 'completed',
            'topics' => ['Travel'],
        ]);

        $response = $this->actingAs($pupil)->postJson('/gamification/store/redeem', [
            'item_key' => 'streak_shield',
        ]);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('type', 'shield')
            ->assertJsonPath('streak_shields', 1);

        $this->assertEquals(500, $profile->fresh()->spent_xp);
        $this->assertEquals(1, $profile->fresh()->streak_shields);

        $fluency = GamificationService::calculateFluency($pupil);
        $this->assertEquals(3050, $fluency['total_xp']);
        $this->assertEquals(500, $fluency['spent_xp']);
        $this->assertEquals(2550, $fluency['available_xp']);
    }

    public function test_pupil_can_redeem_discount_voucher_with_xp(): void
    {
        $pupil = User::factory()->create(['role' => 'pupil']);
        $profile = PupilProfile::create([
            'user_id' => $pupil->id,
            'spent_xp' => 0,
        ]);

        // Generate 1200 XP (600 minutes = 1200 XP)
        Appointment::create([
            'teacher_id' => User::factory()->create(['role' => 'teacher'])->id,
            'pupil_id' => $pupil->id,
            'start_at' => Carbon::now()->subHours(11),
            'end_at' => Carbon::now()->subHour(),
            'duration_minutes' => 600,
            'status' => 'completed',
            'topics' => ['Travel'],
        ]);

        $response = $this->actingAs($pupil)->postJson('/gamification/store/redeem', [
            'item_key' => 'voucher_10',
        ]);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('type', 'voucher');

        $this->assertDatabaseHas('user_discount_vouchers', [
            'user_id' => $pupil->id,
            'discount_percent' => 10,
            'xp_spent' => 1000,
            'is_redeemed' => false,
        ]);

        $this->assertEquals(1000, $profile->fresh()->spent_xp);
    }

    public function test_pupil_cannot_redeem_with_insufficient_xp(): void
    {
        $pupil = User::factory()->create(['role' => 'pupil']);
        PupilProfile::create([
            'user_id' => $pupil->id,
            'spent_xp' => 0,
        ]);

        // No speaking XP
        $response = $this->actingAs($pupil)->postJson('/gamification/store/redeem', [
            'item_key' => 'voucher_25',
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('success', false)
            ->assertJsonPath('message', 'Insufficient XP balance.');
    }

    public function test_pupil_can_apply_voucher_to_appointment(): void
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        $pupil = User::factory()->create(['role' => 'pupil']);

        $voucher = UserDiscountVoucher::create([
            'user_id' => $pupil->id,
            'voucher_code' => 'CONVO-25-TEST',
            'discount_percent' => 25,
            'xp_spent' => 2500,
            'is_redeemed' => false,
        ]);

        $appointment = Appointment::create([
            'teacher_id' => $teacher->id,
            'pupil_id' => $pupil->id,
            'start_at' => Carbon::now()->addDay(),
            'end_at' => Carbon::now()->addDay()->addHour(),
            'status' => 'pending',
            'topics' => ['Career'],
            'price' => 100000,
        ]);

        $response = $this->actingAs($pupil)->postJson("/appointments/{$appointment->id}/apply-voucher", [
            'voucher_id' => $voucher->id,
        ]);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('discount_amount', 25000)
            ->assertJsonPath('new_price', 75000);

        $this->assertTrue($voucher->fresh()->is_redeemed);
        $this->assertEquals($voucher->id, $appointment->fresh()->discount_voucher_id);
        $this->assertEquals(25000, $appointment->fresh()->discount_amount);
    }

    public function test_public_verified_fluency_credential_can_be_viewed(): void
    {
        $pupil = User::factory()->create([
            'name' => 'Alisher Navoiy',
            'role' => 'pupil',
        ]);
        PupilProfile::create([
            'user_id' => $pupil->id,
            'city' => 'Tashkent',
        ]);

        $response = $this->get("/credential/{$pupil->id}");

        $response->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('credential')
                ->has('credential.user')
                ->has('credential.fluency')
                ->has('credential.passport')
                ->where('credential.user.name', 'Alisher Navoiy')
            );
    }

    public function test_invalid_credential_id_returns_404(): void
    {
        $response = $this->get('/credential/00000000-0000-0000-0000-000000000000');

        $response->assertNotFound();
    }
}

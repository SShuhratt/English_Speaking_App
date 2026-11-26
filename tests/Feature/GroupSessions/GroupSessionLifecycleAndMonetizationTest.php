<?php

namespace Tests\Feature\GroupSessions;

use App\Models\Feedback;
use App\Models\GroupSession;
use App\Models\GroupSessionEnrollment;
use App\Models\PartnerAttribution;
use App\Models\PartnerCommissionEntry;
use App\Models\PartnerOrganization;
use App\Models\TeacherProfile;
use App\Models\User;
use App\Notifications\GroupSessionNotification;
use App\Services\GamificationService;
use App\Services\StreakService;
use Illuminate\Foundation\Http\Middleware\PreventRequestForgery;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class GroupSessionLifecycleAndMonetizationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutMiddleware(PreventRequestForgery::class);
    }

    public function test_teacher_start_meeting_marks_in_progress_and_notifies_enrolled_pupils(): void
    {
        Notification::fake();

        $teacher = User::factory()->teacher()->create(['google_connected' => false]);
        $pupil = User::factory()->pupil()->create();

        TeacherProfile::create([
            'user_id' => $teacher->id,
            'price' => 80000,
            'is_verified' => true,
        ]);

        $session = GroupSession::create([
            'teacher_id' => $teacher->id,
            'title' => 'Morning Warmup',
            'start_at' => now()->addMinutes(2),
            'end_at' => now()->addMinutes(62),
            'duration_minutes' => 60,
            'max_seats' => 5,
            'price_per_seat' => 40000,
            'status' => 'scheduled',
        ]);

        GroupSessionEnrollment::create([
            'group_session_id' => $session->id,
            'pupil_id' => $pupil->id,
            'status' => 'enrolled',
            'payment_status' => 'paid',
            'price_paid' => 40000,
        ]);

        $this->actingAs($teacher)->postJson("/teacher/group-sessions/{$session->id}/start")
            ->assertOk()
            ->assertJsonPath('session.status', 'in_progress')
            ->assertJsonPath('session.meeting_started', true);

        Notification::assertSentTo($pupil, GroupSessionNotification::class, function (GroupSessionNotification $n) {
            return $n->eventType === 'started';
        });
    }

    public function test_unstarted_session_auto_cancels_after_15_minutes_and_spares_recent_or_started_sessions(): void
    {
        Notification::fake();

        $teacher = User::factory()->teacher()->create();
        $pupil = User::factory()->pupil()->create();

        TeacherProfile::create([
            'user_id' => $teacher->id,
            'price' => 80000,
            'is_verified' => true,
        ]);

        // 16 mins past start, not started -> SHOULD auto-cancel
        $noShowSession = GroupSession::create([
            'teacher_id' => $teacher->id,
            'title' => 'Missed Session',
            'start_at' => now()->subMinutes(16),
            'end_at' => now()->addMinutes(44),
            'duration_minutes' => 60,
            'max_seats' => 5,
            'price_per_seat' => 50000,
            'status' => 'scheduled',
            'meeting_started' => false,
        ]);

        $paidSeat = GroupSessionEnrollment::create([
            'group_session_id' => $noShowSession->id,
            'pupil_id' => $pupil->id,
            'status' => 'enrolled',
            'payment_status' => 'paid',
            'price_paid' => 50000,
        ]);

        // 10 mins past start, not started -> SHOULD still wait
        $withinGraceSession = GroupSession::create([
            'teacher_id' => $teacher->id,
            'title' => 'Within Grace Period',
            'start_at' => now()->subMinutes(10),
            'end_at' => now()->addMinutes(50),
            'duration_minutes' => 60,
            'max_seats' => 5,
            'price_per_seat' => 50000,
            'status' => 'scheduled',
            'meeting_started' => false,
        ]);

        // 20 mins past start, already started -> SHOULD stay in_progress
        $startedSession = GroupSession::create([
            'teacher_id' => $teacher->id,
            'title' => 'Running Session',
            'start_at' => now()->subMinutes(20),
            'end_at' => now()->addMinutes(40),
            'duration_minutes' => 60,
            'max_seats' => 5,
            'price_per_seat' => 50000,
            'status' => 'in_progress',
            'meeting_started' => true,
        ]);

        $this->artisan('group-sessions:auto-cancel-unstarted')->assertExitCode(0);

        $this->assertSame('cancelled', $noShowSession->fresh()->status);
        $this->assertSame('system', $noShowSession->fresh()->cancelled_by);
        $this->assertSame('cancelled', $paidSeat->fresh()->status);
        $this->assertSame('refunded', $paidSeat->fresh()->payment_status);

        Notification::assertSentTo($pupil, GroupSessionNotification::class, function (GroupSessionNotification $n) {
            return $n->eventType === 'cancelled';
        });

        $this->assertSame('scheduled', $withinGraceSession->fresh()->status);
        $this->assertSame('in_progress', $startedSession->fresh()->status);
    }

    public function test_completed_group_session_accrues_net_cash_commission_xp_streak_stats_and_feedback(): void
    {
        $partner = PartnerOrganization::create([
            'name' => 'Registon Center',
            'legal_name' => 'Registon MChJ',
            'legal_type' => 'mchj',
            'inn_stir' => '301234568',
            'bank_account' => '20208000100000000002',
            'bank_mfo' => '00424',
            'bank_name' => 'Kapitalbank',
            'partner_code' => 'GROUP5',
            'commission_rate_bps' => 500,
            'status' => 'active',
        ]);

        $teacher = User::factory()->teacher()->create();
        TeacherProfile::create([
            'user_id' => $teacher->id,
            'price' => 100000,
            'is_verified' => true,
            'supports_group_sessions' => true,
        ]);

        $attributedPupil = User::factory()->pupil()->create();
        $unenrolledPupil = User::factory()->pupil()->create();

        PartnerAttribution::create([
            'partner_organization_id' => $partner->id,
            'pupil_id' => $attributedPupil->id,
            'attribution_source' => 'referral_link',
            'partner_code_used' => $partner->partner_code,
            'attributed_at' => now()->subDays(1),
        ]);

        $session = GroupSession::create([
            'teacher_id' => $teacher->id,
            'title' => 'Completed Business Club',
            'start_at' => now()->subHours(2),
            'end_at' => now()->subHour(),
            'duration_minutes' => 60,
            'max_seats' => 5,
            'price_per_seat' => 100000,
            'status' => 'in_progress',
            'meeting_started' => true,
            'started_at' => now()->subHours(2),
        ]);

        $enrollment = GroupSessionEnrollment::create([
            'group_session_id' => $session->id,
            'pupil_id' => $attributedPupil->id,
            'status' => 'enrolled',
            'payment_status' => 'paid',
            'price_paid' => 100000,
            'gross_amount' => 100000,
            'gateway_provider' => 'humo_p2p',
            'gateway_fee_bps' => 200,
            'gateway_fee_amount' => 2000,
            'net_cash_amount' => 98000,
        ]);

        // Run completion scheduler command
        $this->artisan('group-sessions:complete-past')->assertExitCode(0);

        $this->assertSame('completed', $session->fresh()->status);
        $this->assertSame('completed', $enrollment->fresh()->status);

        // 1) Commission accrued on Net Cash (98,000 UZS -> 5% partner = 4,900, 80% teacher = 78,400)
        $entry = PartnerCommissionEntry::where('group_session_enrollment_id', $enrollment->id)->first();
        $this->assertNotNull($entry);
        $this->assertNull($entry->appointment_id);
        $this->assertSame('group_session', $entry->entry_source);
        $this->assertSame(100000, $entry->gross_lesson_value);
        $this->assertSame(2000, $entry->gateway_fee_amount);
        $this->assertSame(98000, $entry->net_cash_basis);
        $this->assertSame(4900, $entry->partner_amount);
        $this->assertSame(78400, $entry->teacher_amount);

        // Running completion again must be idempotent
        $this->artisan('group-sessions:complete-past')->assertExitCode(0);
        $this->assertSame(1, PartnerCommissionEntry::where('group_session_enrollment_id', $enrollment->id)->count());

        // 2) Fluency XP: 60 mins * 10 XP + 50 XP bonus = 650 XP
        /** @var GamificationService $gamification */
        $gamification = app(GamificationService::class);
        $fluency = $gamification->calculateFluency($attributedPupil);
        $this->assertSame(60, $fluency['total_minutes']);
        $this->assertSame(1, $fluency['total_sessions']);
        $this->assertSame(650, $fluency['total_xp']);

        // 3) Streak counts for both attributed pupil and host teacher
        $this->assertSame(1, StreakService::calculateForUser($attributedPupil));
        $this->assertSame(1, StreakService::calculateForUser($teacher));
        $this->assertSame(0, StreakService::calculateForUser($unenrolledPupil));

        // 4) TeacherProfile conversation stats include group session
        $stats = TeacherProfile::getConversationStats($teacher->id, false);
        $this->assertSame(1, $stats['total_conversations']);
        $this->assertSame(60, $stats['total_minutes']);

        // 5) Feedback & rating: non-participant blocked, enrolled participant allowed + updates rating_cache
        $this->actingAs($unenrolledPupil)->postJson('/feedback', [
            'group_session_id' => $session->id,
            'rating_score' => 9,
            'comment_text' => 'I did not attend this session.',
        ])->assertForbidden();

        $this->actingAs($attributedPupil)->post('/feedback', [
            'group_session_id' => $session->id,
            'rating_score' => 10,
            'comment_text' => 'Awesome interactive group discussion with clear feedback!',
        ])->assertRedirect();

        $this->assertDatabaseHas('feedbacks', [
            'group_session_id' => $session->id,
            'teacher_id' => $teacher->id,
            'pupil_id' => $attributedPupil->id,
            'author_id' => $attributedPupil->id,
            'rating_score' => 10,
        ]);

        $this->assertEquals(
            10.0,
            (float) Feedback::where('teacher_id', $teacher->id)->whereNotNull('rating_score')->avg('rating_score')
        );

        // Duplicate rating blocked
        $this->actingAs($attributedPupil)->post('/feedback', [
            'group_session_id' => $session->id,
            'rating_score' => 8,
            'comment_text' => 'Trying to rate twice.',
        ])->assertSessionHasErrors('message');

        $this->assertSame(1, Feedback::where('group_session_id', $session->id)->count());
    }
}

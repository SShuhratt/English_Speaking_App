<?php

namespace Tests\Feature\GroupSessions;

use App\Models\GroupSession;
use App\Models\GroupSessionEnrollment;
use App\Models\HumoTransaction;
use App\Models\TeacherProfile;
use App\Models\User;
use App\Services\HumoPaymentService;
use Illuminate\Foundation\Http\Middleware\PreventRequestForgery;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Tests\TestCase;

class GroupSessionEnrollmentAndPaymentTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutMiddleware(PreventRequestForgery::class);
        Config::set('services.humo.card_last_digits', '6751');
    }

    private function createScheduledSession(int $maxSeats = 2, int $pricePerSeat = 50000): array
    {
        $teacher = User::factory()->teacher()->create();
        TeacherProfile::create([
            'user_id' => $teacher->id,
            'price' => 80000,
            'is_verified' => true,
            'supports_group_sessions' => true,
            'preferred_session_format' => 'both',
        ]);

        $session = GroupSession::create([
            'teacher_id' => $teacher->id,
            'title' => 'Fluency Circle',
            'start_at' => now()->addDays(2),
            'end_at' => now()->addDays(2)->addHour(),
            'duration_minutes' => 60,
            'max_seats' => $maxSeats,
            'price_per_seat' => $pricePerSeat,
            'status' => 'scheduled',
        ]);

        return [$teacher, $session];
    }

    public function test_seat_capacity_is_enforced_and_vouchers_are_blocked(): void
    {
        [, $session] = $this->createScheduledSession(maxSeats: 2, pricePerSeat: 50000);
        $pupil1 = User::factory()->pupil()->create();
        $pupil2 = User::factory()->pupil()->create();
        $pupil3 = User::factory()->pupil()->create();

        // Vouchers must be strictly blocked on group sessions
        $this->actingAs($pupil1)->postJson("/pupil/group-sessions/{$session->id}/enroll", [
            'voucher_code' => 'PROMO25',
        ])->assertStatus(422);

        $this->actingAs($pupil1)->postJson("/pupil/group-sessions/{$session->id}/enroll", [
            'partner_voucher_code' => 'PARTNER-123',
        ])->assertStatus(422);

        // Two seats fit capacity=2
        $this->actingAs($pupil1)->postJson("/pupil/group-sessions/{$session->id}/enroll")
            ->assertCreated();
        $this->actingAs($pupil2)->postJson("/pupil/group-sessions/{$session->id}/enroll")
            ->assertCreated();

        // Duplicate enrollment by same pupil blocked
        $this->actingAs($pupil1)->postJson("/pupil/group-sessions/{$session->id}/enroll")
            ->assertStatus(422);

        // 3rd pupil blocked because max_seats=2
        $this->actingAs($pupil3)->postJson("/pupil/group-sessions/{$session->id}/enroll")
            ->assertStatus(422);

        $this->assertSame(2, $session->fresh()->occupiedSeatsCount());
        $this->assertSame(0, $session->fresh()->availableSeatsCount());
    }

    public function test_unpaid_seat_holds_expire_after_15_minutes_without_receipt(): void
    {
        [, $session] = $this->createScheduledSession(maxSeats: 2, pricePerSeat: 50000);
        $pupilExpired = User::factory()->pupil()->create();
        $pupilWithReceipt = User::factory()->pupil()->create();
        $pupilLatecomer = User::factory()->pupil()->create();

        $expiredHold = GroupSessionEnrollment::create([
            'group_session_id' => $session->id,
            'pupil_id' => $pupilExpired->id,
            'status' => 'pending_payment',
            'payment_status' => 'verifying',
            'price_paid' => 50000,
            'reserved_until' => now()->subMinute(),
            'receipt_path' => null,
            'receipt_data' => null,
        ]);

        $submittedHold = GroupSessionEnrollment::create([
            'group_session_id' => $session->id,
            'pupil_id' => $pupilWithReceipt->id,
            'status' => 'pending_payment',
            'payment_status' => 'verifying',
            'price_paid' => 50000,
            'reserved_until' => now()->subMinute(),
            'receipt_data' => ['is_payment_receipt' => true, 'amount' => 50000, 'time' => '12:00'],
        ]);

        $this->artisan('group-sessions:expire-unpaid')->assertExitCode(0);

        $this->assertSame('cancelled', $expiredHold->fresh()->status);
        $this->assertSame('rejected', $expiredHold->fresh()->payment_status);

        // Hold with submitted receipt remains intact
        $this->assertSame('pending_payment', $submittedHold->fresh()->status);

        // Seat is freed for new pupil
        $this->assertSame(1, $session->fresh()->availableSeatsCount());
        $this->actingAs($pupilLatecomer)->postJson("/pupil/group-sessions/{$session->id}/enroll")
            ->assertCreated();
    }

    public function test_humo_strict_receipt_rule_disambiguates_identical_seat_prices_by_time(): void
    {
        [, $session] = $this->createScheduledSession(maxSeats: 5, pricePerSeat: 50000);
        $pupil1 = User::factory()->pupil()->create();
        $pupil2 = User::factory()->pupil()->create();

        $enrollment1 = GroupSessionEnrollment::create([
            'group_session_id' => $session->id,
            'pupil_id' => $pupil1->id,
            'status' => 'pending_payment',
            'payment_status' => 'verifying',
            'price_paid' => 50000,
            'gross_amount' => 50000,
            'gateway_provider' => 'humo_p2p',
            'gateway_fee_bps' => 200,
            'gateway_fee_amount' => 1000,
            'net_cash_amount' => 49000,
            'reserved_until' => now()->addMinutes(15),
        ]);

        $enrollment2 = GroupSessionEnrollment::create([
            'group_session_id' => $session->id,
            'pupil_id' => $pupil2->id,
            'status' => 'pending_payment',
            'payment_status' => 'verifying',
            'price_paid' => 50000,
            'gross_amount' => 50000,
            'gateway_provider' => 'humo_p2p',
            'gateway_fee_bps' => 200,
            'gateway_fee_amount' => 1000,
            'net_cash_amount' => 49000,
            'reserved_until' => now()->addMinutes(15),
        ]);

        /** @var HumoPaymentService $humoService */
        $humoService = app(HumoPaymentService::class);

        $sms1 = '➕ 50.000,00 UZS; HUMOCARD *6751; 📍 Click P2P; 🕓 14:30 26.11.2026; Qoldiq: 1.000.000,00 UZS';
        $sms2 = '➕ 50.000,00 UZS; HUMOCARD *6751; 📍 Click P2P; 🕓 14:42 26.11.2026; Qoldiq: 1.050.000,00 UZS';

        $humoService->process($sms1);
        $humoService->process($sms2);

        // Strict receipt rule: neither is auto-confirmed without a receipt
        $this->assertSame('pending_payment', $enrollment1->fresh()->status);
        $this->assertSame('pending_payment', $enrollment2->fresh()->status);
        $this->assertSame(2, HumoTransaction::where('status', 'unmatched')->count());

        // Pupil 2 claims with 14:42 receipt
        $claim2 = $humoService->claimWithReceipt(
            pupil: $pupil2,
            receiptDataOrText: [
                'is_payment_receipt' => true,
                'amount' => 50000,
                'time' => '14:42',
            ],
            groupSessionEnrollmentId: $enrollment2->id
        );

        $this->assertSame('confirmed', $claim2['status']);
        $this->assertSame('enrolled', $enrollment2->fresh()->status);
        $this->assertSame('paid', $enrollment2->fresh()->payment_status);
        // Pupil 1 remains verifying until Pupil 1 submits receipt
        $this->assertSame('pending_payment', $enrollment1->fresh()->status);

        // Pupil 1 claims with 14:30 receipt
        $claim1 = $humoService->claimWithReceipt(
            pupil: $pupil1,
            receiptDataOrText: [
                'is_payment_receipt' => true,
                'amount' => 50000,
                'time' => '14:30',
            ],
            groupSessionEnrollmentId: $enrollment1->id
        );

        $this->assertSame('confirmed', $claim1['status']);
        $this->assertSame('enrolled', $enrollment1->fresh()->status);
        $this->assertSame(2, HumoTransaction::where('status', 'matched')->count());
    }

    public function test_admin_can_confirm_and_reject_group_enrollments(): void
    {
        [, $session] = $this->createScheduledSession(maxSeats: 4, pricePerSeat: 60000);
        $admin = User::factory()->create(['role' => 'admin']);
        $pupilA = User::factory()->pupil()->create();
        $pupilB = User::factory()->pupil()->create();

        $enrollA = GroupSessionEnrollment::create([
            'group_session_id' => $session->id,
            'pupil_id' => $pupilA->id,
            'status' => 'pending_payment',
            'payment_status' => 'verifying',
            'price_paid' => 60000,
        ]);

        $enrollB = GroupSessionEnrollment::create([
            'group_session_id' => $session->id,
            'pupil_id' => $pupilB->id,
            'status' => 'pending_payment',
            'payment_status' => 'verifying',
            'price_paid' => 60000,
        ]);

        $this->actingAs($admin)
            ->post("/admin/group-enrollments/{$enrollA->id}/confirm-payment")
            ->assertRedirect();

        $this->assertSame('enrolled', $enrollA->fresh()->status);
        $this->assertSame('paid', $enrollA->fresh()->payment_status);
        $this->assertSame(58800, $enrollA->fresh()->net_cash_amount);

        $this->actingAs($admin)
            ->post("/admin/group-enrollments/{$enrollB->id}/reject-payment", [
                'reason' => 'Unreadable screenshot',
            ])
            ->assertRedirect();

        $this->assertSame('cancelled', $enrollB->fresh()->status);
        $this->assertSame('rejected', $enrollB->fresh()->payment_status);
        $this->assertSame('Unreadable screenshot', $enrollB->fresh()->payment_rejection_reason);
    }
}

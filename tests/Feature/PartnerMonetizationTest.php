<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\PartnerAttribution;
use App\Models\PartnerCommissionEntry;
use App\Models\PartnerOrganization;
use App\Models\PartnerPayout;
use App\Models\PupilPackage;
use App\Models\TeacherProfile;
use App\Models\User;
use App\Services\MonetizationCalculator;
use App\Services\PartnerCommissionService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PartnerMonetizationTest extends TestCase
{
    use RefreshDatabase;

    private function createPartner(string $code = 'REGISTON26', int $rateBps = 500): PartnerOrganization
    {
        return PartnerOrganization::create([
            'name' => 'Registon Learning Center',
            'legal_name' => 'Registon Education MChJ',
            'legal_type' => 'mchj',
            'inn_stir' => '301234567',
            'bank_account' => '20208000100000000001',
            'bank_mfo' => '00424',
            'bank_name' => 'Kapitalbank',
            'partner_code' => $code,
            'commission_rate_bps' => $rateBps,
            'status' => 'active',
        ]);
    }

    private function createTeacherAndAttributedPupil(PartnerOrganization $partner, int $hourlyRate = 100000): array
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        TeacherProfile::create([
            'user_id' => $teacher->id,
            'price' => $hourlyRate,
            'is_verified' => true,
            'accepts_institutional_vouchers' => false,
        ]);

        $pupil = User::factory()->create(['role' => 'pupil']);
        PartnerAttribution::create([
            'partner_organization_id' => $partner->id,
            'pupil_id' => $pupil->id,
            'attribution_source' => 'referral_link',
            'partner_code_used' => $partner->partner_code,
            'attributed_at' => now()->subHours(2),
        ]);

        return [$teacher, $pupil];
    }

    public function test_monetization_calculator_deducts_gateway_fee_first_and_splits_net_cash_80_15_5(): void
    {
        /** @var MonetizationCalculator $calculator */
        $calculator = app(MonetizationCalculator::class);

        $breakdown = $calculator->calculateBreakdown(100000, 'humo_p2p');

        $this->assertSame(100000, $breakdown['gross_amount']);
        $this->assertSame(200, $breakdown['gateway_fee_bps']);
        $this->assertSame(2000, $breakdown['gateway_fee_amount']);
        $this->assertSame(98000, $breakdown['net_cash_amount']);
        $this->assertSame(78400, $breakdown['teacher_amount']);
        $this->assertSame(14700, $breakdown['platform_amount']);
        $this->assertSame(4900, $breakdown['partner_amount']);
        $this->assertSame(
            $breakdown['net_cash_amount'],
            $breakdown['teacher_amount'] + $breakdown['platform_amount'] + $breakdown['partner_amount']
        );
    }

    public function test_complete_past_appointments_command_transitions_confirmed_and_preserves_meeting_started(): void
    {
        $partner = $this->createPartner();
        [$teacher, $pupil] = $this->createTeacherAndAttributedPupil($partner);

        $startedPast = Appointment::create([
            'teacher_id' => $teacher->id,
            'pupil_id' => $pupil->id,
            'start_at' => now()->subHours(3),
            'end_at' => now()->subHours(2),
            'duration_minutes' => 60,
            'status' => 'confirmed',
            'payment_status' => 'paid',
            'price' => 100000,
            'gross_amount' => 100000,
            'gateway_provider' => 'humo_p2p',
            'gateway_fee_bps' => 200,
            'gateway_fee_amount' => 2000,
            'net_cash_amount' => 98000,
            'meeting_started' => true,
            'topics' => ['ielts'],
        ]);

        $unstartedPast = Appointment::create([
            'teacher_id' => $teacher->id,
            'pupil_id' => $pupil->id,
            'start_at' => now()->subHours(5),
            'end_at' => now()->subHours(4),
            'duration_minutes' => 60,
            'status' => 'confirmed',
            'payment_status' => 'paid',
            'price' => 100000,
            'gross_amount' => 100000,
            'gateway_provider' => 'humo_p2p',
            'gateway_fee_bps' => 200,
            'gateway_fee_amount' => 2000,
            'net_cash_amount' => 98000,
            'meeting_started' => false,
            'topics' => ['freestyle'],
        ]);

        $this->artisan('appointments:complete-past')->assertExitCode(0);

        $startedPast->refresh();
        $unstartedPast->refresh();

        $this->assertSame('completed', $startedPast->status);
        $this->assertTrue((bool) $startedPast->meeting_started);
        $this->assertSame('completed', $unstartedPast->status);
        $this->assertFalse((bool) $unstartedPast->meeting_started);

        $this->assertDatabaseHas('partner_commission_entries', [
            'appointment_id' => $startedPast->id,
            'meeting_started' => true,
            'net_cash_basis' => 98000,
            'teacher_amount' => 78400,
            'platform_amount' => 14700,
            'partner_amount' => 4900,
            'status' => 'accrued',
        ]);

        $this->assertDatabaseHas('partner_commission_entries', [
            'appointment_id' => $unstartedPast->id,
            'meeting_started' => false,
            'partner_amount' => 4900,
            'status' => 'accrued',
        ]);

        // Re-running command must be idempotent
        $this->artisan('appointments:complete-past')->assertExitCode(0);
        $this->assertSame(2, PartnerCommissionEntry::count());
    }

    public function test_trial_lessons_and_zero_cash_vouchers_accrue_zero_commission(): void
    {
        $partner = $this->createPartner();
        [$teacher, $pupil] = $this->createTeacherAndAttributedPupil($partner);

        $trial = Appointment::create([
            'teacher_id' => $teacher->id,
            'pupil_id' => $pupil->id,
            'start_at' => now()->subHours(2),
            'end_at' => now()->subHour(),
            'duration_minutes' => 15,
            'status' => 'confirmed',
            'payment_status' => 'paid',
            'is_trial' => true,
            'price' => 25000,
            'gross_amount' => 25000,
            'gateway_provider' => 'humo_p2p',
            'gateway_fee_bps' => 200,
            'gateway_fee_amount' => 500,
            'net_cash_amount' => 24500,
            'meeting_started' => true,
            'topics' => ['trial'],
        ]);

        $promoZero = Appointment::create([
            'teacher_id' => $teacher->id,
            'pupil_id' => $pupil->id,
            'start_at' => now()->subHours(4),
            'end_at' => now()->subHours(3),
            'duration_minutes' => 60,
            'status' => 'confirmed',
            'payment_status' => 'paid',
            'is_trial' => false,
            'is_promotional_zero_cash' => true,
            'price' => 0,
            'gross_amount' => 0,
            'gateway_fee_amount' => 0,
            'net_cash_amount' => 0,
            'meeting_started' => true,
            'topics' => ['freestyle'],
        ]);

        /** @var PartnerCommissionService $service */
        $service = app(PartnerCommissionService::class);
        $service->completeAppointment($trial);
        $service->completeAppointment($promoZero);

        $this->assertSame('completed', $trial->fresh()->status);
        $this->assertSame('completed', $promoZero->fresh()->status);
        $this->assertSame(0, PartnerCommissionEntry::count());
    }

    public function test_pupil_package_accrues_pro_rata_commission_only_upon_lesson_completion(): void
    {
        $partner = $this->createPartner();
        [$teacher, $pupil] = $this->createTeacherAndAttributedPupil($partner);

        $package = PupilPackage::create([
            'pupil_id' => $pupil->id,
            'teacher_id' => $teacher->id,
            'package_title' => '10-Hour Speaking Pack',
            'total_minutes' => 600,
            'remaining_minutes' => 540,
            'price_paid' => 900000,
            'gross_amount' => 900000,
            'gateway_provider' => 'humo_p2p',
            'gateway_fee_bps' => 200,
            'gateway_fee_amount' => 18000,
            'net_cash_amount' => 882000,
            'payment_status' => 'paid',
            'status' => 'active',
            'expires_at' => now()->addDays(60),
        ]);

        // Purchasing the package does not accrue commission upfront
        $this->assertSame(0, PartnerCommissionEntry::count());

        $packageLesson = Appointment::create([
            'teacher_id' => $teacher->id,
            'pupil_id' => $pupil->id,
            'start_at' => now()->subHours(2),
            'end_at' => now()->subHour(),
            'duration_minutes' => 60,
            'status' => 'confirmed',
            'payment_status' => 'paid',
            'is_package_booking' => true,
            'pupil_package_id' => $package->id,
            'price' => 0,
            'meeting_started' => true,
            'topics' => ['ielts'],
        ]);

        /** @var PartnerCommissionService $service */
        $service = app(PartnerCommissionService::class);
        $service->completeAppointment($packageLesson);

        // 60 / 600 of 900,000 = 90,000 gross -> 2% fee = 1,800 -> net 88,200 -> 5% partner = 4,410
        $this->assertDatabaseHas('partner_commission_entries', [
            'appointment_id' => $packageLesson->id,
            'pupil_package_id' => $package->id,
            'entry_source' => 'package_lesson',
            'gross_lesson_value' => 90000,
            'gateway_fee_amount' => 1800,
            'net_cash_basis' => 88200,
            'partner_amount' => 4410,
            'status' => 'accrued',
        ]);
    }

    public function test_admin_can_void_unstarted_session_for_teacher_no_show_and_claw_back_commission(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $partner = $this->createPartner();
        [$teacher, $pupil] = $this->createTeacherAndAttributedPupil($partner);

        $appointment = Appointment::create([
            'teacher_id' => $teacher->id,
            'pupil_id' => $pupil->id,
            'start_at' => now()->subHours(2),
            'end_at' => now()->subHour(),
            'duration_minutes' => 60,
            'status' => 'confirmed',
            'payment_status' => 'paid',
            'price' => 100000,
            'gross_amount' => 100000,
            'gateway_provider' => 'humo_p2p',
            'gateway_fee_bps' => 200,
            'gateway_fee_amount' => 2000,
            'net_cash_amount' => 98000,
            'meeting_started' => false,
            'topics' => ['freestyle'],
        ]);

        app(PartnerCommissionService::class)->completeAppointment($appointment);
        $this->assertDatabaseHas('partner_commission_entries', [
            'appointment_id' => $appointment->id,
            'status' => 'accrued',
        ]);

        $response = $this->actingAs($admin)->post("/admin/appointments/{$appointment->id}/void-no-show", [
            'reason' => 'Teacher did not open the room while student waited.',
        ]);

        $response->assertRedirect();

        $appointment->refresh();
        $this->assertSame('cancelled', $appointment->status);
        $this->assertSame('refunded', $appointment->payment_status);
        $this->assertNotNull($appointment->completion_voided_at);

        $this->assertDatabaseHas('partner_commission_entries', [
            'appointment_id' => $appointment->id,
            'status' => 'voided',
        ]);
    }

    public function test_monthly_payout_enforces_100000_uzs_minimum_threshold_and_settles_with_didox(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $partnerEligible = $this->createPartner('ELIGIBLE1');
        $partnerBelowMin = PartnerOrganization::create([
            'name' => 'Small Center',
            'legal_name' => 'Small YaTT',
            'legal_type' => 'yatt',
            'partner_code' => 'SMALL01',
            'commission_rate_bps' => 500,
            'status' => 'active',
        ]);

        [$teacher, $pupilBig] = $this->createTeacherAndAttributedPupil($partnerEligible);
        [, $pupilSmall] = $this->createTeacherAndAttributedPupil($partnerBelowMin);

        $periodDate = Carbon::create(2026, 10, 15, 12, 0, 0);

        // Eligible partner earns 25 x 4,900 = 122,500 UZS (>= 100,000 threshold)
        for ($i = 0; $i < 25; $i++) {
            $appt = Appointment::create([
                'teacher_id' => $teacher->id,
                'pupil_id' => $pupilBig->id,
                'start_at' => $periodDate->copy()->addHours($i),
                'end_at' => $periodDate->copy()->addHours($i + 1),
                'duration_minutes' => 60,
                'status' => 'confirmed',
                'payment_status' => 'paid',
                'price' => 100000,
                'gross_amount' => 100000,
                'gateway_provider' => 'humo_p2p',
                'gateway_fee_bps' => 200,
                'gateway_fee_amount' => 2000,
                'net_cash_amount' => 98000,
                'meeting_started' => true,
                'topics' => ['ielts'],
            ]);

            app(PartnerCommissionService::class)->completeAppointment($appt, $periodDate);
        }

        // Small partner earns 2 x 4,900 = 9,800 UZS (< 100,000 threshold -> rolls over)
        for ($i = 0; $i < 2; $i++) {
            $appt = Appointment::create([
                'teacher_id' => $teacher->id,
                'pupil_id' => $pupilSmall->id,
                'start_at' => $periodDate->copy()->addHours($i),
                'end_at' => $periodDate->copy()->addHours($i + 1),
                'duration_minutes' => 60,
                'status' => 'confirmed',
                'payment_status' => 'paid',
                'price' => 100000,
                'gross_amount' => 100000,
                'gateway_provider' => 'humo_p2p',
                'gateway_fee_bps' => 200,
                'gateway_fee_amount' => 2000,
                'net_cash_amount' => 98000,
                'meeting_started' => true,
                'topics' => ['ielts'],
            ]);

            app(PartnerCommissionService::class)->completeAppointment($appt, $periodDate);
        }

        $result = app(PartnerCommissionService::class)->generateMonthlyPayouts(2026, 10);

        $this->assertCount(1, $result['created_payouts']);
        $this->assertCount(1, $result['rolled_over_partners']);
        $this->assertSame($partnerBelowMin->id, $result['rolled_over_partners'][0]['partner_id']);

        /** @var PartnerPayout $payout */
        $payout = $result['created_payouts']->first();
        $this->assertSame(25, $payout->total_lessons_count);
        $this->assertSame(122500, (int) $payout->total_commission_amount);
        $this->assertSame('draft', $payout->status);

        $this->assertSame(25, PartnerCommissionEntry::where('payout_id', $payout->id)->where('status', 'included_in_payout')->count());
        $this->assertSame(2, PartnerCommissionEntry::where('partner_organization_id', $partnerBelowMin->id)->where('status', 'accrued')->count());

        $markPaidResponse = $this->actingAs($admin)->post("/admin/partner-payouts/{$payout->id}/mark-paid", [
            'didox_document_id' => 'DIDOX-2026-10-001',
            'payment_reference' => 'BANK-TRF-9988',
        ]);
        $markPaidResponse->assertRedirect();

        $payout->refresh();
        $this->assertSame('paid', $payout->status);
        $this->assertSame('DIDOX-2026-10-001', $payout->didox_document_id);
        $this->assertSame(25, PartnerCommissionEntry::where('payout_id', $payout->id)->where('status', 'paid')->count());
    }
}

<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\PartnerCommissionEntry;
use App\Models\PartnerOrganization;
use App\Models\PartnerVoucher;
use App\Models\TeacherAvailability;
use App\Models\TeacherProfile;
use App\Models\User;
use App\Services\PartnerCommissionService;
use App\Services\PartnerVoucherService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PartnerAttributionAndVouchersTest extends TestCase
{
    use RefreshDatabase;

    private function createPartner(string $code = 'EVEREST26'): PartnerOrganization
    {
        return PartnerOrganization::create([
            'name' => 'Everest Education',
            'legal_name' => 'Everest LC MChJ',
            'legal_type' => 'mchj',
            'partner_code' => $code,
            'commission_rate_bps' => 500,
            'status' => 'active',
        ]);
    }

    public function test_referral_query_captures_partner_code_in_session_and_attributes_registered_pupil(): void
    {
        $partner = $this->createPartner('EVEREST26');

        // Hit any web GET route with ?partner=...
        $this->get('/login?partner=everest26')->assertStatus(200);
        $this->assertSame('EVEREST26', session('partner_referral_code'));

        $response = $this->post('/register', [
            'name' => 'Azizbek Pupil',
            'email' => 'azizbek@example.com',
            'phone_number' => '+998901112233',
            'role' => 'pupil',
            'age' => 20,
            'level' => 'pre-intermediate',
            'password' => 'Password123!@',
            'password_confirmation' => 'Password123!@',
        ]);

        $response->assertRedirect();

        $pupil = User::where('email', 'azizbek@example.com')->firstOrFail();
        $this->assertDatabaseHas('partner_attributions', [
            'partner_organization_id' => $partner->id,
            'pupil_id' => $pupil->id,
            'attribution_source' => 'referral_link',
            'partner_code_used' => 'EVEREST26',
        ]);
    }

    public function test_pupil_can_apply_partner_code_within_24_hours_only_before_any_booking(): void
    {
        $partner = $this->createPartner('CAMBRIDGE1');
        $freshPupil = User::factory()->create([
            'role' => 'pupil',
            'created_at' => now()->subHours(3),
        ]);

        $this->actingAs($freshPupil)
            ->postJson('/pupil/partner-code', ['partner_code' => 'cambridge1'])
            ->assertStatus(200);

        $this->assertDatabaseHas('partner_attributions', [
            'partner_organization_id' => $partner->id,
            'pupil_id' => $freshPupil->id,
            'attribution_source' => 'post_signup_code',
        ]);

        // Duplicate code application is blocked
        $this->actingAs($freshPupil)
            ->postJson('/pupil/partner-code', ['partner_code' => 'CAMBRIDGE1'])
            ->assertStatus(422);

        // Pupil older than 24h cannot be attributed
        $oldPupil = User::factory()->create([
            'role' => 'pupil',
            'created_at' => now()->subHours(26),
        ]);
        $this->actingAs($oldPupil)
            ->postJson('/pupil/partner-code', ['partner_code' => 'CAMBRIDGE1'])
            ->assertStatus(422);

        // Pupil who already booked cannot be attributed
        $bookedPupil = User::factory()->create([
            'role' => 'pupil',
            'created_at' => now()->subHour(),
        ]);
        $teacher = User::factory()->create(['role' => 'teacher']);
        Appointment::create([
            'teacher_id' => $teacher->id,
            'pupil_id' => $bookedPupil->id,
            'start_at' => now()->addDay(),
            'end_at' => now()->addDay()->addHour(),
            'duration_minutes' => 60,
            'status' => 'pending',
            'price' => 80000,
        ]);

        $this->actingAs($bookedPupil)
            ->postJson('/pupil/partner-code', ['partner_code' => 'CAMBRIDGE1'])
            ->assertStatus(422);
    }

    public function test_student_centric_attribution_pays_partner_regardless_of_teacher(): void
    {
        $partner = $this->createPartner('THOMPSON1');
        $pupil = User::factory()->create(['role' => 'pupil', 'created_at' => now()->subHour()]);

        $this->actingAs($pupil)
            ->postJson('/pupil/partner-code', ['partner_code' => 'THOMPSON1'])
            ->assertStatus(200);

        $teacherA = User::factory()->create(['role' => 'teacher']);
        $teacherB = User::factory()->create(['role' => 'teacher']);

        $apptA = Appointment::create([
            'teacher_id' => $teacherA->id,
            'pupil_id' => $pupil->id,
            'start_at' => now()->subHours(4),
            'end_at' => now()->subHours(3),
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
            'topics' => ['freestyle'],
        ]);

        $apptB = Appointment::create([
            'teacher_id' => $teacherB->id,
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
            'meeting_started' => true,
            'topics' => ['ielts'],
        ]);

        $service = app(PartnerCommissionService::class);
        $service->completeAppointment($apptA);
        $service->completeAppointment($apptB);

        $this->assertSame(2, PartnerCommissionEntry::where('partner_organization_id', $partner->id)->count());
    }

    public function test_track_b2_voucher_single_use_redemption_and_refund_on_cancel(): void
    {
        $partner = $this->createPartner('IELTSCLUB');
        $optedInTeacher = User::factory()->create(['role' => 'teacher']);
        TeacherProfile::create([
            'user_id' => $optedInTeacher->id,
            'price' => 60000,
            'is_verified' => true,
            'accepts_institutional_vouchers' => true,
        ]);

        TeacherAvailability::create([
            'teacher_id' => $optedInTeacher->id,
            'type' => 'recurring',
            'day_of_week' => 'monday',
            'start_time' => '09:00:00',
            'end_time' => '13:00:00',
            'slot_duration' => 30,
        ]);

        $pupil = User::factory()->create(['role' => 'pupil']);

        /** @var PartnerVoucherService $voucherService */
        $voucherService = app(PartnerVoucherService::class);
        $batch = $voucherService->createBatch($partner, [
            'title' => 'Mock Speaking Cohort May',
            'bundle_type' => 'mock_speaking',
            'lesson_duration_minutes' => 30,
            'max_lesson_price_uzs' => 45000,
            'unit_face_value_uzs' => 45000,
            'wholesale_discount_percent' => 15,
            'quantity' => 2,
            'validity_days' => 60,
            'payment_status' => 'paid',
        ]);

        $this->assertSame(2, $batch->vouchers->count());
        /** @var PartnerVoucher $voucher */
        $voucher = $batch->vouchers->first();

        $startAt = Carbon::parse('next monday 09:00:00', 'Asia/Tashkent');
        $endAt = $startAt->copy()->addMinutes(30);

        // Validate endpoint works for Track B2 code
        $this->actingAs($pupil)
            ->postJson('/voucher/validate', [
                'voucher_code' => $voucher->code,
                'teacher_id' => $optedInTeacher->id,
                'duration_minutes' => 30,
            ])
            ->assertStatus(200)
            ->assertJsonPath('voucher_type', 'institutional_b2')
            ->assertJsonPath('discount_percent', 100);

        // Book lesson using voucher_code
        $bookResponse = $this->actingAs($pupil)->postJson('/bookings', [
            'teacher_id' => $optedInTeacher->id,
            'pupil_id' => $pupil->id,
            'start_at' => $startAt->toDateTimeString(),
            'end_at' => $endAt->toDateTimeString(),
            'duration_minutes' => 30,
            'topics' => ['ielts'],
            'voucher_code' => $voucher->code,
        ]);

        $bookResponse->assertStatus(201);
        $appointmentId = $bookResponse->json('data.id');

        $this->assertDatabaseHas('appointments', [
            'id' => $appointmentId,
            'partner_voucher_id' => $voucher->id,
            'price' => 0,
            'gateway_provider' => 'wholesale_bundle',
            'is_promotional_zero_cash' => false,
        ]);

        $voucher->refresh();
        $this->assertSame('redeemed', $voucher->status);
        $this->assertSame($appointmentId, $voucher->redeemed_appointment_id);

        // Reusing the same voucher on a second lesson must fail (no stacking/carryover)
        $secondStart = $startAt->copy()->addHour();
        $secondEnd = $secondStart->copy()->addMinutes(30);
        $this->actingAs($pupil)
            ->postJson('/bookings', [
                'teacher_id' => $optedInTeacher->id,
                'pupil_id' => $pupil->id,
                'start_at' => $secondStart->toDateTimeString(),
                'end_at' => $secondEnd->toDateTimeString(),
                'duration_minutes' => 30,
                'topics' => ['ielts'],
                'voucher_code' => $voucher->code,
            ])
            ->assertStatus(422);

        // Cancelling the booking refunds the voucher back to available
        $this->actingAs($pupil)
            ->deleteJson("/bookings/{$appointmentId}", ['reason' => 'Rescheduling'])
            ->assertStatus(200);

        $voucher->refresh();
        $this->assertSame('available', $voucher->status);
        $this->assertNull($voucher->redeemed_appointment_id);
    }

    public function test_track_b2_voucher_rejects_non_opted_in_teacher_and_over_cap(): void
    {
        $partner = $this->createPartner('PREPIELTS');
        $nonOptedTeacher = User::factory()->create(['role' => 'teacher']);
        TeacherProfile::create([
            'user_id' => $nonOptedTeacher->id,
            'price' => 60000,
            'is_verified' => true,
            'accepts_institutional_vouchers' => false,
        ]);

        $expensiveOptedTeacher = User::factory()->create(['role' => 'teacher']);
        TeacherProfile::create([
            'user_id' => $expensiveOptedTeacher->id,
            'price' => 200000, // 30 mins = 100,000 > 45,000 cap
            'is_verified' => true,
            'accepts_institutional_vouchers' => true,
        ]);

        $pupil = User::factory()->create(['role' => 'pupil']);
        $batch = app(PartnerVoucherService::class)->createBatch($partner, [
            'title' => 'Mock Cohort',
            'bundle_type' => 'mock_speaking',
            'lesson_duration_minutes' => 30,
            'max_lesson_price_uzs' => 45000,
            'unit_face_value_uzs' => 45000,
            'quantity' => 1,
            'payment_status' => 'paid',
        ]);
        $voucher = $batch->vouchers->first();

        $this->actingAs($pupil)
            ->postJson('/voucher/validate', [
                'voucher_code' => $voucher->code,
                'teacher_id' => $nonOptedTeacher->id,
                'duration_minutes' => 30,
            ])
            ->assertStatus(422);

        $this->actingAs($pupil)
            ->postJson('/voucher/validate', [
                'voucher_code' => $voucher->code,
                'teacher_id' => $expensiveOptedTeacher->id,
                'duration_minutes' => 30,
            ])
            ->assertStatus(422);
    }

    public function test_admin_can_view_partners_hub(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $this->createPartner('TESTHUB01');

        $this->actingAs($admin)
            ->get('/admin/partners')
            ->assertStatus(200);
    }
}

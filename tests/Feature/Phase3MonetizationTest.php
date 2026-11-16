<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\Conversation;
use App\Models\ExternalEntitlement;
use App\Models\IntegrationWebhookEvent;
use App\Models\PartnerAttribution;
use App\Models\PartnerCommissionEntry;
use App\Models\PartnerOrganization;
use App\Models\PartnerPass;
use App\Models\PlatformSetting;
use App\Models\PupilProfile;
use App\Models\TeacherAvailability;
use App\Models\TeacherPackage;
use App\Models\TeacherProfile;
use App\Models\User;
use App\Models\UserDiscountVoucher;
use App\Services\GamificationService;
use App\Services\P2pQuotaService;
use App\Services\PartnerCommissionService;
use App\Services\PartnerPassService;
use App\Services\PartnerVoucherService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class Phase3MonetizationTest extends TestCase
{
    use RefreshDatabase;

    private function createPartner(string $code = 'REGISTON3'): PartnerOrganization
    {
        return PartnerOrganization::create([
            'name' => 'Registon Partner Center',
            'legal_name' => 'Registon MChJ',
            'legal_type' => 'mchj',
            'partner_code' => $code,
            'commission_rate_bps' => 500,
            'status' => 'active',
        ]);
    }

    public function test_vouchers_cannot_be_validated_or_applied_when_purchasing_pupil_package(): void
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        TeacherProfile::create([
            'user_id' => $teacher->id,
            'price' => 100000,
            'is_verified' => true,
            'accepts_institutional_vouchers' => true,
        ]);

        $package = TeacherPackage::create([
            'teacher_id' => $teacher->id,
            'title' => '10-Hour IELTS Pack',
            'total_hours' => 10,
            'total_minutes' => 600,
            'price' => 800000,
            'is_active' => true,
        ]);

        $pupil = User::factory()->create(['role' => 'pupil']);
        $personalVoucher = UserDiscountVoucher::create([
            'user_id' => $pupil->id,
            'voucher_code' => 'CONVO-10-PACK',
            'discount_percent' => 10,
            'xp_spent' => 1000,
            'is_redeemed' => false,
        ]);

        $partner = $this->createPartner('B2PACK01');
        $batch = app(PartnerVoucherService::class)->createBatch($partner, [
            'title' => 'Mock Cohort',
            'lesson_duration_minutes' => 30,
            'max_lesson_price_uzs' => 60000,
            'unit_face_value_uzs' => 50000,
            'quantity' => 1,
            'payment_status' => 'paid',
        ]);
        $b2Voucher = $batch->vouchers->first();

        // Both personal and B2 vouchers fail validation in package context
        $this->actingAs($pupil)
            ->postJson('/voucher/validate', [
                'voucher_code' => $personalVoucher->voucher_code,
                'teacher_id' => $teacher->id,
                'context' => 'package',
            ])
            ->assertStatus(422);

        $this->actingAs($pupil)
            ->postJson('/voucher/validate', [
                'voucher_code' => $b2Voucher->code,
                'teacher_id' => $teacher->id,
                'context' => 'package',
            ])
            ->assertStatus(422);

        // Purchasing pack with voucher_code rejects with 422 and leaves voucher unredeemed
        $this->actingAs($pupil)
            ->postJson('/pupil/packages/purchase', [
                'teacher_package_id' => $package->id,
                'voucher_code' => $personalVoucher->voucher_code,
            ])
            ->assertStatus(422);

        $this->assertFalse((bool) $personalVoucher->fresh()->is_redeemed);
    }

    public function test_safe_discount_option_a_retires_25_voucher_and_protects_teacher_share(): void
    {
        $partner = $this->createPartner('SAFEDISC1');
        $teacher = User::factory()->create(['role' => 'teacher']);
        TeacherProfile::create([
            'user_id' => $teacher->id,
            'price' => 100000,
            'is_verified' => true,
        ]);
        TeacherAvailability::create([
            'teacher_id' => $teacher->id,
            'type' => 'recurring',
            'day_of_week' => 'monday',
            'start_time' => '09:00:00',
            'end_time' => '12:00:00',
            'slot_duration' => 60,
        ]);

        $pupil = User::factory()->create(['role' => 'pupil']);
        PupilProfile::create(['user_id' => $pupil->id, 'spent_xp' => 0]);
        $peer = User::factory()->create(['role' => 'pupil']);
        Conversation::create([
            'pupil_id' => $pupil->id,
            'teacher_id' => $peer->id,
            'topic' => 'XP Warmup',
            'started_at' => now()->subDays(2)->subMinutes(120),
            'ended_at' => now()->subDays(2),
        ]);
        PartnerAttribution::create([
            'partner_organization_id' => $partner->id,
            'pupil_id' => $pupil->id,
            'attribution_source' => 'referral_link',
            'partner_code_used' => $partner->partner_code,
            'attributed_at' => now(),
        ]);

        $catalog = GamificationService::getXpStoreCatalog($pupil);
        $keys = collect($catalog['items'])->pluck('key')->all();
        $this->assertContains('voucher_10', $keys);
        $this->assertNotContains('voucher_25', $keys);

        $blocked25 = GamificationService::redeemStoreItem($pupil, 'voucher_25');
        $this->assertFalse($blocked25['success']);

        $ok10 = GamificationService::redeemStoreItem($pupil, 'voucher_10');
        $this->assertTrue($ok10['success']);
        $voucherCode = $ok10['voucher']->voucher_code;

        $startAt = Carbon::parse('next monday 09:00:00', 'Asia/Tashkent');
        $bookResp = $this->actingAs($pupil)->postJson('/bookings', [
            'teacher_id' => $teacher->id,
            'pupil_id' => $pupil->id,
            'start_at' => $startAt->toDateTimeString(),
            'end_at' => $startAt->copy()->addHour()->toDateTimeString(),
            'duration_minutes' => 60,
            'topics' => ['ielts'],
            'voucher_code' => $voucherCode,
        ]);
        $bookResp->assertStatus(201);

        $appointment = Appointment::findOrFail($bookResp->json('data.id'));
        $this->assertSame(90000, $appointment->price);
        $this->assertSame(100000, $appointment->original_price);
        $this->assertSame(10000, $appointment->platform_subsidy_amount);

        // Mark paid & complete -> 2% fee of 90,000 = 1,800 -> Net Cash = 88,200
        // Teacher protected (80% of 98,000) = 78,400; Partner (5% of 88,200) = 4,410; Platform = 5,390
        $appointment->update([
            'status' => 'confirmed',
            'payment_status' => 'paid',
            'meeting_started' => true,
        ]);

        app(PartnerCommissionService::class)->completeAppointment($appointment);

        $this->assertDatabaseHas('partner_commission_entries', [
            'appointment_id' => $appointment->id,
            'gross_lesson_value' => 90000,
            'gateway_fee_amount' => 1800,
            'net_cash_basis' => 88200,
            'teacher_amount' => 78400,
            'partner_amount' => 4410,
            'platform_amount' => 5390,
        ]);
    }

    public function test_admin_can_configure_partner_pass_pricing_and_p2p_quotas(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($admin)
            ->post('/admin/partner-settings', [
                'partner_pass_b2c_price_uzs' => 35000,
                'partner_pass_b2b_default_price_uzs' => 24000,
                'partner_pass_b2b_min_price_uzs' => 20000,
                'partner_pass_default_days' => 30,
                'p2p_free_daily_minutes' => 60,
                'p2p_attributed_daily_minutes' => 120,
            ])
            ->assertRedirect();

        $config = PlatformSetting::monetizationConfig();
        $this->assertSame(35000, $config['partner_pass_b2c_price_uzs']);
        $this->assertSame(24000, $config['partner_pass_b2b_default_price_uzs']);
    }

    public function test_b2b_partner_pass_batch_activation_extends_expiry_and_accrues_zero_extra_commission(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $partner = $this->createPartner('B2BPASS1');
        $pupil = User::factory()->create(['role' => 'pupil', 'created_at' => now()->subDays(10)]);

        $this->actingAs($admin)
            ->post("/admin/partners/{$partner->id}/pass-batches", [
                'title' => 'IELTS Sprint 30 Seats',
                'duration_days' => 30,
                'unit_wholesale_price_uzs' => 25000,
                'quantity' => 2,
                'payment_status' => 'paid',
            ])
            ->assertRedirect();

        $passes = PartnerPass::orderBy('created_at')->get();
        $this->assertCount(2, $passes);

        // Redeem first code -> 30 days active
        $this->actingAs($pupil)
            ->postJson('/pupil/partner-pass/redeem', ['pass_code' => $passes[0]->activation_code])
            ->assertStatus(200);

        $this->assertTrue($pupil->fresh()->hasActivePartnerPass());
        $firstExpiry = $pupil->fresh()->activePartnerPass()->expires_at->copy();

        // Duplicate use fails
        $this->actingAs($pupil)
            ->postJson('/pupil/partner-pass/redeem', ['pass_code' => $passes[0]->activation_code])
            ->assertStatus(422);

        // Redeeming a second code stacks +30 days on top of firstExpiry (60 days total)
        $this->actingAs($pupil)
            ->postJson('/pupil/partner-pass/redeem', ['pass_code' => $passes[1]->activation_code])
            ->assertStatus(200);

        $stackedExpiry = $pupil->fresh()->activePartnerPass()->expires_at;
        $this->assertSame(30, (int) round($firstExpiry->diffInDays($stackedExpiry)));
        $this->assertSame(0, PartnerCommissionEntry::count());
    }

    public function test_b2c_retail_partner_pass_purchase_and_confirmation_accrues_5_percent_when_attributed(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $partner = $this->createPartner('RETAIL05');
        $attributedPupil = User::factory()->create(['role' => 'pupil']);
        $directPupil = User::factory()->create(['role' => 'pupil']);

        PartnerAttribution::create([
            'partner_organization_id' => $partner->id,
            'pupil_id' => $attributedPupil->id,
            'attribution_source' => 'referral_link',
            'partner_code_used' => $partner->partner_code,
            'attributed_at' => now(),
        ]);

        // Attributed student buys B2C Partner Pass (default 30,000 UZS)
        $resp = $this->actingAs($attributedPupil)
            ->postJson('/pupil/partner-pass/purchase')
            ->assertStatus(201);
        $passId = $resp->json('partner_pass.id');

        $this->actingAs($admin)
            ->post("/admin/partner-passes/{$passId}/confirm")
            ->assertRedirect();

        $this->assertTrue($attributedPupil->fresh()->hasActivePartnerPass());

        // 30,000 - 2% (600) = 29,400 Net Cash -> 5% = 1,470 UZS partner commission
        $this->assertDatabaseHas('partner_commission_entries', [
            'partner_organization_id' => $partner->id,
            'partner_pass_id' => $passId,
            'entry_source' => 'b2c_partner_pass',
            'gross_lesson_value' => 30000,
            'gateway_fee_amount' => 600,
            'net_cash_basis' => 29400,
            'partner_amount' => 1470,
            'platform_amount' => 27930,
            'teacher_amount' => 0,
            'status' => 'accrued',
        ]);

        // Unattributed student buys B2C Partner Pass -> activates pass with zero partner commission
        $directResp = $this->actingAs($directPupil)
            ->postJson('/pupil/partner-pass/purchase')
            ->assertStatus(201);
        $directPassId = $directResp->json('partner_pass.id');

        $this->actingAs($admin)
            ->post("/admin/partner-passes/{$directPassId}/confirm")
            ->assertRedirect();

        $this->assertTrue($directPupil->fresh()->hasActivePartnerPass());
        $this->assertSame(1, PartnerCommissionEntry::count());
    }

    public function test_p2p_daily_quota_enforces_60m_standard_120m_attributed_and_unlimited_partner_pass(): void
    {
        $partner = $this->createPartner('QUOTAP2P');
        $standardPupil = User::factory()->create(['role' => 'pupil']);
        $attributedPupil = User::factory()->create(['role' => 'pupil']);

        PartnerAttribution::create([
            'partner_organization_id' => $partner->id,
            'pupil_id' => $attributedPupil->id,
            'attribution_source' => 'referral_link',
            'partner_code_used' => $partner->partner_code,
            'attributed_at' => now(),
        ]);

        /** @var P2pQuotaService $quotaService */
        $quotaService = app(P2pQuotaService::class);

        $this->assertSame('standard', $quotaService->checkAllowance($standardPupil)['tier']);
        $this->assertSame(60, $quotaService->checkAllowance($standardPupil)['daily_limit_minutes']);
        $this->assertSame('partner_attributed', $quotaService->checkAllowance($attributedPupil)['tier']);
        $this->assertSame(120, $quotaService->checkAllowance($attributedPupil)['daily_limit_minutes']);

        // Record 61 minutes on both: standard is blocked (429), attributed is still allowed (has 59m left)
        $quotaService->recordUsageSeconds($standardPupil, 61 * 60);
        $quotaService->recordUsageSeconds($attributedPupil, 61 * 60);

        $this->actingAs($standardPupil)
            ->postJson('/matchmaking/join', ['topic' => 'free_talk'])
            ->assertStatus(429);

        $this->assertTrue($quotaService->checkAllowance($attributedPupil)['allowed']);

        // Attributed student reaches 120m -> blocked; then activates Partner Pass -> immediately unlimited!
        $quotaService->recordUsageSeconds($attributedPupil, 60 * 60);
        $this->actingAs($attributedPupil)
            ->postJson('/matchmaking/join', ['topic' => 'free_talk'])
            ->assertStatus(429);

        $batch = app(PartnerPassService::class)->createB2bBatch($partner, [
            'title' => 'Pass Quota Lift',
            'duration_days' => 30,
            'unit_wholesale_price_uzs' => 25000,
            'quantity' => 1,
            'payment_status' => 'paid',
        ]);
        app(PartnerPassService::class)->redeemCode($attributedPupil, $batch->passes->first()->activation_code);

        $upgraded = $quotaService->checkAllowance($attributedPupil);
        $this->assertTrue($upgraded['unlimited']);
        $this->assertTrue($upgraded['allowed']);
    }

    public function test_writing_mentor_sso_and_signed_webhook_integration(): void
    {
        $partner = $this->createPartner('WMBRIDGE');
        $pupil = User::factory()->create([
            'role' => 'pupil',
            'email' => 'writer@example.com',
            'full_name' => 'Malika Writer',
        ]);
        PartnerAttribution::create([
            'partner_organization_id' => $partner->id,
            'pupil_id' => $pupil->id,
            'attribution_source' => 'referral_link',
            'partner_code_used' => $partner->partner_code,
            'attributed_at' => now(),
        ]);

        // Disabled by default -> 503
        config()->set('monetization.writing_mentor.enabled', false);
        $this->actingAs($pupil)->get('/integrations/writing-mentor/launch')->assertStatus(503);

        // Enable bridge
        config()->set('monetization.writing_mentor.enabled', true);
        config()->set('monetization.writing_mentor.base_url', 'https://writingmentor.test');
        config()->set('monetization.writing_mentor.sso_secret', 'sso_secret_123');
        config()->set('monetization.writing_mentor.webhook_secret', 'wh_secret_456');

        $launchResp = $this->actingAs($pupil)
            ->getJson('/integrations/writing-mentor/launch')
            ->assertStatus(200);

        $launchUrl = $launchResp->json('launch_url');
        $this->assertStringStartsWith('https://writingmentor.test/sso/callback?token=', $launchUrl);

        parse_str((string) parse_url($launchUrl, PHP_URL_QUERY), $query);
        [$encodedPayload, $sig] = explode('.', $query['token']);
        $decoded = json_decode((string) base64_decode(strtr($encodedPayload, '-_', '+/')), true);

        $this->assertSame($pupil->id, $decoded['user_id']);
        $this->assertSame('WMBRIDGE', $decoded['partner_code']);
        $this->assertFalse($decoded['partner_pass_active']);

        // Webhook rejects bad signature & stale timestamp
        $payloadArray = [
            'event_id' => 'evt_wm_001',
            'event_type' => 'entitlement.activated',
            'user_id' => $pupil->id,
            'external_user_id' => 'wm_u_99',
            'plan_code' => 'writing_pro',
            'expires_at' => now()->addMonth()->toIso8601String(),
        ];
        $rawBody = json_encode($payloadArray);
        $ts = now()->timestamp;
        $validSig = 'sha256='.hash_hmac('sha256', "{$ts}.{$rawBody}", 'wh_secret_456');

        $this->call('POST', '/api/integrations/writing-mentor/webhook', [], [], [], [
            'HTTP_X_WRITINGMENTOR_SIGNATURE' => 'sha256=bad',
            'HTTP_X_WRITINGMENTOR_TIMESTAMP' => (string) $ts,
            'CONTENT_TYPE' => 'application/json',
        ], $rawBody)->assertStatus(401);

        $staleTs = now()->subMinutes(10)->timestamp;
        $staleSig = 'sha256='.hash_hmac('sha256', "{$staleTs}.{$rawBody}", 'wh_secret_456');
        $this->call('POST', '/api/integrations/writing-mentor/webhook', [], [], [], [
            'HTTP_X_WRITINGMENTOR_SIGNATURE' => $staleSig,
            'HTTP_X_WRITINGMENTOR_TIMESTAMP' => (string) $staleTs,
            'CONTENT_TYPE' => 'application/json',
        ], $rawBody)->assertStatus(401);

        // Valid webhook creates entitlement
        $this->call('POST', '/api/integrations/writing-mentor/webhook', [], [], [], [
            'HTTP_X_WRITINGMENTOR_SIGNATURE' => $validSig,
            'HTTP_X_WRITINGMENTOR_TIMESTAMP' => (string) $ts,
            'CONTENT_TYPE' => 'application/json',
        ], $rawBody)->assertStatus(200);

        $this->assertSame(1, ExternalEntitlement::where('user_id', $pupil->id)->where('status', 'active')->count());

        // Duplicate event_id is idempotent
        $this->call('POST', '/api/integrations/writing-mentor/webhook', [], [], [], [
            'HTTP_X_WRITINGMENTOR_SIGNATURE' => $validSig,
            'HTTP_X_WRITINGMENTOR_TIMESTAMP' => (string) $ts,
            'CONTENT_TYPE' => 'application/json',
        ], $rawBody)->assertStatus(200);

        $this->assertSame(1, IntegrationWebhookEvent::count());
    }
}

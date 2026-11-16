<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\PartnerAttribution;
use App\Models\PartnerCommissionEntry;
use App\Models\PartnerOrganization;
use App\Models\PartnerOrganizationUser;
use App\Models\PartnerPayout;
use App\Models\User;
use App\Services\PartnerCommissionService;
use App\Services\PartnerPassService;
use App\Services\PartnerVoucherService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class PartnerDashboardTest extends TestCase
{
    use RefreshDatabase;

    protected function createOrganization(string $name, string $code, string $status = 'active'): PartnerOrganization
    {
        return PartnerOrganization::create([
            'name' => $name,
            'legal_name' => $name.' MChJ',
            'legal_type' => 'mchj',
            'inn_stir' => '309111222',
            'bank_account' => '20208000100020003000',
            'bank_mfo' => '00424',
            'bank_name' => 'Ipak Yuli Bank',
            'partner_code' => $code,
            'commission_rate_bps' => 500,
            'status' => $status,
        ]);
    }

    public function test_role_and_redirect_isolation_for_partner_portal(): void
    {
        $pupil = User::factory()->create(['role' => 'pupil']);
        $teacher = User::factory()->create(['role' => 'teacher']);
        $admin = User::factory()->create(['role' => 'admin']);
        $partnerUser = User::factory()->create(['role' => 'partner']);

        $this->get('/partner/dashboard')->assertRedirect('/login');

        foreach ([$pupil, $teacher, $admin] as $user) {
            $this->actingAs($user)->get('/partner/dashboard')->assertForbidden();
            $this->actingAs($user)->get('/partner/students')->assertForbidden();
            $this->actingAs($user)->get('/partner/codes')->assertForbidden();
            $this->actingAs($user)->get('/partner/payouts')->assertForbidden();
            $this->actingAs($user)->get('/partner/export/ledger-csv')->assertForbidden();
            $this->actingAs($user)->get('/partner/export/students-csv')->assertForbidden();
        }

        $this->actingAs($partnerUser)->get('/dashboard')->assertRedirect('/partner/dashboard');
        $this->actingAs($partnerUser)->get('/admin/partners')->assertForbidden();
        $this->actingAs($partnerUser)->get('/pupil/teachers')->assertForbidden();
    }

    public function test_admin_can_provision_and_manage_multiple_staff_logins_per_center(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $org = $this->createOrganization('Cambridge Center', 'CAMBRIDGE1');
        $existingPupil = User::factory()->create(['role' => 'pupil', 'email' => 'student@example.com']);

        // Reject linking an existing non-partner account
        $this->actingAs($admin)
            ->post("/admin/partners/{$org->id}/staff", [
                'full_name' => 'Wrong Role',
                'email' => $existingPupil->email,
                'staff_role' => 'manager',
                'password' => 'SecretPass123!',
            ])
            ->assertSessionHasErrors('email');

        // Add Director & Accountant
        $this->actingAs($admin)
            ->post("/admin/partners/{$org->id}/staff", [
                'full_name' => 'Aziz Director',
                'email' => 'director@cambridge.uz',
                'phone_number' => '+998901112233',
                'staff_role' => 'director',
                'password' => 'DirectorPass123!',
            ])
            ->assertSessionHasNoErrors();

        $this->actingAs($admin)
            ->post("/admin/partners/{$org->id}/staff", [
                'full_name' => 'Madina Accountant',
                'email' => 'accountant@cambridge.uz',
                'staff_role' => 'accountant',
                'password' => 'AccountantPass123!',
            ])
            ->assertSessionHasNoErrors();

        $director = User::where('email', 'director@cambridge.uz')->firstOrFail();
        $accountant = User::where('email', 'accountant@cambridge.uz')->firstOrFail();

        $this->assertSame('partner', $director->role);
        $this->assertSame($director->id, $org->fresh()->director_user_id);

        // Both staff members see their org portal
        $this->actingAs($director)->get('/partner/dashboard')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('partner/dashboard')
                ->where('organization.name', 'Cambridge Center')
                ->where('staffRole', 'director')
                ->has('staff_members', 2)
            );

        $this->actingAs($accountant)->get('/partner/dashboard')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('partner/dashboard')
                ->where('staffRole', 'accountant')
            );

        // Suspend accountant login while director keeps access
        $accountantMembership = PartnerOrganizationUser::where('user_id', $accountant->id)->firstOrFail();
        $this->actingAs($admin)->patch("/admin/partner-staff/{$accountantMembership->id}/toggle")->assertSessionHasNoErrors();

        $this->actingAs($accountant)->get('/partner/dashboard')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('partner/unavailable')
                ->where('organizationStatus', 'unassigned')
            );
        $this->actingAs($accountant)->get('/partner/export/students-csv')->assertForbidden();
        $this->actingAs($director)->get('/partner/export/students-csv')->assertOk();

        // Removing director promotes active or clears director_user_id cleanly
        $directorMembership = PartnerOrganizationUser::where('user_id', $director->id)->firstOrFail();
        $this->actingAs($admin)->delete("/admin/partner-staff/{$directorMembership->id}")->assertSessionHasNoErrors();
        $this->assertNull($org->fresh()->director_user_id);
    }

    public function test_partner_portal_enforces_tenant_isolation_and_paused_status(): void
    {
        $orgA = $this->createOrganization('Alpha Academy', 'ALPHAA1');
        $orgB = $this->createOrganization('Beta Academy', 'BETAA1');

        $staffA = User::factory()->create(['role' => 'partner', 'email' => 'alpha@org.uz']);
        PartnerOrganizationUser::create([
            'partner_organization_id' => $orgA->id,
            'user_id' => $staffA->id,
            'staff_role' => 'director',
            'is_active' => true,
        ]);

        $pupilA = User::factory()->create(['role' => 'pupil', 'full_name' => 'Alpha Student']);
        $pupilB = User::factory()->create(['role' => 'pupil', 'full_name' => 'Secret Beta Student']);

        PartnerAttribution::create([
            'partner_organization_id' => $orgA->id,
            'pupil_id' => $pupilA->id,
            'attribution_source' => 'referral_link',
            'partner_code_used' => $orgA->partner_code,
            'attributed_at' => now()->subDays(2),
        ]);
        PartnerAttribution::create([
            'partner_organization_id' => $orgB->id,
            'pupil_id' => $pupilB->id,
            'attribution_source' => 'referral_link',
            'partner_code_used' => $orgB->partner_code,
            'attributed_at' => now()->subDays(1),
        ]);

        app(PartnerVoucherService::class)->createBatch($orgB, [
            'title' => 'Beta Confidential Batch',
            'lesson_duration_minutes' => 30,
            'max_lesson_price_uzs' => 60000,
            'unit_face_value_uzs' => 50000,
            'quantity' => 2,
            'payment_status' => 'paid',
        ]);

        $this->actingAs($staffA)->get('/partner/students')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('partner/students')
                ->where('students.total', 1)
                ->where('students.data.0.full_name', 'Alpha Student')
            );

        $this->actingAs($staffA)->get('/partner/codes')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('partner/codes')
                ->has('voucherBatches', 0)
                ->has('passBatches', 0)
            );

        $studentsCsv = $this->actingAs($staffA)->get('/partner/export/students-csv');
        $studentsCsv->assertOk();
        $csvBody = $studentsCsv->streamedContent();
        $this->assertStringContainsString('Alpha Student', $csvBody);
        $this->assertStringNotContainsString('Secret Beta Student', $csvBody);

        // Pausing org blocks dashboard & CSV exports
        $orgA->update(['status' => 'paused']);
        $this->actingAs($staffA)->get('/partner/dashboard')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('partner/unavailable')
                ->where('organizationStatus', 'paused')
            );
        $this->actingAs($staffA)->get('/partner/export/ledger-csv')->assertForbidden();
    }

    public function test_partner_metrics_codes_and_sanitized_csv_exports(): void
    {
        $org = $this->createOrganization('Registon Prep', 'REGISTON9');
        $staff = User::factory()->create(['role' => 'partner', 'email' => 'registon@prep.uz']);
        PartnerOrganizationUser::create([
            'partner_organization_id' => $org->id,
            'user_id' => $staff->id,
            'staff_role' => 'director',
            'is_active' => true,
        ]);

        $teacher = User::factory()->create(['role' => 'teacher', 'full_name' => 'Teacher Bobur']);
        $studentFormula = User::factory()->create([
            'role' => 'pupil',
            'full_name' => '=CMD("calc")',
            'email' => 'formula@student.uz',
            'phone_number' => '+998901234567',
        ]);
        $studentPass = User::factory()->create([
            'role' => 'pupil',
            'full_name' => 'Dilnoza Karimova',
            'email' => 'dilnoza@student.uz',
        ]);

        PartnerAttribution::create([
            'partner_organization_id' => $org->id,
            'pupil_id' => $studentFormula->id,
            'attribution_source' => 'manual_code',
            'partner_code_used' => $org->partner_code,
            'attributed_at' => now()->subDays(5),
        ]);
        PartnerAttribution::create([
            'partner_organization_id' => $org->id,
            'pupil_id' => $studentPass->id,
            'attribution_source' => 'referral_link',
            'partner_code_used' => $org->partner_code,
            'attributed_at' => now()->subDays(3),
        ]);

        // B2B Partner Pass batch (1 redeemed by studentPass, 1 unclaimed)
        $passBatch = app(PartnerPassService::class)->createB2bBatch($org, [
            'title' => 'Fall IELTS Unlimited Seats',
            'duration_days' => 30,
            'unit_wholesale_price_uzs' => 22000,
            'quantity' => 2,
            'payment_status' => 'paid',
        ]);
        $firstCode = $passBatch->passes->first()->activation_code;
        app(PartnerPassService::class)->redeemCode($studentPass, $firstCode);

        // B2B Voucher batch
        app(PartnerVoucherService::class)->createBatch($org, [
            'title' => 'Mock Exam Vouchers',
            'lesson_duration_minutes' => 30,
            'max_lesson_price_uzs' => 60000,
            'unit_face_value_uzs' => 50000,
            'quantity' => 3,
            'payment_status' => 'paid',
        ]);

        // Accrued lesson + Settled payout lesson
        $aptAccrued = Appointment::create([
            'teacher_id' => $teacher->id,
            'pupil_id' => $studentFormula->id,
            'start_at' => Carbon::now()->subDays(2),
            'end_at' => Carbon::now()->subDays(2)->addHour(),
            'duration_minutes' => 60,
            'status' => 'confirmed',
            'payment_status' => 'paid',
            'price' => 100000,
            'meeting_started' => true,
        ]);
        app(PartnerCommissionService::class)->completeAppointment($aptAccrued);

        $paidPayout = PartnerPayout::create([
            'partner_organization_id' => $org->id,
            'period_year' => 2026,
            'period_month' => 10,
            'period_start' => '2026-10-01',
            'period_end' => '2026-10-31',
            'total_lessons_count' => 1,
            'total_net_cash_gmv' => 98000,
            'total_commission_amount' => 4900,
            'didox_document_id' => 'DIDOX-77889',
            'status' => 'paid',
            'paid_at' => now()->subDays(10),
        ]);
        $aptPaid = Appointment::create([
            'teacher_id' => $teacher->id,
            'pupil_id' => $studentPass->id,
            'start_at' => Carbon::now()->subDays(12),
            'end_at' => Carbon::now()->subDays(12)->addHour(),
            'duration_minutes' => 60,
            'status' => 'completed',
            'payment_status' => 'paid',
            'price' => 100000,
            'meeting_started' => true,
        ]);
        PartnerCommissionEntry::create([
            'partner_organization_id' => $org->id,
            'pupil_id' => $studentPass->id,
            'teacher_id' => $teacher->id,
            'appointment_id' => $aptPaid->id,
            'payout_id' => $paidPayout->id,
            'entry_source' => 'direct_lesson',
            'meeting_started' => true,
            'gross_lesson_value' => 100000,
            'gateway_fee_bps' => 200,
            'gateway_fee_amount' => 2000,
            'net_cash_basis' => 98000,
            'teacher_rate_bps' => 8000,
            'teacher_amount' => 78400,
            'platform_rate_bps' => 1500,
            'platform_amount' => 14700,
            'partner_rate_bps' => 500,
            'partner_amount' => 4900,
            'status' => 'paid',
            'accrued_at' => now()->subDays(12),
        ]);

        // Dashboard metrics verification (accrued = 4900, paid = 4900, progress = 5% of 100,000)
        $this->actingAs($staff)->get('/partner/dashboard')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('partner/dashboard')
                ->where('metrics.attributed_students_count', 2)
                ->where('metrics.active_pass_holders_count', 1)
                ->where('metrics.completed_lessons_count', 2)
                ->where('metrics.accrued_balance_uzs', 4900)
                ->where('metrics.paid_total_uzs', 4900)
                ->where('metrics.payout_progress_percent', 5)
                ->where('vouchers_summary.available', 3)
                ->where('passes_summary.unclaimed', 1)
                ->where('passes_summary.active_b2b', 1)
            );

        // Students search + tier verification
        $this->actingAs($staff)->get('/partner/students?search=Dilnoza')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('partner/students')
                ->where('students.total', 1)
                ->where('students.data.0.p2p_tier', 'unlimited')
                ->where('students.data.0.total_commission_uzs', 4900)
            );

        // Payouts & filterable ledger verification
        $this->actingAs($staff)->get('/partner/payouts?status=paid')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('partner/payouts')
                ->where('payouts.total', 1)
                ->where('commissionEntries.total', 1)
                ->where('commissionEntries.data.0.status', 'paid')
            );

        // CSV Export formula injection check (+998901234567 and =CMD("calc") prefixed with ')
        $studentsCsvResp = $this->actingAs($staff)->get('/partner/export/students-csv');
        $studentsCsvResp->assertOk();
        $studentsCsvContent = $studentsCsvResp->streamedContent();
        $this->assertStringContainsString("'=CMD(\"\"calc\"\")", $studentsCsvContent);
        $this->assertStringContainsString("'+998901234567", $studentsCsvContent);

        $ledgerCsvResp = $this->actingAs($staff)->get('/partner/export/ledger-csv?status=paid');
        $ledgerCsvResp->assertOk();
        $ledgerCsvContent = $ledgerCsvResp->streamedContent();
        $this->assertStringContainsString('DIDOX-77889', $ledgerCsvContent);
        $this->assertStringNotContainsString('accrued', $ledgerCsvContent);
    }
}

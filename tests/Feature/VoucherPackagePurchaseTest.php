<?php

namespace Tests\Feature;

use App\Models\PupilPackage;
use App\Models\TeacherPackage;
use App\Models\TeacherProfile;
use App\Models\User;
use App\Models\UserDiscountVoucher;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class VoucherPackagePurchaseTest extends TestCase
{
    use RefreshDatabase;

    // ── helpers ──────────────────────────────────────────────────────────────

    private function makeVerifiedTeacher(): User
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        TeacherProfile::create([
            'user_id' => $teacher->id,
            'overall_level' => 'C1',
            'experience_years' => 3,
            'price' => 150000,
            'is_verified' => true,
        ]);

        return $teacher;
    }

    private function makeActivePackage(User $teacher, int $price = 500_000): TeacherPackage
    {
        return TeacherPackage::factory()->create([
            'teacher_id' => $teacher->id,
            'price' => $price,
            'total_minutes' => 60,
            'total_hours' => 1,
            'is_active' => true,
        ]);
    }

    private function makeVoucher(User $pupil, int $percent = 25): UserDiscountVoucher
    {
        return UserDiscountVoucher::factory()->create([
            'user_id' => $pupil->id,
            'voucher_code' => 'TEST-25-CODE',
            'discount_percent' => $percent,
        ]);
    }

    // ── validate endpoint ────────────────────────────────────────────────────

    public function test_validate_voucher_returns_discount_info_for_valid_code(): void
    {
        $pupil = User::factory()->create(['role' => 'pupil']);
        $voucher = $this->makeVoucher($pupil);

        $response = $this->actingAs($pupil)->postJson('/voucher/validate', [
            'voucher_code' => $voucher->voucher_code,
        ]);

        $response->assertOk()
            ->assertJson([
                'valid' => true,
                'voucher_code' => $voucher->voucher_code,
                'discount_percent' => 25,
            ]);
    }

    public function test_validate_voucher_requires_authentication(): void
    {
        $response = $this->postJson('/voucher/validate', [
            'voucher_code' => 'ANY-CODE',
        ]);

        $response->assertStatus(401);
    }

    public function test_validate_voucher_returns_invalid_for_unknown_code(): void
    {
        $pupil = User::factory()->create(['role' => 'pupil']);

        $response = $this->actingAs($pupil)->postJson('/voucher/validate', [
            'voucher_code' => 'NONEXISTENT',
        ]);

        $response->assertStatus(422)->assertJson(['valid' => false]);
    }

    public function test_validate_voucher_returns_invalid_for_already_redeemed(): void
    {
        $pupil = User::factory()->create(['role' => 'pupil']);
        $voucher = $this->makeVoucher($pupil);
        $voucher->update(['is_redeemed' => true]);

        $response = $this->actingAs($pupil)->postJson('/voucher/validate', [
            'voucher_code' => $voucher->voucher_code,
        ]);

        $response->assertStatus(422)->assertJson(['valid' => false]);
    }

    public function test_validate_voucher_rejects_another_users_code(): void
    {
        $pupil = User::factory()->create(['role' => 'pupil']);
        $otherPupil = User::factory()->create(['role' => 'pupil']);
        $voucher = $this->makeVoucher($otherPupil);

        $response = $this->actingAs($pupil)->postJson('/voucher/validate', [
            'voucher_code' => $voucher->voucher_code,
        ]);

        $response->assertStatus(422)->assertJson(['valid' => false]);
    }

    // ── pack purchase ────────────────────────────────────────────────────────

    public function test_purchase_without_voucher_records_full_price(): void
    {
        $teacher = $this->makeVerifiedTeacher();
        $package = $this->makeActivePackage($teacher, 500_000);
        $pupil = User::factory()->create(['role' => 'pupil']);

        $response = $this->actingAs($pupil)->postJson('/pupil/packages/purchase', [
            'teacher_package_id' => $package->id,
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('pupil_packages', [
            'pupil_id' => $pupil->id,
            'teacher_package_id' => $package->id,
            'price_paid' => 500_000,
            'discount_voucher_id' => null,
        ]);
    }

    public function test_purchase_with_valid_voucher_applies_discount(): void
    {
        $teacher = $this->makeVerifiedTeacher();
        $package = $this->makeActivePackage($teacher, 500_000);
        $pupil = User::factory()->create(['role' => 'pupil']);
        $voucher = $this->makeVoucher($pupil, 25);

        $response = $this->actingAs($pupil)->postJson('/pupil/packages/purchase', [
            'teacher_package_id' => $package->id,
            'voucher_code' => $voucher->voucher_code,
        ]);

        $response->assertStatus(201);
        // 25% of 500_000 = 125_000 → price_paid = 375_000
        $this->assertDatabaseHas('pupil_packages', [
            'pupil_id' => $pupil->id,
            'price_paid' => 375_000,
            'discount_amount' => 125_000,
            'discount_voucher_id' => $voucher->id,
        ]);
        // Voucher must be marked redeemed
        $this->assertDatabaseHas('user_discount_vouchers', [
            'id' => $voucher->id,
            'is_redeemed' => true,
        ]);
    }

    public function test_purchase_rejects_already_redeemed_voucher(): void
    {
        $teacher = $this->makeVerifiedTeacher();
        $package = $this->makeActivePackage($teacher);
        $pupil = User::factory()->create(['role' => 'pupil']);
        $voucher = $this->makeVoucher($pupil);
        $voucher->update(['is_redeemed' => true]);

        $response = $this->actingAs($pupil)->postJson('/pupil/packages/purchase', [
            'teacher_package_id' => $package->id,
            'voucher_code' => $voucher->voucher_code,
        ]);

        $response->assertStatus(422);
        $this->assertDatabaseMissing('pupil_packages', [
            'pupil_id' => $pupil->id,
        ]);
    }

    public function test_purchase_rejects_another_users_voucher(): void
    {
        $teacher = $this->makeVerifiedTeacher();
        $package = $this->makeActivePackage($teacher);
        $pupil = User::factory()->create(['role' => 'pupil']);
        $otherPupil = User::factory()->create(['role' => 'pupil']);
        $voucher = $this->makeVoucher($otherPupil);

        $response = $this->actingAs($pupil)->postJson('/pupil/packages/purchase', [
            'teacher_package_id' => $package->id,
            'voucher_code' => $voucher->voucher_code,
        ]);

        $response->assertStatus(422);
        $this->assertDatabaseMissing('pupil_packages', [
            'pupil_id' => $pupil->id,
        ]);
        // Other user's voucher must remain unredeemed
        $this->assertDatabaseHas('user_discount_vouchers', [
            'id' => $voucher->id,
            'is_redeemed' => false,
        ]);
    }

    public function test_voucher_cannot_be_used_twice(): void
    {
        $teacher = $this->makeVerifiedTeacher();
        $package1 = $this->makeActivePackage($teacher, 300_000);
        $package2 = $this->makeActivePackage($teacher, 400_000);
        $pupil = User::factory()->create(['role' => 'pupil']);
        $voucher = $this->makeVoucher($pupil, 10);

        // First purchase — succeeds
        $this->actingAs($pupil)->postJson('/pupil/packages/purchase', [
            'teacher_package_id' => $package1->id,
            'voucher_code' => $voucher->voucher_code,
        ])->assertStatus(201);

        // Second purchase with same voucher — must fail
        $this->actingAs($pupil)->postJson('/pupil/packages/purchase', [
            'teacher_package_id' => $package2->id,
            'voucher_code' => $voucher->voucher_code,
        ])->assertStatus(422);

        // Only one pupil_package created
        $this->assertCount(1, PupilPackage::where('pupil_id', $pupil->id)->get());
    }
}

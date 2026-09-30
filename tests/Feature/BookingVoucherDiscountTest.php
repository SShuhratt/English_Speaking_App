<?php

namespace Tests\Feature;

use App\Models\TeacherAvailability;
use App\Models\TeacherProfile;
use App\Models\User;
use App\Models\UserDiscountVoucher;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BookingVoucherDiscountTest extends TestCase
{
    use RefreshDatabase;

    private User $pupil;

    private User $teacher;

    protected function setUp(): void
    {
        parent::setUp();

        $this->pupil = User::factory()->create(['role' => 'pupil']);
        $this->teacher = User::factory()->create(['role' => 'teacher']);
        TeacherProfile::factory()->create([
            'user_id' => $this->teacher->id,
            'is_verified' => true,
            'price' => 100000, // 100,000 UZS/hr
        ]);

        TeacherAvailability::create([
            'teacher_id' => $this->teacher->id,
            'type' => 'recurring',
            'day_of_week' => 'monday',
            'start_time' => '08:00:00',
            'end_time' => '22:00:00',
            'slot_duration' => 60,
        ]);
    }

    public function test_booking_with_valid_voucher_code_applies_discount_and_marks_voucher_redeemed(): void
    {
        $voucher = UserDiscountVoucher::create([
            'user_id' => $this->pupil->id,
            'voucher_code' => 'DISC-25-TEST',
            'discount_percent' => 25,
            'xp_spent' => 250,
            'is_redeemed' => false,
        ]);

        $startAt = Carbon::parse('next monday 09:00:00', 'Asia/Tashkent');
        $endAt = $startAt->copy()->addMinutes(60);

        $response = $this->actingAs($this->pupil)->postJson(route('bookings.store'), [
            'teacher_id' => $this->teacher->id,
            'pupil_id' => $this->pupil->id,
            'start_at' => $startAt->toIso8601String(),
            'end_at' => $endAt->toIso8601String(),
            'topics' => ['grammar', 'vocabulary'],
            'duration_minutes' => 60,
            'voucher_code' => 'disc-25-test', // test lowercase
        ]);

        $response->assertStatus(201);
        $appointment = $response->json('data');

        // Original price is 100,000 UZS for 60 min. 25% discount = 25,000 UZS. Final price = 75,000 UZS
        $this->assertEquals(25000, $appointment['discount_amount']);
        $this->assertEquals(75000, $appointment['price']);
        $this->assertEquals($voucher->id, $appointment['discount_voucher_id']);

        $voucher->refresh();
        $this->assertTrue($voucher->is_redeemed);
        $this->assertNotNull($voucher->redeemed_at);
        $this->assertEquals($appointment['id'], $voucher->appointment_id);
    }

    public function test_booking_with_valid_voucher_id_applies_discount(): void
    {
        $voucher = UserDiscountVoucher::create([
            'user_id' => $this->pupil->id,
            'voucher_code' => 'DISC-50-UUID',
            'discount_percent' => 50,
            'xp_spent' => 500,
            'is_redeemed' => false,
        ]);

        $startAt = Carbon::parse('next monday 11:00:00', 'Asia/Tashkent');
        $endAt = $startAt->copy()->addMinutes(60);

        $response = $this->actingAs($this->pupil)->postJson(route('bookings.store'), [
            'teacher_id' => $this->teacher->id,
            'pupil_id' => $this->pupil->id,
            'start_at' => $startAt->toIso8601String(),
            'end_at' => $endAt->toIso8601String(),
            'topics' => ['ielts_speaking'],
            'duration_minutes' => 60,
            'voucher_id' => $voucher->id,
        ]);

        $response->assertStatus(201);
        $appointment = $response->json('data');

        // 50% discount on 100,000 UZS = 50,000 UZS
        $this->assertEquals(50000, $appointment['discount_amount']);
        $this->assertEquals(50000, $appointment['price']);

        $voucher->refresh();
        $this->assertTrue($voucher->is_redeemed);
    }

    public function test_booking_with_invalid_or_already_used_voucher_code_fails_with_422(): void
    {
        UserDiscountVoucher::create([
            'user_id' => $this->pupil->id,
            'voucher_code' => 'ALREADY-USED-10',
            'discount_percent' => 10,
            'xp_spent' => 100,
            'is_redeemed' => true,
            'redeemed_at' => now()->subDay(),
        ]);

        $startAt = Carbon::parse('next monday 13:00:00', 'Asia/Tashkent');
        $endAt = $startAt->copy()->addMinutes(60);

        $response = $this->actingAs($this->pupil)->postJson(route('bookings.store'), [
            'teacher_id' => $this->teacher->id,
            'pupil_id' => $this->pupil->id,
            'start_at' => $startAt->toIso8601String(),
            'end_at' => $endAt->toIso8601String(),
            'topics' => ['conversation'],
            'duration_minutes' => 60,
            'voucher_code' => 'ALREADY-USED-10',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['voucher_code']);
    }

    public function test_booking_with_another_users_voucher_fails_with_422(): void
    {
        $otherUser = User::factory()->create(['role' => 'pupil']);
        UserDiscountVoucher::create([
            'user_id' => $otherUser->id,
            'voucher_code' => 'OTHER-USER-20',
            'discount_percent' => 20,
            'xp_spent' => 200,
            'is_redeemed' => false,
        ]);

        $startAt = Carbon::parse('next monday 15:00:00', 'Asia/Tashkent');
        $endAt = $startAt->copy()->addMinutes(60);

        $response = $this->actingAs($this->pupil)->postJson(route('bookings.store'), [
            'teacher_id' => $this->teacher->id,
            'pupil_id' => $this->pupil->id,
            'start_at' => $startAt->toIso8601String(),
            'end_at' => $endAt->toIso8601String(),
            'topics' => ['mock'],
            'duration_minutes' => 60,
            'voucher_code' => 'OTHER-USER-20',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['voucher_code']);
    }
}

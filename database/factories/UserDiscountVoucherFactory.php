<?php

namespace Database\Factories;

use App\Models\User;
use App\Models\UserDiscountVoucher;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<UserDiscountVoucher>
 */
class UserDiscountVoucherFactory extends Factory
{
    protected $model = UserDiscountVoucher::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'voucher_code' => strtoupper(fake()->bothify('CONVO-##-????')),
            'discount_percent' => fake()->randomElement([10, 15, 20, 25, 30]),
            'xp_spent' => fake()->numberBetween(100, 500),
            'is_redeemed' => false,
            'redeemed_at' => null,
            'appointment_id' => null,
        ];
    }

    public function redeemed(): static
    {
        return $this->state(fn () => [
            'is_redeemed' => true,
            'redeemed_at' => now(),
        ]);
    }
}

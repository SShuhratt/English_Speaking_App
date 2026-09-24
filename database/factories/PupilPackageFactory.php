<?php

namespace Database\Factories;

use App\Models\PupilPackage;
use App\Models\TeacherPackage;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PupilPackage>
 */
class PupilPackageFactory extends Factory
{
    protected $model = PupilPackage::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $minutes = 300; // 5 hours

        return [
            'pupil_id' => User::factory(),
            'teacher_id' => User::factory(),
            'teacher_package_id' => TeacherPackage::factory(),
            'package_title' => '5 Hours Conversation Pack',
            'total_minutes' => $minutes,
            'remaining_minutes' => $minutes,
            'price_paid' => 450000,
            'payment_status' => 'paid',
            'payment_rejection_reason' => null,
            'status' => 'active',
        ];
    }

    public function verifying(): static
    {
        return $this->state(fn (array $attributes) => [
            'payment_status' => 'verifying',
            'status' => 'active',
        ]);
    }

    public function exhausted(): static
    {
        return $this->state(fn (array $attributes) => [
            'remaining_minutes' => 0,
            'status' => 'exhausted',
        ]);
    }
}

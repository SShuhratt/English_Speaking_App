<?php

namespace Database\Factories;

use App\Models\TeacherPackage;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<TeacherPackage>
 */
class TeacherPackageFactory extends Factory
{
    protected $model = TeacherPackage::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $hours = fake()->randomElement([5, 10, 15, 20]);
        $price = $hours * 90000; // 90 000 per hour (e.g. discounted from 100 000)

        return [
            'teacher_id' => User::factory(),
            'title' => "{$hours} Hours Conversation Pack",
            'total_hours' => $hours,
            'total_minutes' => $hours * 60,
            'price' => $price,
            'discount_percentage' => 10,
            'description' => fake()->sentence(),
            'is_active' => true,
        ];
    }
}

<?php

namespace Database\Factories;

use App\Models\TeacherProfile;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<TeacherProfile>
 */
class TeacherProfileFactory extends Factory
{
    protected $model = TeacherProfile::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory()->create(['role' => 'teacher'])->id,
            'age' => fake()->numberBetween(22, 55),
            'phone_number' => fake()->phoneNumber(),
            'overall_level' => fake()->randomElement(['B2', 'C1', 'C2']),
            'speaking_band' => fake()->randomElement([6.5, 7.0, 7.5, 8.0]),
            'experience_years' => fake()->numberBetween(1, 15),
            'headline' => fake()->sentence(5),
            'bio' => fake()->paragraph(),
            'price' => fake()->numberBetween(100000, 300000),
            'is_verified' => true,
            'country_code' => 'UZ',
            'city' => 'Tashkent',
        ];
    }

    public function unverified(): static
    {
        return $this->state(fn () => ['is_verified' => false]);
    }
}

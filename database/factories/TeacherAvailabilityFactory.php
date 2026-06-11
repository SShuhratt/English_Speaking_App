<?php

namespace Database\Factories;

use App\Models\TeacherAvailability;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<TeacherAvailability>
 */
class TeacherAvailabilityFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'teacher_id' => User::factory(),
            'type' => 'recurring',
            'day_of_week' => fake()->randomElement(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']),
            'start_time' => '09:00',
            'end_time' => '17:00',
            'slot_duration' => 30,
            'is_active' => true,
        ];
    }
}

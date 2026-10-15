<?php

namespace Tests\Feature;

use App\Models\TeacherProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class LandingPageCertifiedTeachersTest extends TestCase
{
    use RefreshDatabase;

    public function test_landing_page_shows_verified_teachers_sorted_by_speaking_band()
    {
        // 1. High band verified teacher (8.5)
        $teacherHigh = User::factory()->create([
            'role' => 'teacher',
            'full_name' => 'High Band Teacher',
        ]);
        TeacherProfile::factory()->create([
            'user_id' => $teacherHigh->id,
            'is_verified' => true,
            'speaking_band' => '8.5',
            'rating_cache' => 4.9,
        ]);

        // 2. Medium band verified teacher (7.5)
        $teacherMedium = User::factory()->create([
            'role' => 'teacher',
            'full_name' => 'Medium Band Teacher',
        ]);
        TeacherProfile::factory()->create([
            'user_id' => $teacherMedium->id,
            'is_verified' => true,
            'speaking_band' => '7.5',
            'rating_cache' => 4.8,
        ]);

        // 3. Highest band verified teacher (9.0)
        $teacherHighest = User::factory()->create([
            'role' => 'teacher',
            'full_name' => 'Top Band Teacher',
        ]);
        TeacherProfile::factory()->create([
            'user_id' => $teacherHighest->id,
            'is_verified' => true,
            'speaking_band' => '9.0',
            'rating_cache' => 5.0,
        ]);

        // 4. Unverified teacher with high band (should be excluded)
        $unverifiedTeacher = User::factory()->create([
            'role' => 'teacher',
            'full_name' => 'Unverified Teacher',
        ]);
        TeacherProfile::factory()->create([
            'user_id' => $unverifiedTeacher->id,
            'is_verified' => false,
            'speaking_band' => '9.0',
        ]);

        // 5. Pupil user (should be excluded)
        User::factory()->create([
            'role' => 'pupil',
            'full_name' => 'Pupil User',
        ]);

        $response = $this->get(route('home'));

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('welcome')
            ->has('certifiedTeachers', 3)
            ->where('certifiedTeachers.0.id', $teacherHighest->id)
            ->where('certifiedTeachers.0.speaking_band', '9.0')
            ->where('certifiedTeachers.1.id', $teacherHigh->id)
            ->where('certifiedTeachers.1.speaking_band', '8.5')
            ->where('certifiedTeachers.2.id', $teacherMedium->id)
            ->where('certifiedTeachers.2.speaking_band', '7.5')
        );
    }
}

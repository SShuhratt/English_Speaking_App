<?php

namespace Tests\Feature;

use App\Models\TeacherProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AdminTeacherDetailsTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_teachers_list_contains_phone_number_and_telegram_info(): void
    {
        $admin = User::factory()->create([
            'role' => 'admin',
            'email_verified_at' => now(),
        ]);

        $teacher = User::factory()->create([
            'role' => 'teacher',
            'phone_number' => '+998901234567',
            'telegram_username' => 'superteacher',
            'telegram_chat_id' => '123456789',
            'email_verified_at' => now(),
        ]);

        TeacherProfile::factory()->create([
            'user_id' => $teacher->id,
            'is_verified' => true,
        ]);

        $response = $this->actingAs($admin)->get(route('admin.teachers'));

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('admin/teachers')
            ->has('teachers.data', fn (Assert $teachers) => $teachers
                ->where('0.id', $teacher->id)
                ->where('0.phone_number', '+998901234567')
                ->where('0.telegram_username', 'superteacher')
                ->where('0.telegram_chat_id', '123456789')
                ->etc()
            )
        );
    }

    public function test_admin_viewing_teacher_profile_has_all_teacher_data(): void
    {
        $admin = User::factory()->create([
            'role' => 'admin',
            'email_verified_at' => now(),
        ]);

        $teacher = User::factory()->create([
            'role' => 'teacher',
            'phone_number' => '+998907654321',
            'telegram_username' => 'adminvisibleteacher',
            'telegram_chat_id' => '987654321',
            'gender' => 'female',
            'email_verified_at' => now(),
        ]);

        TeacherProfile::factory()->create([
            'user_id' => $teacher->id,
            'is_verified' => true,
        ]);

        $response = $this->actingAs($admin)->get(route('admin.teachers.show', ['id' => $teacher->id]));

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('pupil/teacher-profile')
            ->where('teacher.id', $teacher->id)
            ->where('teacher.phone_number', '+998907654321')
            ->where('teacher.telegram_username', 'adminvisibleteacher')
            ->where('teacher.telegram_chat_id', '987654321')
            ->where('teacher.gender', 'female')
        );
    }

    public function test_pupil_viewing_teacher_profile_does_not_receive_sensitive_contact_info(): void
    {
        $pupil = User::factory()->create([
            'role' => 'pupil',
            'email_verified_at' => now(),
        ]);

        $teacher = User::factory()->create([
            'role' => 'teacher',
            'phone_number' => '+998909999999',
            'telegram_chat_id' => '555555555',
            'email_verified_at' => now(),
        ]);

        TeacherProfile::factory()->create([
            'user_id' => $teacher->id,
            'is_verified' => true,
        ]);

        $response = $this->actingAs($pupil)->get(route('pupil.teachers.show', ['id' => $teacher->id]));

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('pupil/teacher-profile')
            ->where('teacher.id', $teacher->id)
            ->missing('teacher.phone_number')
            ->missing('teacher.telegram_chat_id')
        );
    }
}

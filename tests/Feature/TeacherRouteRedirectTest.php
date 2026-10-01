<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TeacherRouteRedirectTest extends TestCase
{
    use RefreshDatabase;

    public function test_pupil_accessing_teachers_is_redirected_to_pupil_teachers_index(): void
    {
        $pupil = User::factory()->create([
            'role' => 'pupil',
            'email_verified_at' => now(),
        ]);

        $response = $this->actingAs($pupil)->get('/teachers');

        $response->assertRedirect(route('pupil.teachers.index'));
    }

    public function test_pupil_accessing_teacher_id_is_redirected_to_pupil_teachers_show(): void
    {
        $pupil = User::factory()->create([
            'role' => 'pupil',
            'email_verified_at' => now(),
        ]);

        $teacher = User::factory()->create([
            'role' => 'teacher',
            'email_verified_at' => now(),
        ]);

        $response = $this->actingAs($pupil)->get("/teachers/{$teacher->id}");

        $response->assertRedirect(route('pupil.teachers.show', ['id' => $teacher->id]));
    }

    public function test_teacher_accessing_teacher_id_is_redirected_to_teacher_teachers_show(): void
    {
        $teacher1 = User::factory()->create([
            'role' => 'teacher',
            'email_verified_at' => now(),
        ]);

        $teacher2 = User::factory()->create([
            'role' => 'teacher',
            'email_verified_at' => now(),
        ]);

        $response = $this->actingAs($teacher1)->get("/teachers/{$teacher2->id}");

        $response->assertRedirect(route('teacher.teachers.show', ['id' => $teacher2->id]));
    }

    public function test_admin_accessing_teacher_id_is_redirected_to_admin_teachers_show(): void
    {
        $admin = User::factory()->create([
            'role' => 'admin',
            'email_verified_at' => now(),
        ]);

        $teacher = User::factory()->create([
            'role' => 'teacher',
            'email_verified_at' => now(),
        ]);

        $response = $this->actingAs($admin)->get("/teachers/{$teacher->id}");

        $response->assertRedirect(route('admin.teachers.show', ['id' => $teacher->id]));
    }
}

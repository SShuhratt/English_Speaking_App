<?php

namespace Tests\Feature;

use App\Models\TeacherProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminUserManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_verify_teacher_and_all_certificates(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $teacher = User::factory()->create(['role' => 'teacher']);
        TeacherProfile::create([
            'user_id' => $teacher->id,
            'is_verified' => false,
            'certificates' => json_encode([
                ['title' => 'IELTS', 'status' => 'pending'],
                ['title' => 'CEFR', 'status' => 'pending'],
            ]),
        ]);

        $response = $this->actingAs($admin)->post("/admin/teachers/{$teacher->id}/verify", [
            'verified' => true,
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('teacher_profiles', [
            'user_id' => $teacher->id,
            'is_verified' => true,
        ]);

        $profile = TeacherProfile::where('user_id', $teacher->id)->first();
        $certs = is_string($profile->certificates) ? json_decode($profile->certificates, true) : $profile->certificates;

        $this->assertEquals('verified', $certs[0]['status']);
        $this->assertEquals('verified', $certs[1]['status']);
    }

    public function test_admin_unverifying_teacher_changes_certificates_to_under_review(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $teacher = User::factory()->create(['role' => 'teacher']);
        TeacherProfile::create([
            'user_id' => $teacher->id,
            'is_verified' => true,
            'certificates' => json_encode([
                ['title' => 'IELTS', 'status' => 'verified'],
            ]),
        ]);

        $response = $this->actingAs($admin)->post("/admin/teachers/{$teacher->id}/verify", [
            'verified' => false,
        ]);

        $response->assertRedirect();
        $profile = TeacherProfile::where('user_id', $teacher->id)->first();
        $certs = is_string($profile->certificates) ? json_decode($profile->certificates, true) : $profile->certificates;

        $this->assertFalse((bool) $profile->is_verified);
        $this->assertEquals('under_review', $certs[0]['status']);
    }

    public function test_admin_can_verify_single_certificate(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $teacher = User::factory()->create(['role' => 'teacher']);
        TeacherProfile::create([
            'user_id' => $teacher->id,
            'is_verified' => true,
            'certificates' => json_encode([
                ['title' => 'IELTS', 'status' => 'verified'],
                ['title' => 'New Cert', 'status' => 'pending'],
            ]),
        ]);

        $response = $this->actingAs($admin)->post("/admin/teachers/{$teacher->id}/certificates/1/verify", [
            'status' => 'verified',
        ]);

        $response->assertRedirect();
        $profile = TeacherProfile::where('user_id', $teacher->id)->first();
        $certs = is_string($profile->certificates) ? json_decode($profile->certificates, true) : $profile->certificates;

        $this->assertEquals('verified', $certs[1]['status']);
    }

    public function test_admin_can_delete_user_and_cascade_related_data(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $teacher = User::factory()->create(['role' => 'teacher']);
        TeacherProfile::create(['user_id' => $teacher->id]);

        $otherTeacher = User::factory()->create(['role' => 'teacher']);
        TeacherProfile::create(['user_id' => $otherTeacher->id]);

        $response = $this->actingAs($admin)->delete("/admin/users/{$teacher->id}");

        $response->assertRedirect();
        $this->assertDatabaseMissing('users', ['id' => $teacher->id]);
        $this->assertDatabaseMissing('teacher_profiles', ['user_id' => $teacher->id]);

        // Ensure other teacher is unharmed
        $this->assertDatabaseHas('users', ['id' => $otherTeacher->id]);
        $this->assertDatabaseHas('teacher_profiles', ['user_id' => $otherTeacher->id]);
    }

    public function test_admin_cannot_delete_self(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $response = $this->actingAs($admin)->delete("/admin/users/{$admin->id}");

        $response->assertStatus(403);
        $this->assertDatabaseHas('users', ['id' => $admin->id]);
    }

    public function test_non_admin_cannot_delete_users(): void
    {
        $pupil = User::factory()->create(['role' => 'pupil']);
        $teacher = User::factory()->create(['role' => 'teacher']);

        $response = $this->actingAs($pupil)->delete("/admin/users/{$teacher->id}");

        $response->assertStatus(403);
        $this->assertDatabaseHas('users', ['id' => $teacher->id]);
    }
}

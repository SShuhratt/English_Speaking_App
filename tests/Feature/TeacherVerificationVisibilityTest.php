<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\Conversation;
use App\Models\TeacherProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class TeacherVerificationVisibilityTest extends TestCase
{
    use RefreshDatabase;

    public function test_unverified_teachers_are_not_shown_in_pupil_teachers_list()
    {
        $verifiedTeacher = User::factory()->create(['role' => 'teacher']);
        TeacherProfile::create([
            'user_id' => $verifiedTeacher->id,
            'is_verified' => true,
        ]);

        $unverifiedTeacher = User::factory()->create(['role' => 'teacher']);
        TeacherProfile::create([
            'user_id' => $unverifiedTeacher->id,
            'is_verified' => false,
        ]);

        $pupil = User::factory()->create(['role' => 'pupil']);

        $response = $this->actingAs($pupil)->get(route('pupil.teachers.index'));
        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('pupil/teachers')
            ->has('teachers.data', 1)
            ->where('teachers.data.0.id', $verifiedTeacher->id)
        );
    }

    public function test_unverified_teachers_are_not_shown_in_colleague_teacher_directory()
    {
        $colleague = User::factory()->create(['role' => 'teacher']);
        TeacherProfile::create([
            'user_id' => $colleague->id,
            'is_verified' => true,
        ]);

        $unverifiedTeacher = User::factory()->create(['role' => 'teacher']);
        TeacherProfile::create([
            'user_id' => $unverifiedTeacher->id,
            'is_verified' => false,
        ]);

        $response = $this->actingAs($colleague)->get('/teacher/teachers');
        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('teacher/teachers')
            ->has('teachers.data', 1)
            ->where('teachers.data.0.id', $colleague->id)
        );
    }

    public function test_unverified_teacher_profile_returns_404_for_pupil_and_guest()
    {
        $unverifiedTeacher = User::factory()->create(['role' => 'teacher']);
        TeacherProfile::create([
            'user_id' => $unverifiedTeacher->id,
            'is_verified' => false,
        ]);

        $pupil = User::factory()->create(['role' => 'pupil']);

        $this->actingAs($pupil)->get("/pupil/teachers/{$unverifiedTeacher->id}")
            ->assertNotFound();

        $this->get("/pupil/teachers/{$unverifiedTeacher->id}")
            ->assertNotFound();

        $this->actingAs($pupil)->get("/profile/{$unverifiedTeacher->id}")
            ->assertNotFound();
    }

    public function test_unverified_teacher_can_view_their_own_profile()
    {
        $unverifiedTeacher = User::factory()->create(['role' => 'teacher']);
        TeacherProfile::create([
            'user_id' => $unverifiedTeacher->id,
            'is_verified' => false,
        ]);

        $this->actingAs($unverifiedTeacher)->get("/teacher/teachers/{$unverifiedTeacher->id}")
            ->assertOk();

        $this->actingAs($unverifiedTeacher)->get("/profile/{$unverifiedTeacher->id}")
            ->assertOk();
    }

    public function test_admin_can_view_unverified_teacher_profile()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $unverifiedTeacher = User::factory()->create(['role' => 'teacher']);
        TeacherProfile::create([
            'user_id' => $unverifiedTeacher->id,
            'is_verified' => false,
        ]);

        $this->actingAs($admin)->get("/admin/teachers/{$unverifiedTeacher->id}")
            ->assertOk();

        $this->actingAs($admin)->get("/profile/{$unverifiedTeacher->id}")
            ->assertOk();
    }

    public function test_unverified_teacher_booking_page_redirects()
    {
        $unverifiedTeacher = User::factory()->create(['role' => 'teacher']);
        TeacherProfile::create([
            'user_id' => $unverifiedTeacher->id,
            'is_verified' => false,
        ]);

        $pupil = User::factory()->create(['role' => 'pupil']);

        $this->actingAs($pupil)->get("/pupil/booking?teacher_id={$unverifiedTeacher->id}")
            ->assertRedirect(route('pupil.teachers.index'));
    }

    public function test_teacher_dashboard_and_profile_include_conversation_stats()
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        TeacherProfile::create([
            'user_id' => $teacher->id,
            'is_verified' => true,
        ]);

        $pupil = User::factory()->create(['role' => 'pupil']);

        // Create completed appointment of 45 minutes
        Appointment::create([
            'teacher_id' => $teacher->id,
            'pupil_id' => $pupil->id,
            'start_at' => now()->subHours(3),
            'end_at' => now()->subHours(2)->subMinutes(15),
            'duration_minutes' => 45,
            'status' => 'completed',
        ]);

        // Create a standalone conversation of 30 minutes
        Conversation::create([
            'teacher_id' => $teacher->id,
            'pupil_id' => $pupil->id,
            'started_at' => now()->subDays(1),
            'ended_at' => now()->subDays(1)->addMinutes(30),
        ]);

        // Check TeacherProfile::getConversationStats directly
        $stats = TeacherProfile::getConversationStats($teacher->id);
        $this->assertEquals(2, $stats['total_conversations']);
        $this->assertEquals(75, $stats['total_minutes']);
        $this->assertEquals('1h 15m', $stats['total_time_formatted']);

        // Check Teacher Dashboard stats
        $response = $this->actingAs($teacher)->get(route('dashboard'));
        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('dashboard')
            ->where('stats.completed_conversations', 2)
            ->where('stats.speaking_time', '1h 15m')
        );

        // Check Pupil Teacher Profile view conversationStats
        $profileResponse = $this->actingAs($pupil)->get("/pupil/teachers/{$teacher->id}");
        $profileResponse->assertOk();
        $profileResponse->assertInertia(fn (Assert $page) => $page
            ->component('pupil/teacher-profile')
            ->where('conversationStats.total_conversations', 2)
            ->where('conversationStats.total_time_formatted', '1h 15m')
        );
    }

    public function test_pupil_can_view_verified_certificate_file_url_but_not_unverified()
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        TeacherProfile::create([
            'user_id' => $teacher->id,
            'is_verified' => true,
            'certificates' => [
                [
                    'type' => 'ielts',
                    'title' => 'IELTS Academic',
                    'status' => 'verified',
                    'file_url' => 'https://example.com/storage/certificates/sample.pdf',
                    'file_name' => 'sample.pdf',
                    'overall' => '8.0',
                ],
                [
                    'type' => 'cefr',
                    'title' => 'CEFR C1',
                    'status' => 'pending',
                    'file_url' => 'https://example.com/storage/certificates/pending.pdf',
                    'file_name' => 'pending.pdf',
                ],
            ],
        ]);

        $pupil = User::factory()->create(['role' => 'pupil']);

        $response = $this->actingAs($pupil)->get("/pupil/teachers/{$teacher->id}");
        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('pupil/teacher-profile')
            ->has('teacher.teacher_profile.certificates', 1)
            ->where('teacher.teacher_profile.certificates.0.title', 'IELTS Academic')
            ->where('teacher.teacher_profile.certificates.0.file_url', 'https://example.com/storage/certificates/sample.pdf')
        );
    }
}

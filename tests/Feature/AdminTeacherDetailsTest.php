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

    public function test_admin_teachers_list_passes_filter_counts_and_all_profile_fields(): void
    {
        $admin = User::factory()->create([
            'role' => 'admin',
            'email_verified_at' => now(),
        ]);

        $teacher = User::factory()->create([
            'role' => 'teacher',
            'phone_number' => '+998901234567',
            'email_verified_at' => now(),
        ]);

        TeacherProfile::factory()->create([
            'user_id' => $teacher->id,
            'is_verified' => true,
            'intro_video_url' => 'https://storage.googleapis.com/test-bucket/intro.mp4',
            'labels' => ['ielts', 'freestyle_talk'],
            'headline' => 'Experienced IELTS 8.5 Tutor',
            'bio' => 'Over 7 years teaching English.',
            'experience_years' => 7,
            'workplace' => 'International Language Academy',
            'age' => 29,
            'country_code' => 'UZ',
            'city' => 'Tashkent',
            'certificates' => [
                [
                    'type' => 'ielts',
                    'title' => 'IELTS Academic',
                    'overall' => '8.5',
                    'status' => 'verified',
                ],
            ],
        ]);

        $response = $this->actingAs($admin)->get(route('admin.teachers'));

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('admin/teachers')
            ->has('filterCounts')
            ->where('filterCounts.all', 1)
            ->where('filterCounts.verified', 1)
            ->where('filterCounts.unverified', 0)
            ->has('teachers.data', fn (Assert $teachers) => $teachers
                ->where('0.id', $teacher->id)
                ->where('0.teacher_profile.intro_video_url', 'https://storage.googleapis.com/test-bucket/intro.mp4')
                ->where('0.teacher_profile.labels', ['ielts', 'freestyle_talk'])
                ->where('0.teacher_profile.headline', 'Experienced IELTS 8.5 Tutor')
                ->where('0.teacher_profile.bio', 'Over 7 years teaching English.')
                ->where('0.teacher_profile.experience_years', 7)
                ->where('0.teacher_profile.workplace', 'International Language Academy')
                ->where('0.teacher_profile.age', 29)
                ->where('0.teacher_profile.country_code', 'UZ')
                ->where('0.teacher_profile.city', 'Tashkent')
                ->etc()
            )
        );
    }

    public function test_admin_teachers_list_displays_all_teachers_including_different_roles_with_profile(): void
    {
        $admin = User::factory()->create([
            'role' => 'admin',
            'email_verified_at' => now(),
        ]);

        // Teacher 1: verified teacher
        $t1 = User::factory()->create(['role' => 'teacher']);
        TeacherProfile::factory()->create(['user_id' => $t1->id, 'is_verified' => true]);

        // Teacher 2: unverified teacher with profile
        $t2 = User::factory()->create(['role' => 'teacher']);
        TeacherProfile::factory()->create(['user_id' => $t2->id, 'is_verified' => false]);

        // Teacher 3: teacher role with no profile yet
        $t3 = User::factory()->create(['role' => 'teacher']);

        // Teacher 4: admin role but has a teacher profile
        $t4 = User::factory()->create(['role' => 'admin']);
        TeacherProfile::factory()->create(['user_id' => $t4->id, 'is_verified' => false]);

        // Pupil (should not be included)
        User::factory()->create(['role' => 'pupil']);

        // Check 'all' filter: all 4 must appear
        $resAll = $this->actingAs($admin)->get('/admin/teachers?status=all');
        $resAll->assertOk();
        $resAll->assertInertia(fn (Assert $page) => $page
            ->component('admin/teachers')
            ->where('filterCounts.all', 4)
            ->where('filterCounts.verified', 1)
            ->where('filterCounts.unverified', 3)
            ->has('teachers.data', 4)
        );

        // Check 'verified' filter: only t1
        $resVerified = $this->actingAs($admin)->get('/admin/teachers?status=verified');
        $resVerified->assertOk();
        $resVerified->assertInertia(fn (Assert $page) => $page
            ->has('teachers.data', 1)
            ->where('teachers.data.0.id', $t1->id)
        );

        // Check 'unverified' filter: t2, t3, t4
        $resUnverified = $this->actingAs($admin)->get('/admin/teachers?status=unverified');
        $resUnverified->assertOk();
        $resUnverified->assertInertia(fn (Assert $page) => $page
            ->has('teachers.data', 3)
        );
    }

    public function test_admin_teachers_list_paginates_and_supports_dynamic_per_page(): void
    {
        $admin = User::factory()->create(['role' => 'admin', 'email_verified_at' => now()]);

        // Create 35 teachers
        User::factory()->count(35)->create([
            'role' => 'teacher',
            'email_verified_at' => now(),
        ]);

        // 1. Default pagination (15 per page)
        $resDefault = $this->actingAs($admin)->get('/admin/teachers');
        $resDefault->assertOk();
        $resDefault->assertInertia(fn (Assert $page) => $page
            ->component('admin/teachers')
            ->where('perPage', '15')
            ->has('teachers.data', 15)
            ->where('teachers.total', 35)
            ->where('teachers.last_page', 3)
            ->where('teachers.current_page', 1)
        );

        // 2. Page 2 request
        $resPage2 = $this->actingAs($admin)->get('/admin/teachers?page=2');
        $resPage2->assertOk();
        $resPage2->assertInertia(fn (Assert $page) => $page
            ->has('teachers.data', 15)
            ->where('teachers.current_page', 2)
        );

        // 3. Page 3 request (remaining 5)
        $resPage3 = $this->actingAs($admin)->get('/admin/teachers?page=3');
        $resPage3->assertOk();
        $resPage3->assertInertia(fn (Assert $page) => $page
            ->has('teachers.data', 5)
            ->where('teachers.current_page', 3)
        );

        // 4. Per page = all (should fetch all 35 on page 1)
        $resAll = $this->actingAs($admin)->get('/admin/teachers?per_page=all');
        $resAll->assertOk();
        $resAll->assertInertia(fn (Assert $page) => $page
            ->where('perPage', 'all')
            ->has('teachers.data', 35)
            ->where('teachers.total', 35)
            ->where('teachers.current_page', 1)
        );

        // 5. Per page = 30
        $res30 = $this->actingAs($admin)->get('/admin/teachers?per_page=30');
        $res30->assertOk();
        $res30->assertInertia(fn (Assert $page) => $page
            ->where('perPage', '30')
            ->has('teachers.data', 30)
            ->where('teachers.last_page', 2)
        );
    }

    public function test_admin_pupils_list_paginates_and_supports_dynamic_per_page(): void
    {
        $admin = User::factory()->create(['role' => 'admin', 'email_verified_at' => now()]);

        // Create 20 pupils
        User::factory()->count(20)->create([
            'role' => 'pupil',
            'email_verified_at' => now(),
        ]);

        // Default: 15 per page
        $resDefault = $this->actingAs($admin)->get('/admin/pupils');
        $resDefault->assertOk();
        $resDefault->assertInertia(fn (Assert $page) => $page
            ->component('admin/pupils')
            ->where('perPage', '15')
            ->has('pupils.data', 15)
            ->where('pupils.total', 20)
        );

        // Per page = all (should fetch all 20)
        $resAll = $this->actingAs($admin)->get('/admin/pupils?per_page=all');
        $resAll->assertOk();
        $resAll->assertInertia(fn (Assert $page) => $page
            ->where('perPage', 'all')
            ->has('pupils.data', 20)
            ->where('pupils.total', 20)
        );
    }
}

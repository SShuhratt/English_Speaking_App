<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProfileViewTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_users_can_view_teacher_profile()
    {
        $viewer = User::factory()->create(['role' => 'pupil']);
        $teacher = User::factory()->create(['role' => 'teacher']);

        $teacher->teacherProfile()->create([
            'is_verified' => true,
            'age' => 30,
            'price' => 50000,
            'experience_years' => '5 years',
            'overall_level' => 'IELTS 8.0',
        ]);

        $this->actingAs($viewer);

        $response = $this->get(route('profile.show', $teacher->id));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('pupil/teacher-profile')
            ->has('teacher')
            ->where('teacher.id', $teacher->id)
        );
    }

    public function test_authenticated_users_can_view_pupil_profile()
    {
        $viewer = User::factory()->create(['role' => 'teacher']);
        $pupil = User::factory()->create(['role' => 'pupil']);

        $pupil->pupilProfile()->create([
            'age' => 20,
            'level' => 'pre-intermediate',
            'headline' => 'IELTS Aspirant',
            'bio' => 'Looking for speaking partners.',
            'target_overall_band' => 7.5,
            'target_speaking_band' => 8.0,
            'labels' => ['ielts_prep'],
        ]);

        $this->actingAs($viewer);

        $response = $this->get(route('profile.show', $pupil->id));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('pupil/profile-view')
            ->has('pupil')
            ->where('pupil.id', $pupil->id)
        );
    }

    public function test_teacher_can_update_price_to_zero()
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        $teacher->teacherProfile()->create([
            'price' => 50000,
        ]);

        $this->actingAs($teacher);

        $response = $this->patch('/settings/profile', [
            'name' => $teacher->name,
            'email' => $teacher->email,
            'price' => '0',
            'experience_years' => '3',
            'overall_level' => 'C1',
        ]);

        $response->assertRedirect();

        $teacher->refresh();
        $this->assertEquals(0, $teacher->teacherProfile->price);
    }

    public function test_teacher_can_update_price_to_null()
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        $teacher->teacherProfile()->create([
            'price' => 50000,
        ]);

        $this->actingAs($teacher);

        $response = $this->patch('/settings/profile', [
            'name' => $teacher->name,
            'email' => $teacher->email,
            'price' => '', // optional empty price
            'experience_years' => '3',
            'overall_level' => 'C1',
        ]);

        $response->assertRedirect();

        $teacher->refresh();
        $this->assertNull($teacher->teacherProfile->price);
    }

    public function test_pupils_only_see_verified_teacher_certificates_with_document_urls()
    {
        $viewer = User::factory()->create(['role' => 'pupil']);
        $teacher = User::factory()->create(['role' => 'teacher']);

        $teacher->teacherProfile()->create([
            'is_verified' => true,
            'age' => 28,
            'price' => 70000,
            'certificates' => [
                [
                    'type' => 'ielts',
                    'title' => 'IELTS (Academic / General)',
                    'overall' => '8.0',
                    'speaking' => '8.5',
                    'file_url' => 'https://example.com/storage/certificates/ielts_cert.pdf',
                    'file_name' => 'ielts_cert.pdf',
                    'status' => 'verified',
                ],
                [
                    'type' => 'testdaf',
                    'title' => 'TestDaF',
                    'overall' => 'TDN 4',
                    'sub_scores' => [
                        'leseverstehen' => 'TDN 4',
                        'horverstehen' => 'TDN 5',
                    ],
                    'file_url' => 'https://example.com/storage/certificates/testdaf.pdf',
                    'file_name' => 'testdaf.pdf',
                    'status' => 'pending',
                ],
            ],
        ]);

        $this->actingAs($viewer);

        $response = $this->get(route('profile.show', $teacher->id));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('pupil/teacher-profile')
            ->has('teacher.teacher_profile.certificates', 1)
            ->where('teacher.teacher_profile.certificates.0.type', 'ielts')
            ->where('teacher.teacher_profile.certificates.0.status', 'verified')
            ->where('teacher.teacher_profile.certificates.0.file_url', null)
            ->where('teacher.teacher_profile.certificates.0.file_name', 'ielts_cert.pdf')
        );
    }

    public function test_teacher_can_view_all_their_own_certificates_including_pending()
    {
        $teacher = User::factory()->create(['role' => 'teacher']);

        $teacher->teacherProfile()->create([
            'age' => 28,
            'price' => 70000,
            'certificates' => [
                [
                    'type' => 'ielts',
                    'title' => 'IELTS (Academic / General)',
                    'overall' => '8.0',
                    'file_url' => 'https://example.com/storage/certificates/cert1.pdf',
                    'file_name' => 'cert1.pdf',
                    'status' => 'verified',
                ],
                [
                    'type' => 'topik2',
                    'title' => 'TOPIK II',
                    'overall' => 'Level 5',
                    'file_url' => 'https://example.com/storage/certificates/cert2.pdf',
                    'file_name' => 'cert2.pdf',
                    'status' => 'pending',
                ],
            ],
        ]);

        $this->actingAs($teacher);

        $response = $this->get(route('profile.show', $teacher->id));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('pupil/teacher-profile')
            ->has('teacher.teacher_profile.certificates', 2)
        );
    }

    public function test_multi_language_certificates_persist_custom_language_and_sub_scores()
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        $teacher->teacherProfile()->create([
            'price' => 60000,
        ]);

        $this->actingAs($teacher);

        $response = $this->patch('/settings/profile', [
            'name' => $teacher->name,
            'email' => $teacher->email,
            'certificates' => [
                [
                    'type' => 'testdaf',
                    'custom_language' => 'German',
                    'overall' => 'TDN 4',
                    'leseverstehen' => 'TDN 4',
                    'horverstehen' => 'TDN 5',
                    'schriftlicher_ausdruck' => 'TDN 4',
                    'mundlicher_ausdruck' => 'TDN 4',
                ],
            ],
        ]);

        $response->assertRedirect();

        $teacher->refresh();
        $savedCerts = $teacher->teacherProfile->certificates;
        $this->assertIsArray($savedCerts);
        $this->assertCount(1, $savedCerts);
        $this->assertSame('testdaf', $savedCerts[0]['type']);
        $this->assertSame('German', $savedCerts[0]['custom_language']);
        $this->assertSame('TDN 4', $savedCerts[0]['overall']);
        $this->assertSame('TDN 4', $savedCerts[0]['sub_scores']['leseverstehen']);
        $this->assertSame('TDN 5', $savedCerts[0]['sub_scores']['horverstehen']);
    }
}

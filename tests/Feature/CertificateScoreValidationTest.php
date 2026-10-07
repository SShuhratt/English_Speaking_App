<?php

namespace Tests\Feature;

use App\Models\TeacherProfile;
use App\Models\User;
use App\Services\CertificateValidationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CertificateScoreValidationTest extends TestCase
{
    use RefreshDatabase;

    public function test_teacher_registration_rejects_ielts_score_exceeding_max_band(): void
    {
        $response = $this->post(route('register.store'), [
            'name' => 'John Teacher',
            'email' => 'john.ielts.invalid@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'role' => 'teacher',
            'age' => 29,
            'phone_number' => '+998901234567',
            'overall_level' => 'IELTS 10.0',
            'speaking_band' => 8.5,
            'certificates' => [
                [
                    'type' => 'ielts',
                    'title' => 'IELTS Academic',
                    'overall' => '9.5',
                    'listening' => '9.0',
                    'reading' => '9.0',
                    'writing' => '8.0',
                    'speaking' => '8.5',
                ],
            ],
        ]);

        $response->assertSessionHasErrors(['certificates.0.overall']);
        $this->assertDatabaseMissing('users', ['email' => 'john.ielts.invalid@example.com']);
    }

    public function test_teacher_registration_rejects_ielts_score_violating_step_increment(): void
    {
        $response = $this->post(route('register.store'), [
            'name' => 'Step Teacher',
            'email' => 'step.invalid@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'role' => 'teacher',
            'age' => 31,
            'phone_number' => '+998901234568',
            'overall_level' => 'IELTS 7.3',
            'speaking_band' => 7.0,
            'certificates' => [
                [
                    'type' => 'ielts',
                    'title' => 'IELTS Academic',
                    'overall' => '7.3',
                ],
            ],
        ]);

        $response->assertSessionHasErrors(['certificates.0.overall']);
        $this->assertDatabaseMissing('users', ['email' => 'step.invalid@example.com']);
    }

    public function test_teacher_registration_rejects_toefl_sub_skill_exceeding_max_score(): void
    {
        $response = $this->post(route('register.store'), [
            'name' => 'Toefl Teacher',
            'email' => 'toefl.invalid@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'role' => 'teacher',
            'age' => 27,
            'phone_number' => '+998901234569',
            'overall_level' => 'TOEFL 110',
            'speaking_band' => 8.0,
            'certificates' => [
                [
                    'type' => 'toefl',
                    'title' => 'TOEFL iBT',
                    'overall' => '105',
                    'reading' => '35', // max is 30
                    'listening' => '25',
                    'speaking' => '25',
                    'writing' => '25',
                ],
            ],
        ]);

        $response->assertSessionHasErrors(['certificates.0.reading']);
        $this->assertDatabaseMissing('users', ['email' => 'toefl.invalid@example.com']);
    }

    public function test_teacher_registration_accepts_valid_certificate_scores(): void
    {
        $response = $this->post(route('register.store'), [
            'name' => 'Valid Teacher',
            'email' => 'valid.teacher@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'role' => 'teacher',
            'age' => 30,
            'phone_number' => '+998901234570',
            'overall_level' => 'IELTS 8.5',
            'speaking_band' => 8.5,
            'certificates' => [
                [
                    'type' => 'ielts',
                    'title' => 'IELTS Academic',
                    'overall' => '8.5',
                    'listening' => '9.0',
                    'reading' => '8.5',
                    'writing' => '8.0',
                    'speaking' => '8.5',
                ],
            ],
        ]);

        $response->assertSessionHasNoErrors();
        $this->assertDatabaseHas('users', ['email' => 'valid.teacher@example.com']);
    }

    public function test_profile_update_rejects_invalid_certificate_scores(): void
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        TeacherProfile::create([
            'user_id' => $teacher->id,
            'certificates' => [],
        ]);

        $response = $this->actingAs($teacher)->patch(route('profile.update'), [
            'name' => 'Updated Teacher',
            'email' => $teacher->email,
            'certificates' => [
                [
                    'type' => 'ielts',
                    'title' => 'IELTS',
                    'overall' => '9.5', // invalid
                ],
            ],
        ]);

        $response->assertSessionHasErrors(['certificates.0.overall']);
    }

    public function test_admin_update_certificates_rejects_invalid_score(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $teacher = User::factory()->create(['role' => 'teacher']);
        TeacherProfile::create([
            'user_id' => $teacher->id,
            'certificates' => [],
        ]);

        $response = $this->actingAs($admin)->post("/admin/teachers/{$teacher->id}/certificates", [
            'certificates' => [
                [
                    'type' => 'toefl',
                    'overall' => '130', // exceeds max 120
                ],
            ],
        ]);

        $response->assertSessionHasErrors(['certificates.0.overall']);
    }

    public function test_service_validates_duolingo_five_point_steps(): void
    {
        $validError = CertificateValidationService::validateScore('duolingo', 'overall', '135');
        $this->assertNull($validError);

        $stepError = CertificateValidationService::validateScore('duolingo', 'overall', '132');
        $this->assertNotNull($stepError);
    }

    public function test_service_validates_topik_and_jlpt_limits(): void
    {
        // TOPIK I overall max 200
        $topikError = CertificateValidationService::validateScore('topik1', 'overall', '250');
        $this->assertNotNull($topikError);

        // JLPT reading max 60
        $jlptError = CertificateValidationService::validateScore('jlpt', 'reading', '65');
        $this->assertNotNull($jlptError);
    }

    public function test_multilingual_error_messages_in_uzbek_and_russian(): void
    {
        app()->setLocale('uz');
        $uzMsg = CertificateValidationService::validateScore('ielts', 'overall', '9.5');
        $this->assertNotNull($uzMsg);
        $this->assertStringContainsString('9 dan oshmasligi kerak', $uzMsg);

        app()->setLocale('ru');
        $ruMsg = CertificateValidationService::validateScore('ielts', 'overall', '9.5');
        $this->assertNotNull($ruMsg);
        $this->assertStringContainsString('не может превышать 9', $ruMsg);

        app()->setLocale('en');
        $enMsg = CertificateValidationService::validateScore('ielts', 'overall', '9.5');
        $this->assertNotNull($enMsg);
        $this->assertStringContainsString('cannot exceed 9', $enMsg);
    }
}

<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Fortify\Features;
use Tests\TestCase;

class RegistrationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->skipUnlessFortifyHas(Features::registration());
    }

    public function test_registration_screen_can_be_rendered()
    {
        $response = $this->get(route('register'));

        $response->assertOk();
    }

    public function test_new_users_can_register_as_pupil()
    {
        $response = $this->post(route('register.store'), [
            'name' => 'Test Pupil',
            'email' => 'pupil@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
            'role' => 'pupil',
            'age' => 16,
            'phone_number' => '+123456789',
            'level' => 'pre-intermediate',
        ]);

        $this->assertAuthenticated();
        $response->assertRedirect(route('dashboard', absolute: false));
        $this->assertDatabaseHas('users', [
            'email' => 'pupil@example.com',
            'role' => 'pupil',
        ]);
        $this->assertDatabaseHas('pupil_profiles', [
            'age' => 16,
            'phone_number' => '+123456789',
            'level' => 'pre-intermediate',
        ]);
    }

    public function test_new_users_can_register_as_teacher()
    {
        $response = $this->post(route('register.store'), [
            'name' => 'Test Teacher',
            'email' => 'teacher@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
            'role' => 'teacher',
            'age' => 28,
            'phone_number' => '+987654321',
            'overall_level' => 'IELTS 8.5',
            'speaking_band' => 8.5,
        ]);

        $this->assertAuthenticated();
        $response->assertRedirect(route('dashboard', absolute: false));
        $this->assertDatabaseHas('users', [
            'email' => 'teacher@example.com',
            'role' => 'teacher',
        ]);
        $this->assertDatabaseHas('teacher_profiles', [
            'age' => 28,
            'phone_number' => '+987654321',
            'overall_level' => 'IELTS 8.5',
            'speaking_band' => 8.5,
        ]);
    }

    public function test_registration_requires_valid_role()
    {
        $response = $this->post(route('register.store'), [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
            'role' => 'invalid_role',
        ]);

        $response->assertSessionHasErrors(['role']);
        $this->assertGuest();
    }

    public function test_new_users_can_register_as_teacher_with_labels()
    {
        $response = $this->post(route('register.store'), [
            'name' => 'Test Teacher Labels',
            'email' => 'teacher_labels@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
            'role' => 'teacher',
            'age' => 30,
            'phone_number' => '+987654321',
            'overall_level' => 'IELTS 8.5',
            'speaking_band' => 8.5,
            'labels' => ['mock', 'freestyle'],
        ]);

        $this->assertAuthenticated();
        $response->assertRedirect(route('dashboard', absolute: false));
        $this->assertDatabaseHas('users', [
            'email' => 'teacher_labels@example.com',
            'role' => 'teacher',
        ]);

        $teacher = User::where('email', 'teacher_labels@example.com')->first();
        $this->assertEquals(['mock', 'freestyle'], $teacher->teacherProfile->labels);
    }

    public function test_new_users_can_register_as_teacher_under_18()
    {
        $response = $this->post(route('register.store'), [
            'name' => 'Young Teacher',
            'email' => 'young_teacher@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
            'role' => 'teacher',
            'age' => 16,
            'phone_number' => '+987654321',
            'overall_level' => 'IELTS 8.5',
            'speaking_band' => 8.5,
        ]);

        $this->assertAuthenticated();
        $response->assertRedirect(route('dashboard', absolute: false));
        $this->assertDatabaseHas('teacher_profiles', [
            'age' => 16,
            'overall_level' => 'IELTS 8.5',
        ]);
    }

    public function test_new_users_can_register_as_teacher_with_practice_qa_label()
    {
        $response = $this->post(route('register.store'), [
            'name' => 'QA Teacher',
            'email' => 'qa_teacher@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
            'role' => 'teacher',
            'age' => 25,
            'phone_number' => '+987654321',
            'overall_level' => 'IELTS 8.0',
            'speaking_band' => 8.0,
            'labels' => ['practice q&a', 'lessons'],
        ]);

        $this->assertAuthenticated();
        $response->assertRedirect(route('dashboard', absolute: false));
        $teacher = User::where('email', 'qa_teacher@example.com')->first();
        $this->assertEquals(['practice q&a', 'lessons'], $teacher->teacherProfile->labels);
    }

    public function test_registration_can_upload_multiple_certificates()
    {
        Storage::fake(env('FILESYSTEM_DISK', 'public'));
        Storage::fake('gcs');

        $response = $this->post(route('register.store'), [
            'name' => 'Certificate Teacher',
            'email' => 'cert_teacher@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
            'role' => 'teacher',
            'age' => 28,
            'phone_number' => '+987654321',
            'overall_level' => 'IELTS 8.0',
            'speaking_band' => 8.0,
            'ielts_certificates' => [
                UploadedFile::fake()->create('cert1.jpg', 100, 'image/jpeg'),
                UploadedFile::fake()->create('doc2.pdf', 100, 'application/pdf'),
            ],
        ]);

        $this->assertAuthenticated();
        $response->assertRedirect(route('dashboard', absolute: false));

        $teacher = User::where('email', 'cert_teacher@example.com')->first();
        $certs = $teacher->teacherProfile->certificates;

        $this->assertCount(2, $certs);
        $this->assertEquals('cert1.jpg', $certs[0]['title']);
        $this->assertTrue(str_starts_with($certs[0]['file_url'], '/storage/') || str_contains($certs[0]['file_url'], 'storage.googleapis.com') || str_contains($certs[0]['file_url'], 'cert1.jpg'));
        $this->assertEquals('doc2.pdf', $certs[1]['title']);
        $this->assertTrue(str_starts_with($certs[1]['file_url'], '/storage/') || str_contains($certs[1]['file_url'], 'storage.googleapis.com') || str_contains($certs[1]['file_url'], 'doc2.pdf'));
    }

    public function test_new_teacher_can_register_with_structured_multilingual_certificates()
    {
        $response = $this->post(route('register.store'), [
            'name' => 'Structured Teacher',
            'email' => 'structured_teacher@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
            'role' => 'teacher',
            'age' => 29,
            'phone_number' => '+998909876543',
            'certificates' => [
                [
                    'type' => 'topik2',
                    'language' => 'korean',
                    'overall' => 'Level 5 (210)',
                    'reading' => '70',
                    'listening' => '75',
                    'writing' => '65',
                ],
                [
                    'type' => 'cefr',
                    'language' => 'german',
                    'overall' => 'B2',
                    'listening' => 'B2',
                    'reading' => 'B2',
                    'writing' => 'B1',
                    'speaking' => 'B2',
                ],
            ],
        ]);

        $this->assertAuthenticated();
        $response->assertRedirect(route('dashboard', absolute: false));

        $teacher = User::where('email', 'structured_teacher@example.com')->first();
        $certs = $teacher->teacherProfile->certificates;

        $this->assertCount(2, $certs);
        $this->assertEquals('topik2', $certs[0]['type']);
        $this->assertEquals('korean', $certs[0]['language']);
        $this->assertEquals('Level 5 (210)', $certs[0]['overall']);
        $this->assertEquals('70', $certs[0]['reading']);

        $this->assertEquals('cefr', $certs[1]['type']);
        $this->assertEquals('german', $certs[1]['language']);
        $this->assertEquals('B2', $certs[1]['overall']);
        $this->assertEquals('B2', $certs[1]['listening']);
        $this->assertEquals('B2', $certs[1]['speaking']);
    }

    public function test_new_teacher_can_register_with_formatted_price_string()
    {
        $response = $this->post(route('register.store'), [
            'name' => 'Price Teacher',
            'email' => 'price_teacher@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
            'role' => 'teacher',
            'age' => 30,
            'phone_number' => '+998901234567',
            'price' => '65 000',
        ]);

        $this->assertAuthenticated();
        $response->assertRedirect(route('dashboard', absolute: false));

        $teacher = User::where('email', 'price_teacher@example.com')->first();
        $this->assertSame(65000, $teacher->teacherProfile->price);
    }

    public function test_new_teacher_can_register_with_empty_or_zero_price()
    {
        $response = $this->post(route('register.store'), [
            'name' => 'Free Teacher',
            'email' => 'free_teacher@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
            'role' => 'teacher',
            'age' => 25,
            'phone_number' => '+998907654321',
            'price' => '',
        ]);

        $this->assertAuthenticated();
        $response->assertRedirect(route('dashboard', absolute: false));

        $teacher = User::where('email', 'free_teacher@example.com')->first();
        $this->assertSame(0, $teacher->teacherProfile->price);
    }
}

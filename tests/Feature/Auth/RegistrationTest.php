<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
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
}

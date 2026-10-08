<?php

namespace Tests\Feature\Auth;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RegistrationAgeValidationTest extends TestCase
{
    use RefreshDatabase;

    public function test_pupil_registration_fails_if_age_over_100(): void
    {
        $response = $this->post(route('register.store'), [
            'name' => 'Ancient Pupil',
            'email' => 'ancient@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
            'role' => 'pupil',
            'age' => 3198465,
            'phone_number' => '+998901234567',
            'level' => 'beginner',
        ]);

        $response->assertSessionHasErrors(['age']);
        $this->assertGuest();
    }

    public function test_teacher_registration_fails_if_age_over_100(): void
    {
        $response = $this->post(route('register.store'), [
            'name' => 'Too Old Teacher',
            'email' => 'old_teacher@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
            'role' => 'teacher',
            'age' => 105,
            'phone_number' => '+998901234567',
            'overall_level' => 'IELTS 7.5',
            'speaking_band' => 7.5,
        ]);

        $response->assertSessionHasErrors(['age']);
        $this->assertGuest();
    }

    public function test_registration_fails_if_age_is_zero_or_negative(): void
    {
        $response = $this->post(route('register.store'), [
            'name' => 'Zero Age Pupil',
            'email' => 'zero_pupil@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
            'role' => 'pupil',
            'age' => 0,
            'phone_number' => '+998901234567',
            'level' => 'beginner',
        ]);

        $response->assertSessionHasErrors(['age']);
        $this->assertGuest();
    }

    public function test_pupil_registration_succeeds_with_boundary_ages(): void
    {
        $responseMin = $this->post(route('register.store'), [
            'name' => 'Valid Pupil',
            'email' => 'minpupil@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
            'role' => 'pupil',
            'age' => 8,
            'phone_number' => '+998901234567',
            'level' => 'beginner',
        ]);

        $this->assertAuthenticated();
        $responseMin->assertRedirect();
        $this->assertDatabaseHas('pupil_profiles', ['age' => 8]);

        auth()->logout();

        $responseMax = $this->post(route('register.store'), [
            'name' => 'Max Pupil',
            'email' => 'maxpupil@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
            'role' => 'pupil',
            'age' => 100,
            'phone_number' => '+998901234568',
            'level' => 'advanced',
        ]);

        $this->assertAuthenticated();
        $responseMax->assertRedirect();
        $this->assertDatabaseHas('pupil_profiles', ['age' => 100]);
    }

    public function test_teacher_registration_succeeds_with_boundary_ages(): void
    {
        $responseMin = $this->post(route('register.store'), [
            'name' => 'Young Adult Teacher',
            'email' => 'minteacher@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
            'role' => 'teacher',
            'age' => 18,
            'phone_number' => '+998901234567',
            'overall_level' => 'IELTS 8.0',
            'speaking_band' => 8.0,
        ]);

        $this->assertAuthenticated();
        $responseMin->assertRedirect();
        $this->assertDatabaseHas('teacher_profiles', ['age' => 18]);

        auth()->logout();

        $responseMax = $this->post(route('register.store'), [
            'name' => 'Senior Teacher',
            'email' => 'maxteacher@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
            'role' => 'teacher',
            'age' => 100,
            'phone_number' => '+998901234568',
            'overall_level' => 'IELTS 8.5',
            'speaking_band' => 8.5,
        ]);

        $this->assertAuthenticated();
        $responseMax->assertRedirect();
        $this->assertDatabaseHas('teacher_profiles', ['age' => 100]);
    }
}

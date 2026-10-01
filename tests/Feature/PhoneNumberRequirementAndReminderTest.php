<?php

namespace Tests\Feature;

use App\Models\PupilProfile;
use App\Models\TeacherProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PhoneNumberRequirementAndReminderTest extends TestCase
{
    use RefreshDatabase;

    public function test_registration_fails_without_phone_number(): void
    {
        $response = $this->post(route('register.store'), [
            'name' => 'No Phone Pupil',
            'email' => 'nophone@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
            'role' => 'pupil',
            'age' => 20,
            'level' => 'pre-intermediate',
        ]);

        $response->assertSessionHasErrors(['phone_number']);
        $this->assertDatabaseMissing('users', ['email' => 'nophone@example.com']);
    }

    public function test_registration_fails_with_invalid_phone_format(): void
    {
        $response = $this->post(route('register.store'), [
            'name' => 'Bad Phone Pupil',
            'email' => 'badphone@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
            'role' => 'pupil',
            'age' => 20,
            'phone_number' => 'not-a-number',
            'level' => 'pre-intermediate',
        ]);

        $response->assertSessionHasErrors(['phone_number']);
    }

    public function test_existing_user_without_phone_can_access_dashboard(): void
    {
        $user = User::factory()->create([
            'role' => 'pupil',
            'phone_number' => null,
            'email_verified_at' => now(),
        ]);

        PupilProfile::create([
            'user_id' => $user->id,
            'age' => 20,
            'level' => 'pre-intermediate',
            'phone_number' => null,
        ]);

        $response = $this->actingAs($user)->get(route('dashboard'));

        $response->assertOk();
    }

    public function test_teacher_can_save_phone_number_in_settings(): void
    {
        $teacher = User::factory()->create([
            'role' => 'teacher',
            'phone_number' => null,
            'email_verified_at' => now(),
        ]);

        TeacherProfile::factory()->create([
            'user_id' => $teacher->id,
            'phone_number' => null,
        ]);

        $response = $this->actingAs($teacher)->patch(route('profile.update'), [
            'name' => $teacher->name,
            'email' => $teacher->email,
            'phone_number' => '+998901234567',
            'age' => 28,
            'headline' => 'Experienced ESL Teacher',
        ]);

        $response->assertRedirect(route('profile.edit'));

        $teacher->refresh();
        $this->assertSame('+998901234567', $teacher->phone_number);
        $this->assertSame('+998901234567', $teacher->teacherProfile->phone_number);
    }

    public function test_pupil_can_save_phone_number_in_settings(): void
    {
        $pupil = User::factory()->create([
            'role' => 'pupil',
            'phone_number' => null,
            'email_verified_at' => now(),
        ]);

        PupilProfile::create([
            'user_id' => $pupil->id,
            'age' => 19,
            'level' => 'pre-intermediate',
            'phone_number' => null,
        ]);

        $response = $this->actingAs($pupil)->patch(route('profile.update'), [
            'name' => $pupil->name,
            'email' => $pupil->email,
            'phone_number' => '+998971234567',
            'age' => 19,
        ]);

        $response->assertRedirect(route('profile.edit'));

        $pupil->refresh();
        $this->assertSame('+998971234567', $pupil->phone_number);
        $this->assertSame('+998971234567', $pupil->pupilProfile->phone_number);
    }

    public function test_existing_user_without_phone_can_update_profile_without_errors(): void
    {
        $user = User::factory()->create([
            'role' => 'teacher',
            'phone_number' => null,
            'email_verified_at' => now(),
        ]);

        TeacherProfile::factory()->create([
            'user_id' => $user->id,
            'phone_number' => null,
            'headline' => 'Initial headline',
        ]);

        $response = $this->actingAs($user)->patch(route('profile.update'), [
            'name' => 'Updated Teacher Name',
            'email' => $user->email,
            'headline' => 'Updated headline without phone entered yet',
            'age' => 30,
        ]);

        $response->assertRedirect(route('profile.edit'));
        $response->assertSessionHasNoErrors();

        $user->refresh();
        $this->assertSame('Updated Teacher Name', $user->name);
        $this->assertNull($user->phone_number);
    }
}

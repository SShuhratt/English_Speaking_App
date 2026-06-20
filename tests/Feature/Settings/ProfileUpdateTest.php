<?php

namespace Tests\Feature\Settings;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ProfileUpdateTest extends TestCase
{
    use RefreshDatabase;

    public function test_profile_page_is_displayed()
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->get(route('profile.edit'));

        $response->assertOk();
    }

    public function test_profile_information_can_be_updated()
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->patch(route('profile.update'), [
                'name' => 'Test User',
                'email' => 'test@example.com',
            ]);

        $response
            ->assertSessionHasNoErrors()
            ->assertRedirect(route('profile.edit'));

        $user->refresh();

        $this->assertSame('Test User', $user->name);
        $this->assertSame('test@example.com', $user->email);
        $this->assertNull($user->email_verified_at);
    }

    public function test_email_verification_status_is_unchanged_when_the_email_address_is_unchanged()
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->patch(route('profile.update'), [
                'name' => 'Test User',
                'email' => $user->email,
            ]);

        $response
            ->assertSessionHasNoErrors()
            ->assertRedirect(route('profile.edit'));

        $this->assertNotNull($user->refresh()->email_verified_at);
    }

    public function test_user_can_delete_their_account()
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->delete(route('profile.destroy'), [
                'password' => 'password',
            ]);

        $response
            ->assertSessionHasNoErrors()
            ->assertRedirect(route('home'));

        $this->assertGuest();
        $this->assertNull($user->fresh());
    }

    public function test_correct_password_must_be_provided_to_delete_account()
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->from(route('profile.edit'))
            ->delete(route('profile.destroy'), [
                'password' => 'wrong-password',
            ]);

        $response
            ->assertSessionHasErrors('password')
            ->assertRedirect(route('profile.edit'));

        $this->assertNotNull($user->fresh());
    }

    public function test_teacher_profile_can_be_updated()
    {
        $user = User::factory()->create(['role' => 'teacher']);

        $response = $this
            ->actingAs($user)
            ->patch(route('profile.update'), [
                'name' => 'Teacher Name',
                'email' => 'teacher@example.com',
                'age' => 30,
                'phone_number' => '+1234567890',
                'experience_years' => 5.5,
                'workplace' => 'English Academy',
                'overall_level' => 'IELTS 8.5',
                'speaking_band' => 8.5,
                'certificates' => 'CELTA, TESOL',
            ]);

        $response->assertSessionHasNoErrors();
        $response->assertRedirect(route('profile.edit'));

        $this->assertDatabaseHas('teacher_profiles', [
            'user_id' => $user->id,
            'age' => 30,
            'phone_number' => '+1234567890',
            'experience_years' => 5.5,
            'workplace' => 'English Academy',
            'overall_level' => 'IELTS 8.5',
            'speaking_band' => 8.5,
        ]);

        $user->refresh();
        $this->assertEquals(['CELTA', 'TESOL'], $user->teacherProfile->certificates);
    }

    public function test_pupil_profile_can_be_updated()
    {
        $user = User::factory()->create(['role' => 'pupil']);

        $response = $this
            ->actingAs($user)
            ->patch(route('profile.update'), [
                'name' => 'Pupil Name',
                'email' => 'pupil@example.com',
                'age' => 17,
                'phone_number' => '+0987654321',
                'level' => 'pre-intermediate',
            ]);

        $response->assertSessionHasNoErrors();
        $response->assertRedirect(route('profile.edit'));

        $this->assertDatabaseHas('pupil_profiles', [
            'user_id' => $user->id,
            'age' => 17,
            'phone_number' => '+0987654321',
            'level' => 'pre-intermediate',
        ]);
    }

    public function test_teacher_profile_can_be_updated_with_null_values()
    {
        $user = User::factory()->create(['role' => 'teacher']);

        $response = $this
            ->actingAs($user)
            ->patch(route('profile.update'), [
                'name' => 'Teacher Name',
                'email' => 'teacher@example.com',
                'age' => null,
                'phone_number' => null,
                'experience_years' => null,
                'workplace' => null,
                'overall_level' => 'IELTS 8.5',
                'speaking_band' => 8.5,
                'certificates' => null,
            ]);

        $response->assertSessionHasNoErrors();
        $response->assertRedirect(route('profile.edit'));

        $this->assertDatabaseHas('teacher_profiles', [
            'user_id' => $user->id,
            'age' => null,
            'phone_number' => null,
            'experience_years' => null,
            'workplace' => null,
            'overall_level' => 'IELTS 8.5',
            'speaking_band' => 8.5,
        ]);
    }

    public function test_pupil_profile_can_be_updated_with_null_values()
    {
        $user = User::factory()->create(['role' => 'pupil']);

        $response = $this
            ->actingAs($user)
            ->patch(route('profile.update'), [
                'name' => 'Pupil Name',
                'email' => 'pupil@example.com',
                'age' => null,
                'phone_number' => null,
                'level' => null,
            ]);

        $response->assertSessionHasNoErrors();
        $response->assertRedirect(route('profile.edit'));

        $this->assertDatabaseHas('pupil_profiles', [
            'user_id' => $user->id,
            'age' => null,
            'phone_number' => null,
            'level' => null,
        ]);
    }

    public function test_teacher_profile_can_be_updated_with_labels()
    {
        $user = User::factory()->create(['role' => 'teacher']);

        $response = $this
            ->actingAs($user)
            ->patch(route('profile.update'), [
                'name' => 'Teacher Name',
                'email' => 'teacher@example.com',
                'age' => 30,
                'phone_number' => '+1234567890',
                'experience_years' => 5.5,
                'workplace' => 'English Academy',
                'overall_level' => 'IELTS 8.5',
                'speaking_band' => 8.5,
                'labels' => ['mock', 'business english'],
            ]);

        $response->assertSessionHasNoErrors();
        $response->assertRedirect(route('profile.edit'));

        $user->refresh();
        $this->assertEquals(['mock', 'business english'], $user->teacherProfile->labels);
     }

    public function test_teacher_profile_can_be_updated_with_age_under_18()
    {
        $user = User::factory()->create(['role' => 'teacher']);

        $response = $this
            ->actingAs($user)
            ->patch(route('profile.update'), [
                'name' => 'Young Teacher',
                'email' => 'young_teacher@example.com',
                'age' => 15,
                'phone_number' => '+987654321',
            ]);

        $response->assertSessionHasNoErrors();
        $this->assertDatabaseHas('teacher_profiles', [
            'user_id' => $user->id,
            'age' => 15,
        ]);
    }

    public function test_teacher_profile_can_be_updated_with_practice_qa_label()
    {
        $user = User::factory()->create(['role' => 'teacher']);

        $response = $this
            ->actingAs($user)
            ->patch(route('profile.update'), [
                'name' => 'QA Teacher',
                'email' => 'qa_teacher@example.com',
                'labels' => ['practice q&a', 'lessons'],
            ]);

        $response->assertSessionHasNoErrors();
        $user->refresh();
        $this->assertEquals(['practice q&a', 'lessons'], $user->teacherProfile->labels);
    }

    public function test_pupil_profile_can_be_updated_with_certificates()
    {
        $user = User::factory()->create(['role' => 'pupil']);

        $response = $this
            ->actingAs($user)
            ->patch(route('profile.update'), [
                'name' => 'Pupil Name',
                'email' => 'pupil@example.com',
                'certificates' => ['IELTS 7.5 Certificate', 'CEFR B2'],
            ]);

        $response->assertSessionHasNoErrors();
        $user->refresh();
        $this->assertEquals(['IELTS 7.5 Certificate', 'CEFR B2'], $user->pupilProfile->certificates);
    }

    public function test_teacher_profile_can_be_updated_with_multiple_certificates_uploaded()
    {
        Storage::fake('gcs');
        $user = User::factory()->create(['role' => 'teacher']);

        $response = $this
            ->actingAs($user)
            ->patch(route('profile.update'), [
                'name' => 'Teacher Name',
                'email' => 'teacher@example.com',
                'certificates' => 'CELTA, TESOL',
                'ielts_certificates' => [
                    UploadedFile::fake()->create('t_cert1.jpg', 100, 'image/jpeg'),
                    UploadedFile::fake()->create('t_doc2.pdf', 100, 'application/pdf')
                ],
            ]);

        $response->assertSessionHasNoErrors();
        $user->refresh();

        $certs = $user->teacherProfile->certificates;
        $this->assertContains('CELTA', $certs);
        $this->assertContains('TESOL', $certs);
        $this->assertCount(4, $certs);
    }

    public function test_teacher_profile_can_be_updated_by_deleting_existing_certificates()
    {
        Storage::fake('gcs');
        $user = User::factory()->create(['role' => 'teacher']);

        $user->teacherProfile()->create([
            'certificates' => ['CELTA', 'https://storage.googleapis.com/bucket/old_cert.pdf']
        ]);

        $response = $this
            ->actingAs($user)
            ->patch(route('profile.update'), [
                'name' => 'Teacher Name',
                'email' => 'teacher@example.com',
                'certificates' => 'CELTA',
                'existing_certificates' => [],
            ]);

        $response->assertSessionHasNoErrors();
        $user->refresh();

        $certs = $user->teacherProfile->certificates;
        $this->assertEquals(['CELTA'], $certs);
    }
}

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
}

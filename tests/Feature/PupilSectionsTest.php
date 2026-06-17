<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PupilSectionsTest extends TestCase
{
    use RefreshDatabase;

    public function test_pupil_can_access_bookings()
    {
        $pupil = User::factory()->create(['role' => 'pupil']);
        $response = $this->actingAs($pupil)->get('/pupil/bookings');
        $response->assertStatus(200);
    }

    public function test_pupil_can_access_sessions()
    {
        $pupil = User::factory()->create(['role' => 'pupil']);
        $response = $this->actingAs($pupil)->get('/pupil/sessions');
        $response->assertStatus(200);
    }

    public function test_pupil_can_access_progress()
    {
        $pupil = User::factory()->create(['role' => 'pupil']);
        $response = $this->actingAs($pupil)->get('/pupil/progress');
        $response->assertStatus(200);
    }

    public function test_pupil_can_access_teachers_list()
    {
        $pupil = User::factory()->create(['role' => 'pupil']);
        $response = $this->actingAs($pupil)->get('/pupil/teachers');
        $response->assertStatus(200);
    }

    public function test_pupil_can_view_teacher_profile()
    {
        $pupil = User::factory()->create(['role' => 'pupil']);
        $teacher = User::factory()->create(['role' => 'teacher']);

        $response = $this->actingAs($pupil)->get("/pupil/teachers/{$teacher->id}");
        $response->assertStatus(200);
    }
}

<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TeacherSectionsTest extends TestCase
{
    use RefreshDatabase;

    public function test_teacher_can_access_schedule()
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        $response = $this->actingAs($teacher)->get('/teacher/schedule');
        $response->assertStatus(200);
    }

    public function test_teacher_can_access_availability()
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        $response = $this->actingAs($teacher)->get('/teacher/availability');
        $response->assertStatus(200);
    }

    public function test_teacher_can_access_sessions()
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        $response = $this->actingAs($teacher)->get('/teacher/sessions');
        $response->assertStatus(200);
    }

    public function test_teacher_can_access_feedback()
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        $response = $this->actingAs($teacher)->get('/teacher/feedback');
        $response->assertStatus(200);
    }
}

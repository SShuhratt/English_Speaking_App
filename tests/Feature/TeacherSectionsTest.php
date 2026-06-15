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

    public function test_teacher_can_store_availability()
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        
        $response = $this->actingAs($teacher)->post('/teacher/availability', [
            'type' => 'recurring',
            'day_of_week' => 'monday',
            'start_time' => '09:00',
            'end_time' => '17:00',
            'slot_duration' => 30,
        ]);

        $response->assertRedirect();
        
        $this->assertDatabaseHas('teacher_availabilities', [
            'teacher_id' => $teacher->id,
            'type' => 'recurring',
            'day_of_week' => 'monday',
            'start_time' => '09:00',
            'end_time' => '17:00',
            'slot_duration' => 30,
        ]);
    }

    public function test_teacher_can_store_custom_availability()
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        
        $response = $this->actingAs($teacher)->post('/teacher/availability', [
            'type' => 'custom',
            'start_at' => '2026-06-15 09:00:00',
            'end_at' => '2026-06-15 17:00:00',
            'slot_duration' => 30,
        ]);

        $response->assertRedirect();
        
        $this->assertDatabaseHas('teacher_availabilities', [
            'teacher_id' => $teacher->id,
            'type' => 'custom',
            'start_at' => '2026-06-15 09:00:00',
            'end_at' => '2026-06-15 17:00:00',
            'slot_duration' => 30,
        ]);
    }

    public function test_teacher_can_delete_availability()
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        $availability = \App\Models\TeacherAvailability::create([
            'teacher_id' => $teacher->id,
            'type' => 'recurring',
            'day_of_week' => 'monday',
            'start_time' => '09:00',
            'end_time' => '17:00',
            'slot_duration' => 30,
            'is_active' => true,
        ]);

        $response = $this->actingAs($teacher)->delete("/teacher/availability/{$availability->id}");

        $response->assertRedirect();
        
        $this->assertDatabaseMissing('teacher_availabilities', [
            'id' => $availability->id,
        ]);
    }
}

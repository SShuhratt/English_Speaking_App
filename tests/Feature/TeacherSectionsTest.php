<?php

namespace Tests\Feature;

use App\Models\TeacherAvailability;
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
        $availability = TeacherAvailability::create([
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

    public function test_teacher_can_update_availability()
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        $availability = TeacherAvailability::create([
            'teacher_id' => $teacher->id,
            'type' => 'recurring',
            'day_of_week' => 'monday',
            'start_time' => '09:00',
            'end_time' => '17:00',
            'slot_duration' => 30,
            'is_active' => true,
        ]);

        $response = $this->actingAs($teacher)->put("/teacher/availability/{$availability->id}", [
            'type' => 'recurring',
            'day_of_week' => 'tuesday',
            'start_time' => '10:00',
            'end_time' => '18:00',
            'slot_duration' => 45,
        ]);

        $response->assertRedirect();

        $this->assertDatabaseHas('teacher_availabilities', [
            'id' => $availability->id,
            'day_of_week' => 'tuesday',
            'start_time' => '10:00:00',
            'end_time' => '18:00:00',
            'slot_duration' => 45,
        ]);
    }

    public function test_teacher_can_delete_availability_range()
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        $availability = TeacherAvailability::create([
            'teacher_id' => $teacher->id,
            'type' => 'recurring',
            'day_of_week' => 'monday',
            'start_time' => '09:00:00',
            'end_time' => '17:00:00',
            'slot_duration' => 30,
            'is_active' => true,
        ]);

        $response = $this->actingAs($teacher)->delete("/teacher/availability/{$availability->id}", [
            'delete_type' => 'range',
            'range_start' => '2026-08-03T09:00:00',
            'range_end' => '2026-08-03T12:00:00',
        ]);

        $response->assertRedirect();

        $this->assertDatabaseHas('teacher_availabilities', [
            'id' => $availability->id,
            'start_time' => '12:00:00',
            'end_time' => '17:00:00',
        ]);
    }

    public function test_teacher_delete_non_existent_availability_handles_gracefully()
    {
        $teacher = User::factory()->create(['role' => 'teacher']);

        $response = $this->actingAs($teacher)->delete('/teacher/availability/9ca00000-0000-0000-0000-000000000000');

        $response->assertRedirect();
        $response->assertSessionHasErrors(['range']);
    }

    public function test_teacher_can_delete_custom_availability()
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        $availability = TeacherAvailability::create([
            'teacher_id' => $teacher->id,
            'type' => 'custom',
            'start_at' => '2026-08-10 09:00:00',
            'end_at' => '2026-08-10 17:00:00',
            'slot_duration' => 30,
            'is_active' => true,
        ]);

        $response = $this->actingAs($teacher)->delete("/teacher/availability/{$availability->id}");

        $response->assertRedirect();
        $this->assertDatabaseMissing('teacher_availabilities', [
            'id' => $availability->id,
        ]);
    }

    public function test_teacher_can_delete_custom_availability_range()
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        $availability = TeacherAvailability::create([
            'teacher_id' => $teacher->id,
            'type' => 'custom',
            'start_at' => '2026-08-10 09:00:00',
            'end_at' => '2026-08-10 17:00:00',
            'slot_duration' => 30,
            'is_active' => true,
        ]);

        $response = $this->actingAs($teacher)->delete("/teacher/availability/{$availability->id}", [
            'delete_type' => 'range',
            'range_start' => '2026-08-10T09:00:00Z',
            'range_end' => '2026-08-10T12:00:00Z',
        ]);

        $response->assertRedirect();

        $this->assertDatabaseHas('teacher_availabilities', [
            'id' => $availability->id,
            'start_at' => '2026-08-10 12:00:00',
            'end_at' => '2026-08-10 17:00:00',
        ]);
    }
}

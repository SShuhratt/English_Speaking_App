<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\TeacherProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminTeacherAnomalyTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::factory()->create(['role' => 'admin']);
    }

    public function test_teacher_with_many_students_and_no_repeats_is_flagged_as_high_risk(): void
    {
        $poachingTeacher = User::factory()->create(['role' => 'teacher']);
        TeacherProfile::factory()->create(['user_id' => $poachingTeacher->id]);

        // Create 5 distinct students who each completed only 1 session with this teacher
        for ($i = 0; $i < 5; $i++) {
            $pupil = User::factory()->create(['role' => 'pupil']);
            Appointment::create([
                'teacher_id' => $poachingTeacher->id,
                'pupil_id' => $pupil->id,
                'start_at' => now()->subDays(10 + $i),
                'end_at' => now()->subDays(10 + $i)->addMinutes(45),
                'status' => 'completed',
                'duration_minutes' => 45,
                'price' => 100000,
            ]);
        }

        $healthyTeacher = User::factory()->create(['role' => 'teacher']);
        TeacherProfile::factory()->create(['user_id' => $healthyTeacher->id]);

        // Create 5 distinct students, where 3 of them completed 3 sessions each
        for ($i = 0; $i < 5; $i++) {
            $pupil = User::factory()->create(['role' => 'pupil']);
            $sessionCount = ($i < 3) ? 3 : 1;
            for ($s = 0; $s < $sessionCount; $s++) {
                Appointment::create([
                    'teacher_id' => $healthyTeacher->id,
                    'pupil_id' => $pupil->id,
                    'start_at' => now()->subDays(5 + $s),
                    'end_at' => now()->subDays(5 + $s)->addMinutes(45),
                    'status' => 'completed',
                    'duration_minutes' => 45,
                    'price' => 100000,
                ]);
            }
        }

        $response = $this->actingAs($this->admin)->get(route('admin.teachers'));
        $response->assertStatus(200);

        $teachers = $response->viewData('page')['props']['teachers']['data'];

        $poachingTeacherData = collect($teachers)->firstWhere('id', $poachingTeacher->id);
        $healthyTeacherData = collect($teachers)->firstWhere('id', $healthyTeacher->id);

        $this->assertNotNull($poachingTeacherData);
        $this->assertEquals('high', $poachingTeacherData['stats']['poaching_risk']);
        $this->assertEquals(0.0, $poachingTeacherData['stats']['repeat_rate']);
        $this->assertEquals(5, $poachingTeacherData['stats']['distinct_students']);

        $this->assertNotNull($healthyTeacherData);
        $this->assertEquals('normal', $healthyTeacherData['stats']['poaching_risk']);
        $this->assertEquals(60.0, $healthyTeacherData['stats']['repeat_rate']); // 3 out of 5 = 60%
    }
}

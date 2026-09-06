<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\TeacherAvailability;
use App\Models\User;
use App\Support\PlatformTime;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class ModelUtcGuardTest extends TestCase
{
    use RefreshDatabase;

    public function test_appointment_persists_naive_string_as_utc_in_database(): void
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        $pupil = User::factory()->create(['role' => 'pupil']);

        // 15:00 in Tashkent (UTC+5) is 10:00 UTC
        $appointment = Appointment::create([
            'teacher_id' => $teacher->id,
            'pupil_id' => $pupil->id,
            'start_at' => '2026-09-20 15:00:00',
            'end_at' => '2026-09-20 16:00:00',
            'status' => 'confirmed',
        ]);

        // Raw database query directly inspecting the column value
        $raw = DB::table('appointments')->where('id', $appointment->id)->first();
        $this->assertEquals('2026-09-20 10:00:00', $raw->start_at);
        $this->assertEquals('2026-09-20 11:00:00', $raw->end_at);

        // Eloquent accessor returns UTC Carbon
        $fresh = Appointment::find($appointment->id);
        $this->assertInstanceOf(Carbon::class, $fresh->start_at);
        $this->assertEquals('UTC', $fresh->start_at->timezoneName);
        $this->assertEquals('2026-09-20 10:00:00', $fresh->start_at->format('Y-m-d H:i:s'));

        // Local presentation matches original business time
        $this->assertEquals('2026-09-20 15:00:00', PlatformTime::toLocal($fresh->start_at)->format('Y-m-d H:i:s'));
    }

    public function test_appointment_persists_tashkent_carbon_instance_as_utc(): void
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        $pupil = User::factory()->create(['role' => 'pupil']);

        $tashkentCarbon = Carbon::parse('2026-09-20 18:30:00', 'Asia/Tashkent');

        $appointment = Appointment::create([
            'teacher_id' => $teacher->id,
            'pupil_id' => $pupil->id,
            'start_at' => $tashkentCarbon,
            'end_at' => $tashkentCarbon->copy()->addHour(),
            'status' => 'pending',
        ]);

        $raw = DB::table('appointments')->where('id', $appointment->id)->first();
        $this->assertEquals('2026-09-20 13:30:00', $raw->start_at);
        $this->assertEquals('2026-09-20 14:30:00', $raw->end_at);
    }

    public function test_teacher_availability_persists_custom_range_as_utc_in_database(): void
    {
        $teacher = User::factory()->create(['role' => 'teacher']);

        $availability = TeacherAvailability::create([
            'teacher_id' => $teacher->id,
            'type' => 'custom',
            'start_at' => '2026-09-25 10:00:00',
            'end_at' => '2026-09-25 18:00:00',
            'slot_duration' => 60,
            'is_active' => true,
        ]);

        // 10:00 to 18:00 Tashkent is 05:00 to 13:00 UTC
        $raw = DB::table('teacher_availabilities')->where('id', $availability->id)->first();
        $this->assertEquals('2026-09-25 05:00:00', $raw->start_at);
        $this->assertEquals('2026-09-25 13:00:00', $raw->end_at);

        // Eloquent accessor returns UTC Carbon
        $fresh = TeacherAvailability::find($availability->id);
        $this->assertInstanceOf(Carbon::class, $fresh->start_at);
        $this->assertEquals('UTC', $fresh->start_at->timezoneName);
        $this->assertEquals('2026-09-25 05:00:00', $fresh->start_at->format('Y-m-d H:i:s'));

        // Local conversion returns Tashkent time
        $this->assertEquals('2026-09-25 10:00:00', PlatformTime::toLocal($fresh->start_at)->format('Y-m-d H:i:s'));
    }

    public function test_teacher_availability_persists_blackout_override_as_utc(): void
    {
        $teacher = User::factory()->create(['role' => 'teacher']);

        $blackout = TeacherAvailability::create([
            'teacher_id' => $teacher->id,
            'type' => 'custom',
            'start_at' => Carbon::parse('2026-09-25 14:00:00', 'Asia/Tashkent'),
            'end_at' => Carbon::parse('2026-09-25 16:00:00', 'Asia/Tashkent'),
            'slot_duration' => 60,
            'is_active' => false,
        ]);

        // 14:00 to 16:00 Tashkent is 09:00 to 11:00 UTC
        $raw = DB::table('teacher_availabilities')->where('id', $blackout->id)->first();
        $this->assertEquals('2026-09-25 09:00:00', $raw->start_at);
        $this->assertEquals('2026-09-25 11:00:00', $raw->end_at);
    }
}

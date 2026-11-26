<?php

namespace Tests\Feature\GroupSessions;

use App\Models\Appointment;
use App\Models\GroupSession;
use App\Models\GroupSessionEnrollment;
use App\Models\TeacherAvailability;
use App\Models\TeacherProfile;
use App\Models\User;
use App\Notifications\GroupSessionNotification;
use App\Services\SlotService;
use Carbon\Carbon;
use Illuminate\Foundation\Http\Middleware\PreventRequestForgery;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class GroupSessionSchedulingTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutMiddleware(PreventRequestForgery::class);
    }

    public function test_teacher_can_update_session_format_preferences(): void
    {
        $teacher = User::factory()->teacher()->create();
        TeacherProfile::create([
            'user_id' => $teacher->id,
            'price' => 80000,
            'is_verified' => true,
            'preferred_session_format' => 'one_on_one',
            'supports_group_sessions' => false,
        ]);

        $response = $this->actingAs($teacher)->postJson('/teacher/session-format-preferences', [
            'preferred_session_format' => 'both',
        ]);

        $response->assertOk()
            ->assertJson([
                'preferred_session_format' => 'both',
                'supports_group_sessions' => true,
            ]);

        $this->actingAs($teacher)->postJson('/teacher/session-format-preferences', [
            'preferred_session_format' => 'one_on_one',
        ])->assertOk()
            ->assertJson([
                'preferred_session_format' => 'one_on_one',
                'supports_group_sessions' => false,
            ]);
    }

    public function test_teacher_can_create_group_session_and_auto_enable_group_support(): void
    {
        $teacher = User::factory()->teacher()->create();
        TeacherProfile::create([
            'user_id' => $teacher->id,
            'price' => 80000,
            'is_verified' => true,
            'preferred_session_format' => 'one_on_one',
            'supports_group_sessions' => false,
        ]);

        $startLocal = Carbon::now('Asia/Tashkent')->addDays(2)->setTime(15, 0);

        $response = $this->actingAs($teacher)->postJson('/teacher/group-sessions', [
            'title' => 'IELTS Speaking Part 2 Workshop',
            'topic' => 'Describing memorable events clearly',
            'target_level' => 'intermediate',
            'start_at' => $startLocal->format('Y-m-d H:i:s'),
            'duration_minutes' => 60,
            'max_seats' => 6,
            'price_per_seat' => 45000,
        ]);

        $response->assertCreated();

        $this->assertDatabaseHas('group_sessions', [
            'teacher_id' => $teacher->id,
            'title' => 'IELTS Speaking Part 2 Workshop',
            'duration_minutes' => 60,
            'max_seats' => 6,
            'price_per_seat' => 45000,
            'status' => 'scheduled',
        ]);

        $profile = $teacher->teacherProfile->fresh();
        $this->assertTrue($profile->supports_group_sessions);
        $this->assertSame('both', $profile->preferred_session_format);
    }

    public function test_group_session_cannot_overlap_active_appointment_and_removes_one_on_one_slots(): void
    {
        $teacher = User::factory()->teacher()->create();
        $pupil = User::factory()->pupil()->create();

        TeacherProfile::create([
            'user_id' => $teacher->id,
            'price' => 80000,
            'is_verified' => true,
        ]);

        $monday = Carbon::parse('next monday', 'Asia/Tashkent');

        TeacherAvailability::create([
            'teacher_id' => $teacher->id,
            'type' => 'recurring',
            'day_of_week' => 'monday',
            'start_time' => '09:00:00',
            'end_time' => '13:00:00',
            'slot_duration' => 60,
        ]);

        // Existing 1-on-1 appointment 09:00 - 10:00
        Appointment::create([
            'teacher_id' => $teacher->id,
            'pupil_id' => $pupil->id,
            'start_at' => $monday->copy()->setTime(9, 0)->utc(),
            'end_at' => $monday->copy()->setTime(10, 0)->utc(),
            'status' => 'confirmed',
        ]);

        // Attempting to create a group session overlapping 09:30 - 10:30 fails
        $this->actingAs($teacher)->postJson('/teacher/group-sessions', [
            'title' => 'Conflict Session',
            'start_at' => $monday->copy()->setTime(9, 30)->format('Y-m-d H:i:s'),
            'duration_minutes' => 60,
            'max_seats' => 4,
            'price_per_seat' => 40000,
        ])->assertStatus(422);

        // Creating a non-overlapping group session at 11:00 - 12:00 succeeds
        $this->actingAs($teacher)->postJson('/teacher/group-sessions', [
            'title' => 'Business Discussion Club',
            'start_at' => $monday->copy()->setTime(11, 0)->format('Y-m-d H:i:s'),
            'duration_minutes' => 60,
            'max_seats' => 5,
            'price_per_seat' => 40000,
        ])->assertCreated();

        // SlotService should exclude both 09:00-10:00 (appointment) and 11:00-12:00 (group session)
        $slotService = app(SlotService::class);
        $slots = $slotService->getAvailableSlots($teacher->id, $monday->toDateString(), $pupil->id);
        $starts = collect($slots)
            ->map(fn ($slot) => Carbon::parse($slot['start_at'])->setTimezone('Asia/Tashkent')->format('H:i'))
            ->all();

        $this->assertNotContains('09:00', $starts);
        $this->assertNotContains('11:00', $starts);
        $this->assertContains('10:00', $starts);
        $this->assertContains('12:00', $starts);

        // Pupil attempting to book 1-on-1 inside the group session window fails with 422
        $this->actingAs($pupil)->postJson('/bookings', [
            'teacher_id' => $teacher->id,
            'pupil_id' => $pupil->id,
            'start_at' => $monday->copy()->setTime(11, 0)->format('Y-m-d H:i:s'),
            'end_at' => $monday->copy()->setTime(12, 0)->format('Y-m-d H:i:s'),
            'topics' => ['freestyle'],
        ])->assertStatus(422);
    }

    public function test_teacher_can_reschedule_and_cancel_group_session_notifying_paid_pupils(): void
    {
        Notification::fake();

        $teacher = User::factory()->teacher()->create();
        $pupil = User::factory()->pupil()->create();

        TeacherProfile::create([
            'user_id' => $teacher->id,
            'price' => 80000,
            'is_verified' => true,
        ]);

        $session = GroupSession::create([
            'teacher_id' => $teacher->id,
            'title' => 'Debate Club',
            'start_at' => Carbon::now('Asia/Tashkent')->addDays(2)->setTime(16, 0)->utc(),
            'end_at' => Carbon::now('Asia/Tashkent')->addDays(2)->setTime(17, 0)->utc(),
            'duration_minutes' => 60,
            'max_seats' => 5,
            'price_per_seat' => 35000,
            'status' => 'scheduled',
        ]);

        GroupSessionEnrollment::create([
            'group_session_id' => $session->id,
            'pupil_id' => $pupil->id,
            'status' => 'enrolled',
            'payment_status' => 'paid',
            'price_paid' => 35000,
        ]);

        $newStart = Carbon::now('Asia/Tashkent')->addDays(3)->setTime(18, 0);
        $this->actingAs($teacher)->putJson("/teacher/group-sessions/{$session->id}", [
            'start_at' => $newStart->format('Y-m-d H:i:s'),
            'duration_minutes' => 90,
        ])->assertOk();

        $this->assertSame(90, $session->fresh()->duration_minutes);
        Notification::assertSentTo($pupil, GroupSessionNotification::class, function (GroupSessionNotification $n) {
            return $n->eventType === 'rescheduled';
        });

        $this->actingAs($teacher)->postJson("/teacher/group-sessions/{$session->id}/cancel", [
            'reason' => 'Teacher emergency',
        ])->assertOk();

        $this->assertSame('cancelled', $session->fresh()->status);
        $this->assertSame('teacher', $session->fresh()->cancelled_by);

        Notification::assertSentTo($pupil, GroupSessionNotification::class, function (GroupSessionNotification $n) {
            return $n->eventType === 'cancelled';
        });
    }

    public function test_pupil_can_filter_teachers_by_group_format(): void
    {
        $pupil = User::factory()->pupil()->create();
        $groupTeacher = User::factory()->teacher()->create(['full_name' => 'Group Host Teacher']);
        $oneOnOneTeacher = User::factory()->teacher()->create(['full_name' => 'Solo Only Teacher']);

        TeacherProfile::create([
            'user_id' => $groupTeacher->id,
            'price' => 60000,
            'is_verified' => true,
            'preferred_session_format' => 'group',
            'supports_group_sessions' => true,
        ]);

        TeacherProfile::create([
            'user_id' => $oneOnOneTeacher->id,
            'price' => 60000,
            'is_verified' => true,
            'preferred_session_format' => 'one_on_one',
            'supports_group_sessions' => false,
        ]);

        $response = $this->actingAs($pupil)->get('/pupil/teachers?format=group');
        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->has('teachers.data', 1)
            ->where('teachers.data.0.id', $groupTeacher->id)
        );
    }

    public function test_teacher_sessions_page_includes_group_sessions_and_active_appointments(): void
    {
        $teacher = User::factory()->teacher()->create();
        TeacherProfile::create([
            'user_id' => $teacher->id,
            'price' => 60000,
            'is_verified' => true,
        ]);

        GroupSession::create([
            'teacher_id' => $teacher->id,
            'title' => 'Evening Fluency',
            'start_at' => now()->addDay(),
            'end_at' => now()->addDay()->addHour(),
            'duration_minutes' => 60,
            'max_seats' => 5,
            'price_per_seat' => 45000,
            'status' => 'scheduled',
        ]);

        $response = $this->actingAs($teacher)->get('/teacher/sessions');
        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('teacher/sessions')
            ->has('groupSessions', 1)
            ->has('activeAppointments')
        );
    }

    public function test_option_a_overrides_and_restores_free_slots_while_blocking_edits_on_group_slots_and_group_only_mode(): void
    {
        $teacher = User::factory()->teacher()->create();
        $pupil = User::factory()->pupil()->create();

        TeacherProfile::create([
            'user_id' => $teacher->id,
            'price' => 70000,
            'is_verified' => true,
            'preferred_session_format' => 'both',
            'supports_group_sessions' => true,
        ]);

        $monday = Carbon::parse('next monday', 'Asia/Tashkent');
        $customAvail = TeacherAvailability::create([
            'teacher_id' => $teacher->id,
            'type' => 'custom',
            'start_at' => $monday->copy()->setTime(9, 0)->utc(),
            'end_at' => $monday->copy()->setTime(13, 0)->utc(),
            'slot_duration' => 30,
            'is_active' => true,
        ]);

        // 1. Pending 1-on-1 booking at 12:00-13:00 blocks creating a group session there
        Appointment::create([
            'teacher_id' => $teacher->id,
            'pupil_id' => $pupil->id,
            'start_at' => $monday->copy()->setTime(12, 0)->utc(),
            'end_at' => $monday->copy()->setTime(13, 0)->utc(),
            'status' => 'pending',
        ]);

        $this->actingAs($teacher)->postJson('/teacher/group-sessions', [
            'title' => 'Blocked By Pending 1-on-1',
            'start_at' => $monday->copy()->setTime(12, 0)->format('Y-m-d H:i:s'),
            'duration_minutes' => 60,
            'max_seats' => 5,
            'price_per_seat' => 45000,
        ])->assertStatus(422);

        // 2. Creating Group Session on free slots (10:00-11:00) succeeds & hides 10:00/10:30 from 1-on-1
        $createRes = $this->actingAs($teacher)->postJson('/teacher/group-sessions', [
            'title' => 'Free Slot Override Club',
            'start_at' => $monday->copy()->setTime(10, 0)->format('Y-m-d H:i:s'),
            'duration_minutes' => 60,
            'max_seats' => 5,
            'price_per_seat' => 45000,
        ])->assertCreated();

        $gsId = $createRes->json('session.id');

        $slotService = app(SlotService::class);
        $starts = collect($slotService->getAvailableSlots($teacher->id, $monday->toDateString()))
            ->map(fn ($s) => Carbon::parse($s['start_at'])->setTimezone('Asia/Tashkent')->format('H:i'))
            ->all();

        $this->assertContains('09:00', $starts);
        $this->assertContains('09:30', $starts);
        $this->assertNotContains('10:00', $starts);
        $this->assertNotContains('10:30', $starts);
        $this->assertContains('11:00', $starts);

        // 3. Cannot edit whole availability block while group session occupies 10:00-11:00
        $this->actingAs($teacher)->put("/teacher/availability/{$customAvail->id}", [
            'type' => 'custom',
            'start_at' => $monday->copy()->setTime(9, 0)->format('Y-m-d H:i:s'),
            'end_at' => $monday->copy()->setTime(13, 0)->format('Y-m-d H:i:s'),
        ])->assertSessionHasErrors('range');

        // 4. Cannot delete the locked 10:00-11:00 slot range
        $this->actingAs($teacher)->delete("/teacher/availability/{$customAvail->id}", [
            'delete_type' => 'range',
            'range_start' => '10:00',
            'range_end' => '10:30',
        ])->assertSessionHasErrors('range');

        // 5. Deleting a FREE range (09:00-10:00) IS allowed
        $this->actingAs($teacher)->delete("/teacher/availability/{$customAvail->id}", [
            'delete_type' => 'range',
            'range_start' => '09:00',
            'range_end' => '10:00',
        ])->assertRedirect();

        $startsAfterFreeDelete = collect($slotService->getAvailableSlots($teacher->id, $monday->toDateString()))
            ->map(fn ($s) => Carbon::parse($s['start_at'])->setTimezone('Asia/Tashkent')->format('H:i'))
            ->all();
        $this->assertNotContains('09:00', $startsAfterFreeDelete);
        $this->assertContains('11:00', $startsAfterFreeDelete);

        // 6. Group Only hides open 1-on-1 slots; switching back to 'both' restores 1-on-1 slots
        $this->actingAs($teacher)->postJson('/teacher/session-format-preferences', [
            'preferred_session_format' => 'group',
        ])->assertOk();
        $this->assertSame([], $slotService->getAvailableSlots($teacher->id, $monday->toDateString()));

        $this->actingAs($teacher)->postJson('/teacher/session-format-preferences', [
            'preferred_session_format' => 'both',
        ])->assertOk();

        // 7. Cancelling the Group Session restores 10:00 & 10:30 open 1-on-1 slots automatically
        $this->actingAs($teacher)->postJson("/teacher/group-sessions/{$gsId}/cancel")
            ->assertOk();

        $restoredStarts = collect($slotService->getAvailableSlots($teacher->id, $monday->toDateString()))
            ->map(fn ($s) => Carbon::parse($s['start_at'])->setTimezone('Asia/Tashkent')->format('H:i'))
            ->all();
        $this->assertContains('10:00', $restoredStarts);
        $this->assertContains('10:30', $restoredStarts);
    }
}

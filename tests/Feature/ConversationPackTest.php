<?php

namespace Tests\Feature;

use App\Events\BookingUpdated;
use App\Models\Appointment;
use App\Models\PupilPackage;
use App\Models\TeacherAvailability;
use App\Models\TeacherPackage;
use App\Models\TeacherProfile;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

class ConversationPackTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Event::fake([BookingUpdated::class]);
    }

    public function test_teacher_can_create_conversation_pack(): void
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        TeacherProfile::create([
            'user_id' => $teacher->id,
            'is_verified' => true,
            'price' => 100000,
        ]);

        $response = $this->actingAs($teacher)->post('/teacher/packages', [
            'title' => '5-Hour Conversation Booster',
            'total_hours' => 5,
            'price' => 400000,
            'description' => 'Great discount for 5 hours of speaking practice',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('teacher_packages', [
            'teacher_id' => $teacher->id,
            'title' => '5-Hour Conversation Booster',
            'total_hours' => 5,
            'total_minutes' => 300,
            'price' => 400000,
            'is_active' => true,
        ]);
    }

    public function test_teacher_can_update_conversation_pack(): void
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        TeacherProfile::create([
            'user_id' => $teacher->id,
            'is_verified' => true,
            'price' => 100000,
        ]);

        $package = TeacherPackage::factory()->create([
            'teacher_id' => $teacher->id,
            'title' => 'Initial Pack',
            'total_hours' => 3,
            'total_minutes' => 180,
            'price' => 250000,
        ]);

        $response = $this->actingAs($teacher)->put("/teacher/packages/{$package->id}", [
            'title' => 'Updated 3-Hour Pack',
            'total_hours' => 3,
            'price' => 240000,
            'description' => 'Updated description',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('teacher_packages', [
            'id' => $package->id,
            'title' => 'Updated 3-Hour Pack',
            'price' => 240000,
        ]);
    }

    public function test_teacher_can_toggle_active_status(): void
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        TeacherProfile::create([
            'user_id' => $teacher->id,
            'is_verified' => true,
        ]);

        $package = TeacherPackage::factory()->create([
            'teacher_id' => $teacher->id,
            'is_active' => true,
        ]);

        $response = $this->actingAs($teacher)->post("/teacher/packages/{$package->id}/toggle");
        $response->assertRedirect();

        $this->assertDatabaseHas('teacher_packages', [
            'id' => $package->id,
            'is_active' => false,
        ]);

        $this->actingAs($teacher)->post("/teacher/packages/{$package->id}/toggle");
        $this->assertDatabaseHas('teacher_packages', [
            'id' => $package->id,
            'is_active' => true,
        ]);
    }

    public function test_teacher_cannot_manage_another_teachers_package(): void
    {
        $teacher1 = User::factory()->create(['role' => 'teacher']);
        $teacher2 = User::factory()->create(['role' => 'teacher']);

        $package = TeacherPackage::factory()->create([
            'teacher_id' => $teacher1->id,
            'title' => 'Teacher 1 Pack',
        ]);

        $response = $this->actingAs($teacher2)->put("/teacher/packages/{$package->id}", [
            'title' => 'Hacked Title',
            'total_hours' => 2,
            'price' => 10000,
        ]);

        $response->assertForbidden();
    }

    public function test_pupil_can_order_package_and_it_enters_verifying_state(): void
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        TeacherProfile::create([
            'user_id' => $teacher->id,
            'is_verified' => true,
            'price' => 100000,
        ]);

        $package = TeacherPackage::factory()->create([
            'teacher_id' => $teacher->id,
            'title' => '5 Hours Pack',
            'total_hours' => 5,
            'total_minutes' => 300,
            'price' => 450000,
            'is_active' => true,
        ]);

        $pupil = User::factory()->create(['role' => 'pupil']);

        $response = $this->actingAs($pupil)->post('/pupil/packages/purchase', [
            'teacher_package_id' => $package->id,
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('pupil_packages', [
            'pupil_id' => $pupil->id,
            'teacher_id' => $teacher->id,
            'teacher_package_id' => $package->id,
            'package_title' => '5 Hours Pack',
            'total_minutes' => 300,
            'remaining_minutes' => 300,
            'price_paid' => 450000,
            'payment_status' => 'verifying',
            'status' => 'pending',
        ]);
    }

    public function test_pupil_cannot_purchase_inactive_package_or_from_unverified_teacher(): void
    {
        $unverifiedTeacher = User::factory()->create(['role' => 'teacher']);
        TeacherProfile::create([
            'user_id' => $unverifiedTeacher->id,
            'is_verified' => false,
        ]);

        $package = TeacherPackage::factory()->create([
            'teacher_id' => $unverifiedTeacher->id,
            'is_active' => true,
        ]);

        $pupil = User::factory()->create(['role' => 'pupil']);

        $response = $this->actingAs($pupil)->postJson('/pupil/packages/purchase', [
            'teacher_package_id' => $package->id,
        ]);

        $response->assertStatus(422);
    }

    public function test_admin_can_confirm_package_payment(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $pupil = User::factory()->create(['role' => 'pupil']);
        $teacher = User::factory()->create(['role' => 'teacher']);

        $pupilPackage = PupilPackage::factory()->create([
            'pupil_id' => $pupil->id,
            'teacher_id' => $teacher->id,
            'total_minutes' => 180,
            'remaining_minutes' => 180,
            'payment_status' => 'verifying',
            'status' => 'pending',
        ]);

        $response = $this->actingAs($admin)->post("/admin/packages/{$pupilPackage->id}/confirm-payment");
        $response->assertRedirect();

        $this->assertDatabaseHas('pupil_packages', [
            'id' => $pupilPackage->id,
            'payment_status' => 'paid',
            'status' => 'active',
        ]);
    }

    public function test_admin_can_reject_package_payment_with_reason(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $pupil = User::factory()->create(['role' => 'pupil']);
        $teacher = User::factory()->create(['role' => 'teacher']);

        $pupilPackage = PupilPackage::factory()->create([
            'pupil_id' => $pupil->id,
            'teacher_id' => $teacher->id,
            'total_minutes' => 180,
            'remaining_minutes' => 180,
            'payment_status' => 'verifying',
            'status' => 'pending',
        ]);

        $response = $this->actingAs($admin)->post("/admin/packages/{$pupilPackage->id}/reject-payment", [
            'reason' => 'Payment receipt unreadable',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('pupil_packages', [
            'id' => $pupilPackage->id,
            'payment_status' => 'rejected',
            'status' => 'cancelled',
            'payment_rejection_reason' => 'Payment receipt unreadable',
        ]);
    }

    public function test_booking_with_active_package_sets_price_to_zero_and_deducts_minutes(): void
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        TeacherProfile::create([
            'user_id' => $teacher->id,
            'is_verified' => true,
            'price' => 150000,
        ]);

        TeacherAvailability::create([
            'teacher_id' => $teacher->id,
            'type' => 'recurring',
            'day_of_week' => 'monday',
            'start_time' => '09:00:00',
            'end_time' => '12:00:00',
            'slot_duration' => 60,
        ]);

        $pupil = User::factory()->create(['role' => 'pupil']);

        $pupilPackage = PupilPackage::factory()->create([
            'pupil_id' => $pupil->id,
            'teacher_id' => $teacher->id,
            'total_minutes' => 120,
            'remaining_minutes' => 120,
            'payment_status' => 'paid',
            'status' => 'active',
        ]);

        $startAt = Carbon::parse('next monday 09:00:00', 'Asia/Tashkent');
        $endAt = $startAt->copy()->addMinutes(60);

        $response = $this->actingAs($pupil)->postJson('/bookings', [
            'teacher_id' => $teacher->id,
            'pupil_id' => $pupil->id,
            'start_at' => $startAt->toDateTimeString(),
            'end_at' => $endAt->toDateTimeString(),
            'topics' => ['freestyle'],
        ]);

        $response->assertStatus(201);

        $this->assertDatabaseHas('appointments', [
            'teacher_id' => $teacher->id,
            'pupil_id' => $pupil->id,
            'price' => 0,
            'is_package_booking' => true,
            'payment_status' => 'paid',
            'pupil_package_id' => $pupilPackage->id,
            'status' => 'pending',
        ]);

        $this->assertDatabaseHas('pupil_packages', [
            'id' => $pupilPackage->id,
            'remaining_minutes' => 60,
            'status' => 'active',
        ]);
    }

    public function test_teacher_approval_of_package_booking_transitions_directly_to_confirmed(): void
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        TeacherProfile::create([
            'user_id' => $teacher->id,
            'is_verified' => true,
            'price' => 150000,
        ]);

        $pupil = User::factory()->create(['role' => 'pupil']);

        $pupilPackage = PupilPackage::factory()->create([
            'pupil_id' => $pupil->id,
            'teacher_id' => $teacher->id,
            'total_minutes' => 120,
            'remaining_minutes' => 60,
            'payment_status' => 'paid',
            'status' => 'active',
        ]);

        $startAt = Carbon::parse('next monday 09:00:00', 'Asia/Tashkent');
        $endAt = $startAt->copy()->addMinutes(60);

        $appointment = Appointment::create([
            'teacher_id' => $teacher->id,
            'pupil_id' => $pupil->id,
            'start_at' => $startAt,
            'end_at' => $endAt,
            'status' => 'pending',
            'price' => 0,
            'is_package_booking' => true,
            'payment_status' => 'paid',
            'pupil_package_id' => $pupilPackage->id,
        ]);

        $response = $this->actingAs($teacher)->postJson("/teacher/appointments/{$appointment->id}/approve");
        $response->assertOk();

        $this->assertDatabaseHas('appointments', [
            'id' => $appointment->id,
            'status' => 'confirmed',
        ]);
    }

    public function test_cancelling_package_booking_before_lesson_starts_refunds_minutes(): void
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        $pupil = User::factory()->create(['role' => 'pupil']);

        $pupilPackage = PupilPackage::factory()->create([
            'pupil_id' => $pupil->id,
            'teacher_id' => $teacher->id,
            'total_minutes' => 120,
            'remaining_minutes' => 60,
            'payment_status' => 'paid',
            'status' => 'active',
        ]);

        $startAt = Carbon::now()->addDays(2);
        $endAt = $startAt->copy()->addMinutes(60);

        $appointment = Appointment::create([
            'teacher_id' => $teacher->id,
            'pupil_id' => $pupil->id,
            'start_at' => $startAt,
            'end_at' => $endAt,
            'status' => 'pending',
            'price' => 0,
            'is_package_booking' => true,
            'payment_status' => 'paid',
            'pupil_package_id' => $pupilPackage->id,
        ]);

        $response = $this->actingAs($pupil)->deleteJson("/bookings/{$appointment->id}", [
            'reason' => 'Schedule change',
        ]);

        $response->assertOk();

        $this->assertDatabaseHas('appointments', [
            'id' => $appointment->id,
            'status' => 'cancelled',
        ]);

        $this->assertDatabaseHas('pupil_packages', [
            'id' => $pupilPackage->id,
            'remaining_minutes' => 120,
            'status' => 'active',
        ]);
    }

    public function test_teacher_rejecting_package_booking_refunds_minutes(): void
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        $pupil = User::factory()->create(['role' => 'pupil']);

        $pupilPackage = PupilPackage::factory()->create([
            'pupil_id' => $pupil->id,
            'teacher_id' => $teacher->id,
            'total_minutes' => 120,
            'remaining_minutes' => 60,
            'payment_status' => 'paid',
            'status' => 'active',
        ]);

        $startAt = Carbon::now()->addDays(1);
        $endAt = $startAt->copy()->addMinutes(60);

        $appointment = Appointment::create([
            'teacher_id' => $teacher->id,
            'pupil_id' => $pupil->id,
            'start_at' => $startAt,
            'end_at' => $endAt,
            'status' => 'pending',
            'price' => 0,
            'is_package_booking' => true,
            'payment_status' => 'paid',
            'pupil_package_id' => $pupilPackage->id,
        ]);

        $response = $this->actingAs($teacher)->postJson("/teacher/appointments/{$appointment->id}/reject", [
            'reason' => 'Teacher unavailable at that slot',
        ]);

        $response->assertOk();

        $this->assertDatabaseHas('appointments', [
            'id' => $appointment->id,
            'status' => 'rejected',
        ]);

        $this->assertDatabaseHas('pupil_packages', [
            'id' => $pupilPackage->id,
            'remaining_minutes' => 120,
        ]);
    }

    public function test_cancelling_package_booking_after_lesson_has_started_does_not_refund_minutes(): void
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        $pupil = User::factory()->create(['role' => 'pupil']);

        $pupilPackage = PupilPackage::factory()->create([
            'pupil_id' => $pupil->id,
            'teacher_id' => $teacher->id,
            'total_minutes' => 120,
            'remaining_minutes' => 60,
            'payment_status' => 'paid',
            'status' => 'active',
        ]);

        $startAt = Carbon::now()->subMinutes(10);
        $endAt = $startAt->copy()->addMinutes(60);

        $appointment = Appointment::create([
            'teacher_id' => $teacher->id,
            'pupil_id' => $pupil->id,
            'start_at' => $startAt,
            'end_at' => $endAt,
            'status' => 'confirmed',
            'price' => 0,
            'is_package_booking' => true,
            'payment_status' => 'paid',
            'pupil_package_id' => $pupilPackage->id,
        ]);

        $response = $this->actingAs($pupil)->deleteJson("/bookings/{$appointment->id}", [
            'reason' => 'Lesson already passed',
        ]);

        $response->assertOk();

        $this->assertDatabaseHas('pupil_packages', [
            'id' => $pupilPackage->id,
            'remaining_minutes' => 60,
        ]);
    }

    public function test_booking_falls_back_to_standard_rate_when_package_minutes_are_insufficient(): void
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        TeacherProfile::create([
            'user_id' => $teacher->id,
            'is_verified' => true,
            'price' => 120000,
        ]);

        TeacherAvailability::create([
            'teacher_id' => $teacher->id,
            'type' => 'recurring',
            'day_of_week' => 'monday',
            'start_time' => '09:00:00',
            'end_time' => '12:00:00',
            'slot_duration' => 60,
        ]);

        $pupil = User::factory()->create(['role' => 'pupil']);

        $pupilPackage = PupilPackage::factory()->create([
            'pupil_id' => $pupil->id,
            'teacher_id' => $teacher->id,
            'total_minutes' => 60,
            'remaining_minutes' => 30, // only 30 minutes left, but slot is 60 minutes
            'payment_status' => 'paid',
            'status' => 'active',
        ]);

        $startAt = Carbon::parse('next monday 09:00:00', 'Asia/Tashkent');
        $endAt = $startAt->copy()->addMinutes(60);

        $response = $this->actingAs($pupil)->postJson('/bookings', [
            'teacher_id' => $teacher->id,
            'pupil_id' => $pupil->id,
            'start_at' => $startAt->toDateTimeString(),
            'end_at' => $endAt->toDateTimeString(),
            'topics' => ['freestyle'],
        ]);

        $response->assertStatus(201);

        $this->assertDatabaseHas('appointments', [
            'teacher_id' => $teacher->id,
            'pupil_id' => $pupil->id,
            'price' => 120000,
            'is_package_booking' => false,
            'payment_status' => 'pending',
            'pupil_package_id' => null,
            'status' => 'pending',
        ]);

        $this->assertDatabaseHas('pupil_packages', [
            'id' => $pupilPackage->id,
            'remaining_minutes' => 30,
        ]);
    }
}

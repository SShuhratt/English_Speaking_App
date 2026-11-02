<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\OffPlatformReport;
use App\Models\TeacherAvailability;
use App\Models\TeacherProfile;
use App\Models\User;
use App\Models\UserDiscountVoucher;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OffPlatformReportTest extends TestCase
{
    use RefreshDatabase;

    private User $pupil;

    private User $teacher;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->pupil = User::factory()->create(['role' => 'pupil']);
        $this->teacher = User::factory()->create(['role' => 'teacher']);
        $this->admin = User::factory()->create(['role' => 'admin']);

        TeacherProfile::factory()->create([
            'user_id' => $this->teacher->id,
            'is_verified' => true,
            'price' => 120000,
        ]);
    }

    public function test_pupil_can_submit_report_for_completed_appointment(): void
    {
        $appointment = Appointment::create([
            'teacher_id' => $this->teacher->id,
            'pupil_id' => $this->pupil->id,
            'start_at' => now()->subHours(2),
            'end_at' => now()->subHour(),
            'status' => 'completed',
            'duration_minutes' => 60,
            'price' => 120000,
        ]);

        $response = $this->actingAs($this->pupil)->post(route('off-platform-reports.store'), [
            'appointment_id' => $appointment->id,
            'reported_contact' => '@bad_teacher_tg',
            'description' => 'The teacher verbally told me to pay directly via Click and message them on Telegram.',
        ]);

        $response->assertSessionHasNoErrors();
        $this->assertDatabaseHas('off_platform_reports', [
            'appointment_id' => $appointment->id,
            'pupil_id' => $this->pupil->id,
            'teacher_id' => $this->teacher->id,
            'reported_contact' => '@bad_teacher_tg',
            'status' => 'pending',
        ]);
    }

    public function test_pupil_cannot_report_future_or_incomplete_appointment(): void
    {
        $appointment = Appointment::create([
            'teacher_id' => $this->teacher->id,
            'pupil_id' => $this->pupil->id,
            'start_at' => now()->addDay(),
            'end_at' => now()->addDay()->addHour(),
            'status' => 'pending',
            'duration_minutes' => 60,
            'price' => 120000,
        ]);

        $response = $this->actingAs($this->pupil)->post(route('off-platform-reports.store'), [
            'appointment_id' => $appointment->id,
            'reported_contact' => '@telegram_handle',
            'description' => 'Teacher asked to cancel and do off-platform lesson.',
        ]);

        $response->assertSessionHasErrors(['appointment_id']);
        $this->assertDatabaseMissing('off_platform_reports', [
            'appointment_id' => $appointment->id,
        ]);
    }

    public function test_pupil_cannot_report_appointment_they_did_not_participate_in(): void
    {
        $otherPupil = User::factory()->create(['role' => 'pupil']);

        $appointment = Appointment::create([
            'teacher_id' => $this->teacher->id,
            'pupil_id' => $otherPupil->id,
            'start_at' => now()->subHours(2),
            'end_at' => now()->subHour(),
            'status' => 'completed',
            'duration_minutes' => 60,
            'price' => 120000,
        ]);

        $response = $this->actingAs($this->pupil)->post(route('off-platform-reports.store'), [
            'appointment_id' => $appointment->id,
            'reported_contact' => '@telegram_handle',
            'description' => 'Fraudulent report on someone else session.',
        ]);

        $response->assertStatus(403);
    }

    public function test_pupil_cannot_report_same_appointment_twice(): void
    {
        $appointment = Appointment::create([
            'teacher_id' => $this->teacher->id,
            'pupil_id' => $this->pupil->id,
            'start_at' => now()->subHours(2),
            'end_at' => now()->subHour(),
            'status' => 'completed',
            'duration_minutes' => 60,
            'price' => 120000,
        ]);

        OffPlatformReport::create([
            'appointment_id' => $appointment->id,
            'pupil_id' => $this->pupil->id,
            'teacher_id' => $this->teacher->id,
            'reported_contact' => '@telegram_handle',
            'description' => 'First report.',
            'status' => 'pending',
        ]);

        $response = $this->actingAs($this->pupil)->post(route('off-platform-reports.store'), [
            'appointment_id' => $appointment->id,
            'reported_contact' => '@telegram_handle',
            'description' => 'Second duplicate report attempt.',
        ]);

        $response->assertSessionHasErrors(['appointment_id']);
    }

    public function test_pupil_cannot_report_same_teacher_multiple_times(): void
    {
        $firstAppointment = Appointment::create([
            'teacher_id' => $this->teacher->id,
            'pupil_id' => $this->pupil->id,
            'start_at' => now()->subDays(2),
            'end_at' => now()->subDays(2)->addHour(),
            'status' => 'completed',
            'duration_minutes' => 60,
            'price' => 120000,
        ]);

        OffPlatformReport::create([
            'appointment_id' => $firstAppointment->id,
            'pupil_id' => $this->pupil->id,
            'teacher_id' => $this->teacher->id,
            'reported_contact' => '@teacher_contact',
            'description' => 'Report for first appointment.',
            'status' => 'pending',
        ]);

        $secondAppointment = Appointment::create([
            'teacher_id' => $this->teacher->id,
            'pupil_id' => $this->pupil->id,
            'start_at' => now()->subHours(2),
            'end_at' => now()->subHour(),
            'status' => 'completed',
            'duration_minutes' => 60,
            'price' => 120000,
        ]);

        $response = $this->actingAs($this->pupil)->post(route('off-platform-reports.store'), [
            'appointment_id' => $secondAppointment->id,
            'reported_contact' => '@teacher_contact',
            'description' => 'Attempting a second bounty for the same teacher.',
        ]);

        $response->assertSessionHasErrors(['reported_contact']);
    }

    public function test_admin_can_verify_report_and_award_100_percent_voucher(): void
    {
        $appointment = Appointment::create([
            'teacher_id' => $this->teacher->id,
            'pupil_id' => $this->pupil->id,
            'start_at' => now()->subHours(2),
            'end_at' => now()->subHour(),
            'status' => 'completed',
            'duration_minutes' => 60,
            'price' => 120000,
        ]);

        $report = OffPlatformReport::create([
            'appointment_id' => $appointment->id,
            'pupil_id' => $this->pupil->id,
            'teacher_id' => $this->teacher->id,
            'reported_contact' => '@poacher_teacher',
            'description' => 'Offered direct classes outside platform.',
            'status' => 'pending',
        ]);

        $response = $this->actingAs($this->admin)->post(route('admin.off-platform-reports.verify', $report->id), [
            'admin_notes' => 'Contacted via test Telegram account, teacher confirmed off-platform classes.',
        ]);

        $response->assertSessionHasNoErrors();

        $report->refresh();
        $this->assertEquals('verified', $report->status);
        $this->assertEquals($this->admin->id, $report->reviewed_by);
        $this->assertNotNull($report->rewarded_voucher_id);

        $voucher = UserDiscountVoucher::find($report->rewarded_voucher_id);
        $this->assertNotNull($voucher);
        $this->assertEquals($this->pupil->id, $voucher->user_id);
        $this->assertEquals(100, $voucher->discount_percent);
        $this->assertFalse($voucher->is_redeemed);
        $this->assertStringStartsWith('BOUNTY-', $voucher->voucher_code);
    }

    public function test_admin_can_reject_report(): void
    {
        $appointment = Appointment::create([
            'teacher_id' => $this->teacher->id,
            'pupil_id' => $this->pupil->id,
            'start_at' => now()->subHours(2),
            'end_at' => now()->subHour(),
            'status' => 'completed',
            'duration_minutes' => 60,
            'price' => 120000,
        ]);

        $report = OffPlatformReport::create([
            'appointment_id' => $appointment->id,
            'pupil_id' => $this->pupil->id,
            'teacher_id' => $this->teacher->id,
            'reported_contact' => '@fake_contact',
            'description' => 'Unsubstantiated report.',
            'status' => 'pending',
        ]);

        $response = $this->actingAs($this->admin)->post(route('admin.off-platform-reports.reject', $report->id), [
            'admin_notes' => 'No violation found.',
        ]);

        $response->assertSessionHasNoErrors();

        $report->refresh();
        $this->assertEquals('rejected', $report->status);
        $this->assertNull($report->rewarded_voucher_id);
    }

    public function test_pupil_can_book_free_session_using_bounty_voucher_and_it_cannot_be_reused(): void
    {
        TeacherAvailability::create([
            'teacher_id' => $this->teacher->id,
            'type' => 'recurring',
            'day_of_week' => 'monday',
            'start_time' => '08:00:00',
            'end_time' => '22:00:00',
            'slot_duration' => 60,
        ]);

        $voucher = UserDiscountVoucher::create([
            'user_id' => $this->pupil->id,
            'voucher_code' => 'BOUNTY-FREE99',
            'discount_percent' => 100,
            'xp_spent' => 0,
            'is_redeemed' => false,
        ]);

        $startAt = Carbon::parse('next monday 10:00:00', 'Asia/Tashkent');
        $endAt = $startAt->copy()->addMinutes(60);

        // 1. Book session with 100% voucher
        $response = $this->actingAs($this->pupil)->postJson(route('bookings.store'), [
            'teacher_id' => $this->teacher->id,
            'pupil_id' => $this->pupil->id,
            'start_at' => $startAt->toIso8601String(),
            'end_at' => $endAt->toIso8601String(),
            'duration_minutes' => 60,
            'topics' => ['general_english'],
            'voucher_code' => 'bounty-free99',
        ]);

        $response->assertStatus(201);
        $appointment = $response->json('data');

        $this->assertEquals(0, $appointment['price']);
        $this->assertEquals('paid', $appointment['payment_status']);
        $this->assertEquals(120000, $appointment['discount_amount']);

        $voucher->refresh();
        $this->assertTrue($voucher->is_redeemed);
        $this->assertNotNull($voucher->redeemed_at);

        // 2. Try to reuse the same voucher - must fail
        $secondStartAt = Carbon::parse('next monday 14:00:00', 'Asia/Tashkent');
        $secondEndAt = $secondStartAt->copy()->addMinutes(60);

        $secondResponse = $this->actingAs($this->pupil)->postJson(route('bookings.store'), [
            'teacher_id' => $this->teacher->id,
            'pupil_id' => $this->pupil->id,
            'start_at' => $secondStartAt->toIso8601String(),
            'end_at' => $secondEndAt->toIso8601String(),
            'duration_minutes' => 60,
            'topics' => ['general_english'],
            'voucher_code' => 'bounty-free99',
        ]);

        $secondResponse->assertStatus(422);
    }

    public function test_cancelling_voucher_appointment_before_start_refunds_the_voucher(): void
    {
        TeacherAvailability::create([
            'teacher_id' => $this->teacher->id,
            'type' => 'recurring',
            'day_of_week' => 'monday',
            'start_time' => '08:00:00',
            'end_time' => '22:00:00',
            'slot_duration' => 60,
        ]);

        $voucher = UserDiscountVoucher::create([
            'user_id' => $this->pupil->id,
            'voucher_code' => 'BOUNTY-RESTORE',
            'discount_percent' => 100,
            'xp_spent' => 0,
            'is_redeemed' => false,
        ]);

        $startAt = Carbon::parse('next monday 16:00:00', 'Asia/Tashkent');
        $endAt = $startAt->copy()->addMinutes(60);

        $response = $this->actingAs($this->pupil)->postJson(route('bookings.store'), [
            'teacher_id' => $this->teacher->id,
            'pupil_id' => $this->pupil->id,
            'start_at' => $startAt->toIso8601String(),
            'end_at' => $endAt->toIso8601String(),
            'duration_minutes' => 60,
            'topics' => ['ielts_speaking'],
            'voucher_code' => 'bounty-restore',
        ]);

        $response->assertStatus(201);
        $appointmentId = $response->json('data.id');

        $voucher->refresh();
        $this->assertTrue($voucher->is_redeemed);

        // Cancel the appointment
        $cancelResponse = $this->actingAs($this->pupil)->deleteJson("/bookings/{$appointmentId}", [
            'reason' => 'Schedule changed',
        ]);

        $cancelResponse->assertStatus(200);

        $voucher->refresh();
        $this->assertFalse($voucher->is_redeemed, 'Voucher should be restored if appointment cancelled before start');
        $this->assertNull($voucher->appointment_id);
    }
}

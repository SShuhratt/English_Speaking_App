<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\TeacherAvailability;
use App\Models\User;
use App\Notifications\AdminConfirmedNotification;
use App\Notifications\AppointmentCancelledNotification;
use App\Notifications\AppointmentRejectedNotification;
use App\Notifications\BookingRequestedNotification;
use App\Notifications\TeacherApprovedNotification;
use App\Services\BookingService;
use App\Support\PlatformTime;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class BookingNotificationWorkflowTest extends TestCase
{
    use RefreshDatabase;

    protected User $teacher;

    protected User $pupil;

    protected BookingService $service;

    protected function setUp(): void
    {
        parent::setUp();

        $this->service = app(BookingService::class);

        $this->teacher = User::factory()->create([
            'role' => 'teacher',
            'full_name' => 'John Teacher',
            'email' => 'teacher@example.com',
            'telegram_chat_id' => '111222',
        ]);
        $this->teacher->teacherProfile()->create(['price' => 100000]);

        $this->pupil = User::factory()->create([
            'role' => 'pupil',
            'full_name' => 'Alice Pupil',
            'email' => 'pupil@example.com',
            'telegram_chat_id' => '333444',
        ]);
        $this->pupil->pupilProfile()->create([]);
    }

    public function test_pupil_booking_dispatches_booking_requested_notification_to_teacher(): void
    {
        Notification::fake();

        $start = PlatformTime::localNow()->addDays(2)->setHour(14)->setMinute(0)->setSecond(0);
        $end = (clone $start)->addHour();

        TeacherAvailability::create([
            'teacher_id' => $this->teacher->id,
            'type' => 'custom',
            'start_at' => PlatformTime::toUtc($start),
            'end_at' => PlatformTime::toUtc($end),
            'slot_duration' => 60,
            'is_active' => true,
        ]);

        $appointment = $this->service->book(
            $this->pupil,
            $this->teacher,
            $start->toDateTimeString(),
            $end->toDateTimeString(),
            ['topics' => ['freestyle']]
        );

        Notification::assertSentTo(
            $this->teacher,
            BookingRequestedNotification::class,
            function (BookingRequestedNotification $notification) use ($appointment) {
                return $notification->appointment->id === $appointment->id;
            }
        );

        Notification::assertNotSentTo($this->pupil, BookingRequestedNotification::class);
    }

    public function test_teacher_approval_dispatches_teacher_approved_notification_to_pupil(): void
    {
        Notification::fake();

        $appointment = Appointment::create([
            'teacher_id' => $this->teacher->id,
            'pupil_id' => $this->pupil->id,
            'start_at' => PlatformTime::now()->addDays(2),
            'end_at' => PlatformTime::now()->addDays(2)->addHour(),
            'status' => 'pending',
            'price' => 100000,
        ]);

        $this->service->approve($appointment->id, $this->teacher->id);

        Notification::assertSentTo(
            $this->pupil,
            TeacherApprovedNotification::class,
            function (TeacherApprovedNotification $notification) use ($appointment) {
                return $notification->appointment->id === $appointment->id;
            }
        );

        Notification::assertNotSentTo($this->teacher, TeacherApprovedNotification::class);
    }

    public function test_admin_confirm_payment_dispatches_admin_confirmed_notification_to_both(): void
    {
        Notification::fake();

        $appointment = Appointment::create([
            'teacher_id' => $this->teacher->id,
            'pupil_id' => $this->pupil->id,
            'start_at' => PlatformTime::now()->addDays(2),
            'end_at' => PlatformTime::now()->addDays(2)->addHour(),
            'status' => 'accepted',
            'payment_status' => 'verifying',
            'price' => 100000,
        ]);

        $this->service->adminConfirmPayment($appointment->id);

        Notification::assertSentTo(
            $this->teacher,
            AdminConfirmedNotification::class,
            function (AdminConfirmedNotification $notification) use ($appointment) {
                return $notification->appointment->id === $appointment->id;
            }
        );

        Notification::assertSentTo(
            $this->pupil,
            AdminConfirmedNotification::class,
            function (AdminConfirmedNotification $notification) use ($appointment) {
                return $notification->appointment->id === $appointment->id;
            }
        );
    }

    public function test_teacher_rejection_dispatches_rejected_notification_with_reason(): void
    {
        Notification::fake();

        $appointment = Appointment::create([
            'teacher_id' => $this->teacher->id,
            'pupil_id' => $this->pupil->id,
            'start_at' => PlatformTime::now()->addDays(2),
            'end_at' => PlatformTime::now()->addDays(2)->addHour(),
            'status' => 'pending',
            'price' => 100000,
        ]);

        $reason = 'Unexpected schedule conflict.';
        $this->service->reject($appointment->id, $reason, $this->teacher->id);

        Notification::assertSentTo(
            $this->pupil,
            AppointmentRejectedNotification::class,
            function (AppointmentRejectedNotification $notification) use ($appointment, $reason) {
                return $notification->appointment->id === $appointment->id
                    && $notification->reason === $reason;
            }
        );
    }

    public function test_admin_reject_payment_dispatches_rejected_notification(): void
    {
        Notification::fake();

        $appointment = Appointment::create([
            'teacher_id' => $this->teacher->id,
            'pupil_id' => $this->pupil->id,
            'start_at' => PlatformTime::now()->addDays(2),
            'end_at' => PlatformTime::now()->addDays(2)->addHour(),
            'status' => 'accepted',
            'payment_status' => 'verifying',
            'price' => 100000,
        ]);

        $reason = 'Payment receipt was blurry and unreadable.';
        $this->service->adminRejectPayment($appointment->id, $reason);

        Notification::assertSentTo(
            $this->pupil,
            AppointmentRejectedNotification::class,
            function (AppointmentRejectedNotification $notification) use ($appointment, $reason) {
                return $notification->appointment->id === $appointment->id
                    && $notification->reason === $reason;
            }
        );
    }

    public function test_pupil_cancellation_dispatches_cancelled_notification_to_teacher(): void
    {
        Notification::fake();

        $appointment = Appointment::create([
            'teacher_id' => $this->teacher->id,
            'pupil_id' => $this->pupil->id,
            'start_at' => PlatformTime::now()->addDays(2),
            'end_at' => PlatformTime::now()->addDays(2)->addHour(),
            'status' => 'accepted',
            'price' => 100000,
        ]);

        $reason = 'Emergency at work.';
        $this->service->cancel($appointment->id, $reason, $this->pupil->id);

        Notification::assertSentTo(
            $this->teacher,
            AppointmentCancelledNotification::class,
            function (AppointmentCancelledNotification $notification) use ($appointment, $reason) {
                return $notification->appointment->id === $appointment->id
                    && $notification->reason === $reason
                    && $notification->cancelledByName === 'Alice Pupil';
            }
        );

        Notification::assertNotSentTo($this->pupil, AppointmentCancelledNotification::class);
    }

    public function test_teacher_cancellation_dispatches_cancelled_notification_to_pupil(): void
    {
        Notification::fake();

        $appointment = Appointment::create([
            'teacher_id' => $this->teacher->id,
            'pupil_id' => $this->pupil->id,
            'start_at' => PlatformTime::now()->addDays(2),
            'end_at' => PlatformTime::now()->addDays(2)->addHour(),
            'status' => 'accepted',
            'price' => 100000,
        ]);

        $reason = 'Illness and voice loss.';
        $this->service->cancel($appointment->id, $reason, $this->teacher->id);

        Notification::assertSentTo(
            $this->pupil,
            AppointmentCancelledNotification::class,
            function (AppointmentCancelledNotification $notification) use ($appointment, $reason) {
                return $notification->appointment->id === $appointment->id
                    && $notification->reason === $reason
                    && $notification->cancelledByName === 'John Teacher';
            }
        );

        Notification::assertNotSentTo($this->teacher, AppointmentCancelledNotification::class);
    }
}

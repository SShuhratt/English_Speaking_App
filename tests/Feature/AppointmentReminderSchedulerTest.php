<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\User;
use App\Notifications\Channels\SmsChannel;
use App\Notifications\Channels\TelegramChannel;
use App\Notifications\ConversationFiveMinuteReminderNotification;
use App\Notifications\ConversationStartedNotification;
use App\Support\PlatformTime;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class AppointmentReminderSchedulerTest extends TestCase
{
    use RefreshDatabase;

    protected User $teacher;

    protected User $pupil;

    protected function setUp(): void
    {
        parent::setUp();

        $this->teacher = User::factory()->create([
            'role' => 'teacher',
            'full_name' => 'Teacher Dave',
            'email' => 'teacher.dave@example.com',
            'phone_number' => '+998901112233',
            'telegram_chat_id' => '998877',
        ]);

        $this->pupil = User::factory()->create([
            'role' => 'pupil',
            'full_name' => 'Pupil Sarah',
            'email' => 'pupil.sarah@example.com',
            'phone_number' => '+998904445566',
            'telegram_chat_id' => '665544',
        ]);
    }

    public function test_scheduler_dispatches_5_minute_reminder_and_marks_sent_at(): void
    {
        Notification::fake();

        $now = PlatformTime::now();

        // Appointment starting in 5 minutes
        $appointment = Appointment::create([
            'teacher_id' => $this->teacher->id,
            'pupil_id' => $this->pupil->id,
            'start_at' => $now->copy()->addMinutes(5),
            'end_at' => $now->copy()->addMinutes(35),
            'status' => 'confirmed',
            'price' => 50000,
            'google_meet_link' => 'https://meet.google.com/abc-defg-hij',
        ]);

        $this->artisan('appointments:send-reminders')
            ->assertExitCode(0);

        Notification::assertSentTo(
            $this->teacher,
            ConversationFiveMinuteReminderNotification::class,
            function (ConversationFiveMinuteReminderNotification $notification) use ($appointment) {
                return $notification->appointment->id === $appointment->id;
            }
        );

        Notification::assertSentTo(
            $this->pupil,
            ConversationFiveMinuteReminderNotification::class,
            function (ConversationFiveMinuteReminderNotification $notification) use ($appointment) {
                return $notification->appointment->id === $appointment->id;
            }
        );

        $fresh = $appointment->fresh();
        $this->assertNotNull($fresh->reminder_5min_sent_at);
        $this->assertNull($fresh->reminder_started_sent_at);
    }

    public function test_scheduler_dispatches_session_started_reminder_and_marks_sent_at(): void
    {
        Notification::fake();

        $now = PlatformTime::now();

        // Appointment that started 2 minutes ago
        $appointment = Appointment::create([
            'teacher_id' => $this->teacher->id,
            'pupil_id' => $this->pupil->id,
            'start_at' => $now->copy()->subMinutes(2),
            'end_at' => $now->copy()->addMinutes(28),
            'status' => 'confirmed',
            'price' => 50000,
            'google_meet_link' => 'https://meet.google.com/xyz-uvwx-rst',
        ]);

        $this->artisan('appointments:send-reminders')
            ->assertExitCode(0);

        Notification::assertSentTo(
            $this->teacher,
            ConversationStartedNotification::class,
            function (ConversationStartedNotification $notification) use ($appointment) {
                return $notification->appointment->id === $appointment->id;
            }
        );

        Notification::assertSentTo(
            $this->pupil,
            ConversationStartedNotification::class,
            function (ConversationStartedNotification $notification) use ($appointment) {
                return $notification->appointment->id === $appointment->id;
            }
        );

        $fresh = $appointment->fresh();
        $this->assertNotNull($fresh->reminder_started_sent_at);
    }

    public function test_scheduler_excludes_unconfirmed_or_cancelled_appointments(): void
    {
        Notification::fake();

        $now = PlatformTime::now();

        Appointment::create([
            'teacher_id' => $this->teacher->id,
            'pupil_id' => $this->pupil->id,
            'start_at' => $now->copy()->addMinutes(5),
            'end_at' => $now->copy()->addMinutes(35),
            'status' => 'pending',
            'price' => 50000,
        ]);

        Appointment::create([
            'teacher_id' => $this->teacher->id,
            'pupil_id' => $this->pupil->id,
            'start_at' => $now->copy()->addMinutes(5),
            'end_at' => $now->copy()->addMinutes(35),
            'status' => 'cancelled',
            'price' => 50000,
        ]);

        $this->artisan('appointments:send-reminders')
            ->assertExitCode(0);

        Notification::assertNothingSent();
    }

    public function test_scheduler_is_strictly_idempotent(): void
    {
        Notification::fake();

        $now = PlatformTime::now();

        Appointment::create([
            'teacher_id' => $this->teacher->id,
            'pupil_id' => $this->pupil->id,
            'start_at' => $now->copy()->addMinutes(5),
            'end_at' => $now->copy()->addMinutes(35),
            'status' => 'confirmed',
            'price' => 50000,
        ]);

        // Run 3 times in a row
        $this->artisan('appointments:send-reminders')->assertExitCode(0);
        $this->artisan('appointments:send-reminders')->assertExitCode(0);
        $this->artisan('appointments:send-reminders')->assertExitCode(0);

        // Should have sent exactly 1 notification to teacher and 1 to pupil
        Notification::assertSentTimes(ConversationFiveMinuteReminderNotification::class, 2);
    }

    public function test_five_minute_reminder_uses_all_available_channels_email_telegram_and_sms(): void
    {
        $appointment = Appointment::create([
            'teacher_id' => $this->teacher->id,
            'pupil_id' => $this->pupil->id,
            'start_at' => PlatformTime::now()->addMinutes(5),
            'end_at' => PlatformTime::now()->addMinutes(35),
            'status' => 'confirmed',
            'price' => 50000,
            'google_meet_link' => 'https://meet.google.com/abc-defg-hij',
        ]);

        $notification = new ConversationFiveMinuteReminderNotification($appointment);

        // User with Email, Telegram, and Phone receives via ALL 3 channels
        $channels = $notification->via($this->pupil);
        $this->assertContains('mail', $channels);
        $this->assertContains(TelegramChannel::class, $channels);
        $this->assertContains(SmsChannel::class, $channels);
        $this->assertCount(3, $channels);

        // Verify payload contents for each channel
        $mail = $notification->toMail($this->pupil);
        $this->assertEquals('Your English Speaking Session Starts in 5 Minutes!', $mail->subject);
        $this->assertEquals('https://meet.google.com/abc-defg-hij', $mail->actionUrl);

        $telegram = $notification->toTelegram($this->pupil);
        $this->assertStringContainsString('Starting in 5 Minutes!', $telegram);
        $this->assertStringContainsString('https://meet.google.com/abc-defg-hij', $telegram);

        $sms = $notification->toSms($this->pupil);
        $this->assertStringContainsString('starts in 5 minutes', $sms);
        $this->assertStringContainsString('https://meet.google.com/abc-defg-hij', $sms);
    }
}

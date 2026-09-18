<?php

namespace Tests\Feature;

use App\Models\User;
use App\Notifications\WelcomeNotification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Laravel\Fortify\Features;
use Tests\TestCase;

class WelcomeNotificationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->skipUnlessFortifyHas(Features::registration());
    }

    public function test_pupil_registration_dispatches_queued_welcome_notification(): void
    {
        Notification::fake();

        $response = $this->post(route('register.store'), [
            'name' => 'Alice Pupil',
            'email' => 'alice@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
            'role' => 'pupil',
            'age' => 17,
            'phone_number' => '+998901234567',
            'level' => 'pre-intermediate',
        ]);

        $response->assertSessionHasNoErrors();
        $this->assertAuthenticated();
        $response->assertRedirect(route('dashboard', absolute: false));

        $user = User::where('email', 'alice@example.com')->first();
        $this->assertNotNull($user);

        Notification::assertSentTo($user, WelcomeNotification::class, function (WelcomeNotification $notification) use ($user) {
            $this->assertInstanceOf(ShouldQueue::class, $notification);
            $this->assertSame('pupil', $notification->role);

            $mail = $notification->toMail($user);
            $this->assertStringContainsString('Welcome to ConvoMate, Alice Pupil!', $mail->subject);
            $this->assertStringContainsString('Hello Alice Pupil!', $mail->greeting);
            $this->assertStringContainsString('Find a Teacher', implode(' ', $mail->introLines));
            $this->assertStringContainsString('Book a Lesson', implode(' ', $mail->introLines));
            $this->assertStringContainsString('Connect Telegram', implode(' ', $mail->introLines));
            $this->assertSame('Go to Dashboard', $mail->actionText);
            $this->assertSame(url('/dashboard'), $mail->actionUrl);

            return true;
        });
    }

    public function test_teacher_registration_dispatches_queued_welcome_notification(): void
    {
        Notification::fake();

        $response = $this->post(route('register.store'), [
            'name' => 'Bob Teacher',
            'email' => 'bob@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
            'role' => 'teacher',
            'age' => 29,
            'phone_number' => '+998909876543',
            'overall_level' => 'IELTS 8.0',
            'speaking_band' => 8.0,
        ]);

        $response->assertSessionHasNoErrors();
        $this->assertAuthenticated();
        $response->assertRedirect(route('dashboard', absolute: false));

        $user = User::where('email', 'bob@example.com')->first();
        $this->assertNotNull($user);

        Notification::assertSentTo($user, WelcomeNotification::class, function (WelcomeNotification $notification) use ($user) {
            $this->assertInstanceOf(ShouldQueue::class, $notification);
            $this->assertSame('teacher', $notification->role);

            $mail = $notification->toMail($user);
            $this->assertStringContainsString('Welcome to ConvoMate, Bob Teacher!', $mail->subject);
            $this->assertStringContainsString('Hello Bob Teacher!', $mail->greeting);
            $this->assertStringContainsString('Complete Your Profile', implode(' ', $mail->introLines));
            $this->assertStringContainsString('Set Your Availability', implode(' ', $mail->introLines));
            $this->assertStringContainsString('Connect Calendar & Telegram', implode(' ', $mail->introLines));
            $this->assertSame('Go to Dashboard', $mail->actionText);
            $this->assertSame(url('/dashboard'), $mail->actionUrl);

            return true;
        });
    }

    public function test_failed_registration_does_not_dispatch_welcome_notification(): void
    {
        Notification::fake();

        $response = $this->post(route('register.store'), [
            'name' => 'Invalid User',
            'email' => 'invalid@example.com',
            'password' => 'password123!A',
            'password_confirmation' => 'mismatch-pass',
            'role' => 'pupil',
        ]);

        $response->assertSessionHasErrors(['password']);
        $this->assertGuest();

        Notification::assertNothingSent();
    }

    public function test_fallback_copy_for_unspecified_role(): void
    {
        $user = new User([
            'name' => 'John Doe',
            'email' => 'john@example.com',
        ]);

        $notification = new WelcomeNotification(null);
        $mail = $notification->toMail($user);

        $this->assertStringContainsString('Welcome to ConvoMate, John Doe!', $mail->subject);
        $this->assertStringContainsString('explore English speaking sessions', implode(' ', $mail->introLines));
        $this->assertSame('Go to Dashboard', $mail->actionText);
        $this->assertSame(url('/dashboard'), $mail->actionUrl);
    }
}

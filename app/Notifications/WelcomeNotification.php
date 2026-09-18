<?php

namespace App\Notifications;

use App\Notifications\Concerns\HasNotificationTips;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class WelcomeNotification extends Notification implements ShouldQueue
{
    use HasNotificationTips, Queueable;

    public int $tries = 3;

    public int $backoff = 60;

    public function __construct(
        public ?string $role = null
    ) {}

    /**
     * Get the notification delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $name = ! empty($notifiable->name) ? $notifiable->name : 'there';
        $normalizedRole = strtolower((string) ($this->role ?? $notifiable->role ?? ''));

        $mail = (new MailMessage)
            ->subject("Welcome to ConvoMate, {$name}!")
            ->greeting("Hello {$name}!");

        if ($normalizedRole === 'teacher') {
            $mail->line('Welcome to ConvoMate! We are thrilled to welcome you to our teaching community.')
                ->line('Here are your next steps to start receiving lesson bookings:')
                ->line('1. **Complete Your Profile:** Ensure your bio, speaking levels, and lesson pricing are set up.')
                ->line('2. **Set Your Availability:** Add weekly or custom time slots so pupils can book sessions.')
                ->line('3. **Connect Calendar & Telegram:** Sync your Google Calendar and link our Telegram bot for instant booking alerts and meeting reminders.')
                ->action('Go to Dashboard', url('/dashboard'));
        } elseif ($normalizedRole === 'pupil') {
            $mail->line('Welcome to ConvoMate! We are excited to have you join our English speaking community.')
                ->line('Here is how to get started on your fluency journey:')
                ->line('1. **Find a Teacher:** Browse verified tutors and filter by price, goals, and speaking accent.')
                ->line('2. **Book a Lesson:** Select a convenient time slot and submit your booking request.')
                ->line('3. **Connect Telegram:** Link our Telegram bot to receive live meeting links and reminders directly on your phone.')
                ->action('Go to Dashboard', url('/dashboard'));
        } else {
            $mail->line('Welcome to ConvoMate! Your account has been successfully created.')
                ->line('You are ready to explore English speaking sessions and connect with conversation partners.')
                ->action('Go to Dashboard', url('/dashboard'));
        }

        $footerTip = $this->getEmailTipFooter($notifiable);
        if ($footerTip) {
            $mail->line($footerTip);
        }

        return $mail;
    }
}

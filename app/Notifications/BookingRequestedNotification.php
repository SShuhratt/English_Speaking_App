<?php

namespace App\Notifications;

use App\Models\Appointment;
use App\Notifications\Channels\TelegramChannel;
use App\Notifications\Concerns\HasNotificationTips;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class BookingRequestedNotification extends Notification implements ShouldQueue
{
    use HasNotificationTips, Queueable;

    public function __construct(
        public Appointment $appointment
    ) {}

    /**
     * Get notification channels.
     */
    public function via(object $notifiable): array
    {
        $channels = ['mail'];

        if (! empty($notifiable->routeNotificationFor('telegram', $this))) {
            $channels[] = TelegramChannel::class;
        }

        return $channels;
    }

    /**
     * Mail representation.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $pupilName = $this->appointment->pupil?->full_name ?? 'A student';
        $timeStr = $this->formatDateTime($this->appointment->start_at);
        $topics = is_array($this->appointment->topics) ? implode(', ', $this->appointment->topics) : 'General Speaking';

        $mail = (new MailMessage)
            ->subject("New Lesson Request from {$pupilName}")
            ->greeting("Hello {$notifiable->full_name}!")
            ->line("{$pupilName} has sent you a request for an English speaking session.")
            ->line("**Scheduled Time:** {$timeStr}")
            ->line("**Topics:** {$topics}")
            ->action('Review Booking Requests', url('/teacher/appointments'))
            ->line('Please log in to your account to review and approve or decline this booking.');

        $footerTip = $this->getEmailTipFooter($notifiable);
        if ($footerTip) {
            $mail->line($footerTip);
        }

        return $mail;
    }

    /**
     * Telegram representation.
     */
    public function toTelegram(object $notifiable): string
    {
        $pupilName = $this->appointment->pupil?->full_name ?? 'A student';
        $timeStr = $this->formatDateTime($this->appointment->start_at);
        $topics = is_array($this->appointment->topics) ? implode(', ', $this->appointment->topics) : 'General Speaking';

        $message = "🔔 <b>New Lesson Request!</b>\n\n".
            "<b>Student:</b> {$pupilName}\n".
            "<b>Scheduled Time:</b> {$timeStr}\n".
            "<b>Topics:</b> {$topics}\n\n".
            '👉 Please log in to your dashboard to review and approve this session: '.url('/teacher/appointments');

        $message .= $this->getTelegramTipFooter($notifiable);

        return $message;
    }
}

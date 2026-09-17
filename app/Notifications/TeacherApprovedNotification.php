<?php

namespace App\Notifications;

use App\Models\Appointment;
use App\Notifications\Channels\TelegramChannel;
use App\Notifications\Concerns\HasNotificationTips;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TeacherApprovedNotification extends Notification implements ShouldQueue
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
        $teacherName = $this->appointment->teacher?->full_name ?? 'Your teacher';
        $timeStr = $this->formatDateTime($this->appointment->start_at);

        $mail = (new MailMessage)
            ->subject("Your Lesson Request Was Approved by {$teacherName}")
            ->greeting("Hello {$notifiable->full_name}!")
            ->line("Great news! {$teacherName} has approved your lesson request.")
            ->line("**Scheduled Time:** {$timeStr}")
            ->line('Our administration team is currently verifying the payment. Once confirmed, your session will be locked in and you will receive your meeting link.')
            ->action('View My Bookings', url('/pupil/bookings'));

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
        $teacherName = $this->appointment->teacher?->full_name ?? 'Your teacher';
        $timeStr = $this->formatDateTime($this->appointment->start_at);

        $message = "✅ <b>Lesson Request Approved!</b>\n\n".
            "Your teacher, <b>{$teacherName}</b>, has approved your session for <b>{$timeStr}</b>.\n\n".
            "Our administration team is currently verifying payment confirmation. You will be notified the moment your session is fully confirmed.\n\n".
            '👉 View bookings: '.url('/pupil/bookings');

        $message .= $this->getTelegramTipFooter($notifiable);

        return $message;
    }
}

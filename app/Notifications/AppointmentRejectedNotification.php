<?php

namespace App\Notifications;

use App\Models\Appointment;
use App\Notifications\Channels\TelegramChannel;
use App\Notifications\Concerns\HasNotificationTips;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AppointmentRejectedNotification extends Notification implements ShouldQueue
{
    use HasNotificationTips, Queueable;

    public function __construct(
        public Appointment $appointment,
        public string $reason
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
        $teacherName = $this->appointment->teacher?->full_name ?? 'The teacher';
        $timeStr = $this->formatDateTime($this->appointment->start_at);

        $mail = (new MailMessage)
            ->subject('Lesson Request Update - English Speaking Platform')
            ->greeting("Hello {$notifiable->full_name}!")
            ->line("We are writing to let you know that your lesson request for **{$timeStr}** could not be accommodated by **{$teacherName}**.")
            ->line("**Reason provided:** {$this->reason}")
            ->line('No charges have been processed. You can easily choose a different time slot or book another certified teacher.')
            ->action('Browse Available Teachers', url('/teachers'))
            ->line('If you need any assistance, our support team is always here to help.');

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
        $teacherName = $this->appointment->teacher?->full_name ?? 'The teacher';
        $timeStr = $this->formatDateTime($this->appointment->start_at);

        $message = "❌ <b>Lesson Request Not Accepted</b>\n\n".
            "Your booking request for <b>{$timeStr}</b> with <b>{$teacherName}</b> was not approved.\n\n".
            "<b>Reason:</b> {$this->reason}\n\n".
            '👉 Browse other available teachers: '.url('/teachers');

        $message .= $this->getTelegramTipFooter($notifiable);

        return $message;
    }
}

<?php

namespace App\Notifications;

use App\Models\Appointment;
use App\Notifications\Channels\TelegramChannel;
use App\Notifications\Concerns\HasNotificationTips;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ConversationStartedNotification extends Notification implements ShouldQueue
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
        $isTeacher = $notifiable->id === $this->appointment->teacher_id;
        $partnerName = $isTeacher
            ? ($this->appointment->pupil?->full_name ?? 'your student')
            : ($this->appointment->teacher?->full_name ?? 'your teacher');

        $meetLink = $this->appointment->google_meet_link ?? url('/dashboard');

        $mail = (new MailMessage)
            ->subject('Your English Speaking Session Is Starting Now!')
            ->greeting("Hello {$notifiable->full_name}!")
            ->line("It is time for your lesson with **{$partnerName}**.")
            ->action('Enter Speaking Room Now', $meetLink)
            ->line('Your partner is expecting you. Have a great conversation!');

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
        $isTeacher = $notifiable->id === $this->appointment->teacher_id;
        $partnerName = $isTeacher
            ? ($this->appointment->pupil?->full_name ?? 'your student')
            : ($this->appointment->teacher?->full_name ?? 'your teacher');

        $meetLink = $this->appointment->google_meet_link ?? url('/dashboard');

        $message = "🚀 <b>Session is Starting Now!</b>\n\n".
            "Your conversation with <b>{$partnerName}</b> is ready to begin.\n\n".
            "👉 <b>Join Meeting:</b> <a href=\"{$meetLink}\">Click here to join</a>\n\n".
            'Have a fantastic practice session!';

        $message .= $this->getTelegramTipFooter($notifiable);

        return $message;
    }
}

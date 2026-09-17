<?php

namespace App\Notifications;

use App\Models\Appointment;
use App\Notifications\Channels\SmsChannel;
use App\Notifications\Channels\TelegramChannel;
use App\Notifications\Concerns\HasNotificationTips;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ConversationFiveMinuteReminderNotification extends Notification implements ShouldQueue
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

        if (! empty($notifiable->routeNotificationFor('sms', $this))) {
            $channels[] = SmsChannel::class;
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
            ->subject('Your English Speaking Session Starts in 5 Minutes!')
            ->greeting("Hello {$notifiable->full_name}!")
            ->line("Your lesson with **{$partnerName}** starts in 5 minutes.")
            ->line('Please prepare your microphone, webcam, and quiet surroundings.')
            ->action('Join Session Now', $meetLink)
            ->line('If the button above does not work, visit your platform dashboard to enter the room.');

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

        $message = "⏳ <b>Starting in 5 Minutes!</b>\n\n".
            "Your English practice session with <b>{$partnerName}</b> begins in 5 minutes.\n\n".
            "👉 <b>Join Meeting:</b> <a href=\"{$meetLink}\">Click here to join</a>\n\n".
            'Please check your audio and video before entering the room.';

        $message .= $this->getTelegramTipFooter($notifiable);

        return $message;
    }

    /**
     * SMS representation (Strategy 2: Eskiz SMS reserved for 5-min alert).
     */
    public function toSms(object $notifiable): string
    {
        $meetLink = $this->appointment->google_meet_link ?? url('/dashboard');

        return "English Platform: Your speaking session starts in 5 minutes! Join here: {$meetLink}";
    }
}

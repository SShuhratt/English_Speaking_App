<?php

namespace App\Notifications;

use App\Models\Appointment;
use App\Notifications\Channels\TelegramChannel;
use App\Notifications\Concerns\HasNotificationTips;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AdminConfirmedNotification extends Notification implements ShouldQueue
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

        $timeStr = $this->formatDateTime($this->appointment->start_at);

        $mail = (new MailMessage)
            ->subject('Lesson Confirmed - English Speaking Platform')
            ->greeting("Hello {$notifiable->full_name}!")
            ->line("Your upcoming English speaking session with **{$partnerName}** is officially confirmed.")
            ->line("**Scheduled Time:** {$timeStr}");

        if ($this->appointment->google_meet_link) {
            $mail->line("**Meeting Room:** [Join via Google Meet]({$this->appointment->google_meet_link})");
        }

        $dashboardUrl = $isTeacher ? url('/teacher/schedule') : url('/pupil/bookings');
        $mail->action('View Session Details', $dashboardUrl)
            ->line('We will send you a reminder 5 minutes before the session begins.');

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

        $timeStr = $this->formatDateTime($this->appointment->start_at);

        $message = "🎉 <b>Lesson Confirmed!</b>\n\n".
            "Your upcoming session with <b>{$partnerName}</b> is officially confirmed.\n\n".
            "📅 <b>Time:</b> {$timeStr}\n";

        if ($this->appointment->google_meet_link) {
            $message .= "🔗 <b>Meeting Link:</b> <a href=\"{$this->appointment->google_meet_link}\">Open Google Meet</a>\n\n";
        }

        $dashboardUrl = $isTeacher ? url('/teacher/schedule') : url('/pupil/bookings');
        $message .= "👉 View in dashboard: {$dashboardUrl}\n\n".
            '<i>We will notify you again 5 minutes before your session begins.</i>';

        $message .= $this->getTelegramTipFooter($notifiable);

        return $message;
    }
}

<?php

namespace App\Notifications;

use App\Models\Appointment;
use App\Notifications\Channels\TelegramChannel;
use App\Notifications\Concerns\HasNotificationTips;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AppointmentCancelledNotification extends Notification implements ShouldQueue
{
    use HasNotificationTips, Queueable;

    public function __construct(
        public Appointment $appointment,
        public string $reason,
        public ?string $cancelledByName = null
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
            ? ($this->appointment->pupil?->full_name ?? 'Your student')
            : ($this->appointment->teacher?->full_name ?? 'Your teacher');

        $cancelledBy = $this->cancelledByName ?? $partnerName;
        $timeStr = $this->formatDateTime($this->appointment->start_at);

        $mail = (new MailMessage)
            ->subject('Lesson Cancelled - ConvoMate')
            ->greeting("Hello {$notifiable->full_name}!")
            ->line("Your English speaking session with **{$partnerName}** scheduled for **{$timeStr}** has been cancelled by **{$cancelledBy}**.")
            ->line("**Reason provided:** {$this->reason}");

        if ($isTeacher) {
            $mail->action('View Your Schedule', url('/teacher/schedule'))
                ->line('Your availability slot has been reopened for other students.');
        } else {
            $mail->action('Book Another Session', url('/teachers'))
                ->line('Feel free to schedule another session whenever you are ready.');
        }

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
            ? ($this->appointment->pupil?->full_name ?? 'Your student')
            : ($this->appointment->teacher?->full_name ?? 'Your teacher');

        $cancelledBy = $this->cancelledByName ?? $partnerName;
        $timeStr = $this->formatDateTime($this->appointment->start_at);

        $dashboardUrl = $isTeacher ? url('/teacher/schedule') : url('/teachers');

        $message = "⚠️ <b>Lesson Cancelled</b>\n\n".
            "Your upcoming session with <b>{$partnerName}</b> on <b>{$timeStr}</b> was cancelled by <b>{$cancelledBy}</b>.\n\n".
            "<b>Reason:</b> {$this->reason}\n\n".
            "👉 View details: {$dashboardUrl}";

        $message .= $this->getTelegramTipFooter($notifiable);

        return $message;
    }
}

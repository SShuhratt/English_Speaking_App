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
        $startTimeStr = $this->formatDateTime($this->appointment->start_at);
        $endTimeStr = $this->appointment->end_at ? $this->formatDateTime($this->appointment->end_at) : null;
        $durationMinutes = $this->appointment->duration_minutes
            ?: ($this->appointment->start_at && $this->appointment->end_at
                ? (int) $this->appointment->start_at->diffInMinutes($this->appointment->end_at)
                : 60);
        $topics = is_array($this->appointment->topics) ? implode(', ', $this->appointment->topics) : 'General Speaking';
        $isPack = (bool) ($this->appointment->is_package_booking || $this->appointment->pupil_package_id);
        $bookingMethod = $isPack ? 'Conversation Pack' : ($this->appointment->is_trial ? 'Trial Lesson (Direct)' : 'Direct Booking');

        $mail = (new MailMessage)
            ->subject("New Lesson Request from {$pupilName}")
            ->greeting("Hello {$notifiable->full_name}!")
            ->line("{$pupilName} has sent you a request for an English speaking session.")
            ->line("**Booking Method:** {$bookingMethod}")
            ->line("**Start Time:** {$startTimeStr}");

        if ($endTimeStr) {
            $mail->line("**End Time:** {$endTimeStr}");
        }

        $mail->line("**Duration:** {$durationMinutes} minutes");

        if (! $isPack) {
            $priceFormatted = number_format((int) ($this->appointment->price ?? 0), 0, '.', ' ')." so'm";
            $mail->line("**Price:** {$priceFormatted}");
        }

        $mail->line("**Topics:** {$topics}")
            ->line('⏰ **Reminder:** Please respond to this incoming booking request within 30 minutes to confirm your availability.')
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
        $startTimeStr = $this->formatDateTime($this->appointment->start_at);
        $endTimeStr = $this->appointment->end_at ? $this->formatDateTime($this->appointment->end_at) : null;
        $durationMinutes = $this->appointment->duration_minutes
            ?: ($this->appointment->start_at && $this->appointment->end_at
                ? (int) $this->appointment->start_at->diffInMinutes($this->appointment->end_at)
                : 60);
        $topics = is_array($this->appointment->topics) ? implode(', ', $this->appointment->topics) : 'General Speaking';
        $isPack = (bool) ($this->appointment->is_package_booking || $this->appointment->pupil_package_id);
        $bookingMethod = $isPack ? 'Conversation Pack' : ($this->appointment->is_trial ? 'Trial Lesson (Direct)' : 'Direct Booking');

        $message = "🔔 <b>New Lesson Request!</b>\n\n".
            "<b>Student:</b> {$pupilName}\n".
            "<b>Booking Method:</b> {$bookingMethod}\n".
            "<b>Start Time:</b> {$startTimeStr}\n";

        if ($endTimeStr) {
            $message .= "<b>End Time:</b> {$endTimeStr}\n";
        }

        $message .= "<b>Duration:</b> {$durationMinutes} minutes\n";

        if (! $isPack) {
            $priceFormatted = number_format((int) ($this->appointment->price ?? 0), 0, '.', ' ')." so'm";
            $message .= "<b>Price:</b> {$priceFormatted}\n";
        }

        $message .= "<b>Topics:</b> {$topics}\n\n".
            "⏰ <b>Reminder:</b> Please respond to this incoming booking request within 30 minutes to confirm your availability.\n\n".
            '👉 Please log in to your dashboard to review and approve this session: '.url('/teacher/appointments');

        $message .= $this->getTelegramTipFooter($notifiable);

        return $message;
    }
}

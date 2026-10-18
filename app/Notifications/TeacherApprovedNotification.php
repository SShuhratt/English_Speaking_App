<?php

namespace App\Notifications;

use App\Models\Appointment;
use App\Notifications\Channels\TelegramChannel;
use App\Notifications\Concerns\HasNotificationTips;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Queue\SerializesModels;

class TeacherApprovedNotification extends Notification implements ShouldQueue
{
    use HasNotificationTips, Queueable, SerializesModels;

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
        $isPaidPackage = (bool) ($this->appointment->is_package_booking && $this->appointment->payment_status === 'paid');
        $paymentUrl = url("/pay/booking/{$this->appointment->id}");

        $mail = (new MailMessage)
            ->subject("Your Lesson Request Was Approved by {$teacherName}")
            ->greeting("Hello {$notifiable->full_name}!")
            ->line("Great news! {$teacherName} has approved your lesson request.")
            ->line("**Scheduled Time:** {$timeStr}");

        if ($isPaidPackage) {
            $mail->line('🎉 This session was booked using your Conversation Pack. No additional payment is needed.')
                ->action('View My Bookings', url('/pupil/bookings'));
        } else {
            if ($this->appointment->price) {
                $priceFormatted = number_format((int) $this->appointment->price, 0, '.', ' ')." so'm";
                $mail->line("**Price:** {$priceFormatted}");
            }

            $mail->line('⏳ **Important Notice:** Please complete the payment and upload your receipt within 60 minutes. Unpaid reservations automatically expire after 1 hour to free up the teacher\'s schedule.')
                ->action('Pay & Upload Receipt', $paymentUrl);
        }

        $mail->line('You can also view all your active sessions from your dashboard.');

        $footerTip = $this->getEmailTipFooter($notifiable);
        if ($footerTip) {
            $mail->line($footerTip);
        }

        return $mail;
    }

    /**
     * Telegram representation.
     *
     * @return array{text: string, reply_markup: array<string, mixed>}
     */
    public function toTelegram(object $notifiable): array
    {
        $teacherName = $this->appointment->teacher?->full_name ?? 'Your teacher';
        $timeStr = $this->formatDateTime($this->appointment->start_at);
        $isPaidPackage = (bool) ($this->appointment->is_package_booking && $this->appointment->payment_status === 'paid');
        $paymentUrl = url("/pay/booking/{$this->appointment->id}");
        $bookingsUrl = url('/pupil/bookings');

        if ($isPaidPackage) {
            $message = "✅ <b>Lesson Request Approved!</b>\n\n".
                "Your teacher, <b>{$teacherName}</b>, has approved your session for <b>{$timeStr}</b>.\n\n".
                "🎉 This session was booked using your Conversation Pack. No additional payment is required.\n\n".
                "👉 <b>My Bookings:</b> <a href=\"{$bookingsUrl}\">{$bookingsUrl}</a>";

            $replyMarkup = [
                'inline_keyboard' => [
                    [
                        ['text' => '👉 View My Bookings', 'url' => $bookingsUrl],
                    ],
                ],
            ];
        } else {
            $message = "✅ <b>Lesson Request Approved!</b>\n\n".
                "Your teacher, <b>{$teacherName}</b>, has approved your session for <b>{$timeStr}</b>.\n\n";

            if ($this->appointment->price) {
                $priceFormatted = number_format((int) $this->appointment->price, 0, '.', ' ')." so'm";
                $message .= "💰 <b>Price:</b> {$priceFormatted}\n\n";
            }

            $message .= "⏳ <b>Important:</b> Please complete the payment and upload your receipt within <b>60 minutes</b>. Unpaid reservations automatically expire after 1 hour to free up the teacher's schedule.\n\n".
                "💳 <b>Pay & Upload Receipt:</b> <a href=\"{$paymentUrl}\">{$paymentUrl}</a>\n\n".
                "👉 <b>My Bookings:</b> <a href=\"{$bookingsUrl}\">{$bookingsUrl}</a>";

            $replyMarkup = [
                'inline_keyboard' => [
                    [
                        ['text' => '💳 Pay & Upload Receipt', 'url' => $paymentUrl],
                    ],
                ],
            ];
        }

        $message .= $this->getTelegramTipFooter($notifiable);

        return [
            'text' => $message,
            'reply_markup' => $replyMarkup,
        ];
    }
}

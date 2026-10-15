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
        $paymentUrl = url("/pay/booking/{$this->appointment->id}");

        $mail = (new MailMessage)
            ->subject("Your Lesson Request Was Approved by {$teacherName}")
            ->greeting("Hello {$notifiable->full_name}!")
            ->line("Great news! {$teacherName} has approved your lesson request.")
            ->line("**Scheduled Time:** {$timeStr}")
            ->line('⏳ **Important:** Please complete the payment and upload your receipt within 60 minutes. Unpaid reservations automatically expire after 1 hour to free up the teacher\'s schedule.')
            ->action('Pay & Upload Receipt', $paymentUrl)
            ->line('You can also view all your active sessions from your dashboard.');

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
        $paymentUrl = url("/pay/booking/{$this->appointment->id}");

        $message = "✅ <b>Lesson Request Approved!</b>\n\n".
            "Your teacher, <b>{$teacherName}</b>, has approved your session for <b>{$timeStr}</b>.\n\n".
            "⏳ <b>Muhim eslatma / Важно:</b> To'lovni amalga oshirib, chekni <b>60 daqiqa</b> ichida yuklang. To'lanmagan buyurtmalar 60 daqiqadan so'ng avtomatik bekor qilinadi.\n".
            "Пожалуйста, оплатите и загрузите чек в течение <b>60 минут</b>, иначе бронирование автоматически аннулируется.\n\n".
            "💳 To'lov qilish / Оплатить: {$paymentUrl}\n".
            '👉 Darslarim / Мои уроки: '.url('/pupil/bookings');

        $message .= $this->getTelegramTipFooter($notifiable);

        return $message;
    }
}

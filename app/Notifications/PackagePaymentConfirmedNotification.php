<?php

namespace App\Notifications;

use App\Models\PupilPackage;
use App\Notifications\Channels\TelegramChannel;
use App\Notifications\Concerns\HasNotificationTips;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class PackagePaymentConfirmedNotification extends Notification implements ShouldQueue
{
    use HasNotificationTips, Queueable;

    public function __construct(
        public PupilPackage $pupilPackage
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
        $teacherName = $this->pupilPackage->teacher?->full_name ?? 'your teacher';
        $hours = round(((float) ($this->pupilPackage->total_minutes ?? 0)) / 60, 1);
        $orderId = 'PKG-'.strtoupper(substr((string) $this->pupilPackage->id, 0, 8));
        $formattedPrice = number_format((float) ($this->pupilPackage->price_paid ?? 0), 0, '.', ' ')." so'm";
        $teacherUrl = $this->pupilPackage->teacher_id
            ? url("/pupil/teachers/{$this->pupilPackage->teacher_id}")
            : url('/pupil/teachers');

        $totalRemainingMinutes = PupilPackage::where('pupil_id', $this->pupilPackage->pupil_id)
            ->where('teacher_id', $this->pupilPackage->teacher_id)
            ->where('status', 'active')
            ->where('payment_status', 'paid')
            ->where('remaining_minutes', '>', 0)
            ->sum('remaining_minutes');
        $cumulativeHours = round(((float) $totalRemainingMinutes) / 60, 1);

        $mail = (new MailMessage)
            ->subject("Package Payment Verified - {$orderId} - Hours Active! - ConvoMate")
            ->greeting("Hello {$notifiable->full_name}!")
            ->line("Great news! Your payment for **{$this->pupilPackage->package_title}** ({$hours} hours) with **{$teacherName}** has been confirmed by our team.")
            ->line('### Order & Payment Receipt:')
            ->line("**Order ID:** `{$orderId}`")
            ->line("**Package:** {$this->pupilPackage->package_title}")
            ->line("**Amount Paid:** {$formattedPrice}")
            ->line('**Payment Status:** Confirmed / Paid')
            ->line("**Total Available Balance with {$teacherName}:** **{$cumulativeHours} hours**")
            ->line('Your conversation hours are now active! You can schedule speaking sessions directly with your teacher without any additional payment.')
            ->action('Book a Session Now', $teacherUrl)
            ->line('Enjoy practicing your English speaking skills!');

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
        $teacherName = htmlspecialchars($this->pupilPackage->teacher?->full_name ?? 'your teacher', ENT_QUOTES, 'UTF-8');
        $packageTitle = htmlspecialchars($this->pupilPackage->package_title ?? 'Conversation Pack', ENT_QUOTES, 'UTF-8');
        $hours = round(((float) ($this->pupilPackage->total_minutes ?? 0)) / 60, 1);
        $orderId = 'PKG-'.strtoupper(substr((string) $this->pupilPackage->id, 0, 8));
        $formattedPrice = number_format((float) ($this->pupilPackage->price_paid ?? 0), 0, '.', ' ')." so'm";
        $teacherUrl = $this->pupilPackage->teacher_id
            ? url("/pupil/teachers/{$this->pupilPackage->teacher_id}")
            : url('/pupil/teachers');

        $totalRemainingMinutes = PupilPackage::where('pupil_id', $this->pupilPackage->pupil_id)
            ->where('teacher_id', $this->pupilPackage->teacher_id)
            ->where('status', 'active')
            ->where('payment_status', 'paid')
            ->where('remaining_minutes', '>', 0)
            ->sum('remaining_minutes');
        $cumulativeHours = round(((float) $totalRemainingMinutes) / 60, 1);

        $message = "🎉 <b>Package Payment Confirmed!</b>\n\n".
            "Your payment for <b>{$packageTitle}</b> ({$hours}h) with <b>{$teacherName}</b> is approved!\n\n".
            "🔖 <b>Order ID:</b> <code>{$orderId}</code>\n".
            "💳 <b>Amount Paid:</b> {$formattedPrice}\n".
            "✅ <b>Payment Status:</b> Confirmed\n".
            "⏳ <b>Total Available with {$teacherName}:</b> <b>{$cumulativeHours}h</b>\n\n".
            "✨ Your conversation hours are now active and ready to use.\n\n".
            "👉 <a href=\"{$teacherUrl}\">Book a Session with {$teacherName}</a>";

        $message .= $this->getTelegramTipFooter($notifiable);

        return $message;
    }
}

<?php

namespace App\Notifications;

use App\Models\PupilPackage;
use App\Notifications\Channels\TelegramChannel;
use App\Notifications\Concerns\HasNotificationTips;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TeacherPackagePurchasedNotification extends Notification implements ShouldQueue
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
        $pupil = $this->pupilPackage->pupil;
        $pupilName = $pupil?->full_name ?? 'A student';
        $pupilId = $pupil?->short_id ?? ('PUPIL-'.strtoupper(substr((string) ($pupil?->id ?? '00000000'), 0, 8)));
        $hours = round(((float) ($this->pupilPackage->total_minutes ?? 0)) / 60, 1);
        $orderId = 'PKG-'.strtoupper(substr((string) $this->pupilPackage->id, 0, 8));
        $formattedPrice = number_format((float) ($this->pupilPackage->price_paid ?? 0), 0, '.', ' ')." so'm";
        $purchaseDate = $this->pupilPackage->updated_at
            ? $this->pupilPackage->updated_at->format('M j, Y, H:i')
            : now()->format('M j, Y, H:i');

        $scheduleUrl = url('/teacher/schedule');

        $mail = (new MailMessage)
            ->subject("New Conversation Pack Purchased - {$this->pupilPackage->package_title} - ConvoMate")
            ->greeting("Hello {$notifiable->full_name}!")
            ->line('A student has purchased your conversation package on ConvoMate.')
            ->line('### Order & Customer Details:')
            ->line("**Customer:** {$pupilName}")
            ->line("**Pupil ID:** `{$pupilId}`")
            ->line("**Package:** {$this->pupilPackage->package_title} ({$hours} hours)")
            ->line("**Order ID:** `{$orderId}`")
            ->line("**Date:** {$purchaseDate}")
            ->line("**Payment Status:** Confirmed / Paid ({$formattedPrice})")
            ->action('View My Schedule', $scheduleUrl)
            ->line('The student can now book speaking sessions with you using their package hours. Make sure your availability is up to date!');

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
        $pupil = $this->pupilPackage->pupil;
        $pupilName = htmlspecialchars($pupil?->full_name ?? 'A student', ENT_QUOTES, 'UTF-8');
        $pupilId = htmlspecialchars($pupil?->short_id ?? ('PUPIL-'.strtoupper(substr((string) ($pupil?->id ?? '00000000'), 0, 8))), ENT_QUOTES, 'UTF-8');
        $packageTitle = htmlspecialchars($this->pupilPackage->package_title ?? 'Conversation Pack', ENT_QUOTES, 'UTF-8');
        $hours = round(((float) ($this->pupilPackage->total_minutes ?? 0)) / 60, 1);
        $orderId = 'PKG-'.strtoupper(substr((string) $this->pupilPackage->id, 0, 8));
        $formattedPrice = number_format((float) ($this->pupilPackage->price_paid ?? 0), 0, '.', ' ')." so'm";
        $purchaseDate = $this->pupilPackage->updated_at
            ? $this->pupilPackage->updated_at->format('M j, Y, H:i')
            : now()->format('M j, Y, H:i');

        $scheduleUrl = url('/teacher/schedule');

        $message = "🎉 <b>Student Purchased Your Conversation Pack!</b>\n\n".
            "A student has purchased hours with you:\n\n".
            "👤 <b>Customer:</b> {$pupilName}\n".
            "🆔 <b>Pupil ID:</b> <code>{$pupilId}</code>\n".
            "📦 <b>Package:</b> {$packageTitle} ({$hours}h)\n".
            "🔖 <b>Order ID:</b> <code>{$orderId}</code>\n".
            "📅 <b>Date:</b> {$purchaseDate}\n".
            "💳 <b>Payment:</b> Confirmed ({$formattedPrice})\n\n".
            "👉 <a href=\"{$scheduleUrl}\">View Schedule & Availability</a>\n\n".
            '<i>The student can now schedule sessions directly from your available slots.</i>';

        $message .= $this->getTelegramTipFooter($notifiable);

        return $message;
    }
}

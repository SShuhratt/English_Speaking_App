<?php

namespace App\Notifications;

use App\Models\PupilPackage;
use App\Notifications\Channels\TelegramChannel;
use App\Notifications\Concerns\HasNotificationTips;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class PackagePaymentRejectedNotification extends Notification implements ShouldQueue
{
    use HasNotificationTips, Queueable;

    public function __construct(
        public PupilPackage $pupilPackage,
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
        $teacherName = $this->pupilPackage->teacher?->full_name ?? 'the teacher';

        $mail = (new MailMessage)
            ->subject('Package Payment Verification Update - ConvoMate')
            ->greeting("Hello {$notifiable->full_name}!")
            ->line("We were unable to verify the payment for your ordered pack **{$this->pupilPackage->package_title}** with **{$teacherName}**.")
            ->line("**Reason provided:** {$this->reason}")
            ->line('If you believe this was in error, please reach out to our support team or send your valid receipt to our Telegram channel.')
            ->action('Open Support on Telegram', 'https://t.me/+Z9Gr0FnDDAFhOTky');

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
        $teacherName = $this->pupilPackage->teacher?->full_name ?? 'the teacher';

        $message = "❌ <b>Package Payment Verification Unsuccessful</b>\n\n".
            "Your payment verification for <b>{$this->pupilPackage->package_title}</b> with <b>{$teacherName}</b> was not approved.\n\n".
            "<b>Reason:</b> {$this->reason}\n\n".
            '👉 Please contact support or resend your payment slip: <a href="https://t.me/+Z9Gr0FnDDAFhOTky">Telegram Support</a>';

        $message .= $this->getTelegramTipFooter($notifiable);

        return $message;
    }
}

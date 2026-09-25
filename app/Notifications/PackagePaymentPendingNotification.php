<?php

namespace App\Notifications;

use App\Models\PupilPackage;
use App\Notifications\Channels\TelegramChannel;
use App\Notifications\Concerns\HasNotificationTips;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class PackagePaymentPendingNotification extends Notification implements ShouldQueue
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
        $formattedPrice = number_format((float) ($this->pupilPackage->price_paid ?? 0), 0, '.', ' ')." so'm";
        $hours = round(((float) ($this->pupilPackage->total_minutes ?? 0)) / 60, 1);
        $pupilId = $notifiable->short_id ?? strtoupper(substr((string) $notifiable->id, 0, 8));

        $mail = (new MailMessage)
            ->subject('Package Order Received - Complete Your Payment - ConvoMate')
            ->greeting("Hello {$notifiable->full_name}!")
            ->line("Thank you for ordering the **{$this->pupilPackage->package_title}** ({$hours} hours) with **{$teacherName}**.")
            ->line("**Amount due:** {$formattedPrice}")
            ->line('### Payment Instructions:')
            ->line('1. Transfer the exact amount to the following card:')
            ->line('**Card:** `9860 1966 1940 4458` (HUMO / UZCARD - Zarnigor Mirsaidova)')
            ->line("2. Send your payment receipt and Pupil ID (**{$pupilId}**) to our verification team on Telegram:")
            ->action('Send Receipt on Telegram', 'https://t.me/+Z9Gr0FnDDAFhOTky')
            ->line('Once verified by our administrators, your hours will become active immediately and you can book sessions freely.');

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
        $teacherName = $this->pupilPackage->teacher?->full_name ?? 'your teacher';
        $formattedPrice = number_format((float) ($this->pupilPackage->price_paid ?? 0), 0, '.', ' ')." so'm";
        $hours = round(((float) ($this->pupilPackage->total_minutes ?? 0)) / 60, 1);
        $pupilId = $notifiable->short_id ?? strtoupper(substr((string) $notifiable->id, 0, 8));

        $message = "📦 <b>Package Order Received!</b>\n\n".
            "You ordered <b>{$this->pupilPackage->package_title}</b> ({$hours}h) with <b>{$teacherName}</b>.\n\n".
            "💳 <b>Amount:</b> {$formattedPrice}\n".
            "💳 <b>Card:</b> <code>9860 1966 1940 4458</code> (HUMO/UZCARD - Zarnigor Mirsaidova)\n".
            "🆔 <b>Your Pupil ID:</b> <code>{$pupilId}</code>\n\n".
            "⚡ <b>Next Step:</b> Please make the transfer and send the receipt to our Telegram confirmation channel:\n".
            "👉 <a href=\"https://t.me/+Z9Gr0FnDDAFhOTky\">Send Receipt on Telegram</a>\n\n".
            '<i>Once approved by an admin, your hours will be credited immediately.</i>';

        $message .= $this->getTelegramTipFooter($notifiable);

        return $message;
    }
}

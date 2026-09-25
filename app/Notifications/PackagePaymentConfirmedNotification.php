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
        $teacherUrl = $this->pupilPackage->teacher_id
            ? url("/teachers/{$this->pupilPackage->teacher_id}")
            : url('/teachers');

        $mail = (new MailMessage)
            ->subject('Package Payment Verified - Hours Active! - ConvoMate')
            ->greeting("Hello {$notifiable->full_name}!")
            ->line("Great news! Your payment for **{$this->pupilPackage->package_title}** ({$hours} hours) with **{$teacherName}** has been confirmed by our team.")
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
        $teacherName = $this->pupilPackage->teacher?->full_name ?? 'your teacher';
        $hours = round(((float) ($this->pupilPackage->total_minutes ?? 0)) / 60, 1);
        $teacherUrl = $this->pupilPackage->teacher_id
            ? url("/teachers/{$this->pupilPackage->teacher_id}")
            : url('/teachers');

        $message = "🎉 <b>Package Payment Confirmed!</b>\n\n".
            "Your payment for <b>{$this->pupilPackage->package_title}</b> ({$hours}h) with <b>{$teacherName}</b> is approved!\n\n".
            "✨ Your conversation hours are now active and ready to use.\n\n".
            "👉 <a href=\"{$teacherUrl}\">Book a Session with {$teacherName}</a>";

        $message .= $this->getTelegramTipFooter($notifiable);

        return $message;
    }
}

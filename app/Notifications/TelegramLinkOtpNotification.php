<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TelegramLinkOtpNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public int $backoff = 30;

    public function __construct(
        public string $code
    ) {}

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $name = ! empty($notifiable->full_name) ? $notifiable->full_name : ($notifiable->name ?? 'there');
        $formattedCode = substr($this->code, 0, 3).' '.substr($this->code, 3, 3);

        return (new MailMessage)
            ->subject("Your ConvoMate Verification Code: {$this->code}")
            ->greeting("Hello {$name}!")
            ->line('You requested to link your ConvoMate account with Telegram.')
            ->line('Your 6-digit verification code is:')
            ->line("# **{$formattedCode}**")
            ->line('This code will expire in 10 minutes.')
            ->line('If you did not request this code, no action is needed and your account remains secure.');
    }
}

<?php

namespace App\Notifications\Channels;

use App\Services\Telegram\TelegramService;
use Illuminate\Notifications\Notification;

class TelegramChannel
{
    public function __construct(
        protected TelegramService $telegramService
    ) {}

    /**
     * Send the given notification via Telegram.
     */
    public function send(object $notifiable, Notification $notification): void
    {
        $chatId = $notifiable->routeNotificationFor('telegram', $notification);

        if (! $chatId || ! method_exists($notification, 'toTelegram')) {
            return;
        }

        $message = $notification->toTelegram($notifiable);

        if (is_string($message)) {
            $this->telegramService->sendMessage($chatId, $message);
        } elseif (is_array($message) && isset($message['text'])) {
            $this->telegramService->sendMessage(
                $chatId,
                $message['text'],
                $message['reply_markup'] ?? null,
                $message['parse_mode'] ?? 'HTML'
            );
        }
    }
}

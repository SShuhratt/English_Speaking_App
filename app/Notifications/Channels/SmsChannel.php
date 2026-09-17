<?php

namespace App\Notifications\Channels;

use App\Services\Sms\SmsService;
use Illuminate\Notifications\Notification;

class SmsChannel
{
    public function __construct(
        protected SmsService $smsService
    ) {}

    /**
     * Send the given notification via SMS.
     */
    public function send(object $notifiable, Notification $notification): void
    {
        $phone = $notifiable->routeNotificationFor('sms', $notification);

        if (! $phone || ! method_exists($notification, 'toSms')) {
            return;
        }

        $message = $notification->toSms($notifiable);

        if (! empty($message) && is_string($message)) {
            $this->smsService->send($phone, $message);
        }
    }
}

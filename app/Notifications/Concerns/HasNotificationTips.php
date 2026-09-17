<?php

namespace App\Notifications\Concerns;

use App\Models\User;
use Carbon\Carbon;

trait HasNotificationTips
{
    /**
     * Build tip footer for email messages if channels are missing.
     */
    protected function getEmailTipFooter(object $notifiable): ?string
    {
        if (! ($notifiable instanceof User)) {
            return null;
        }

        $tips = [];

        if (empty($notifiable->telegram_chat_id)) {
            $tips[] = '💡 Quick Tip: Connect our Telegram Bot in your profile settings to receive instant lesson alerts on your phone.';
        }

        if (empty($notifiable->routeNotificationForSms())) {
            $tips[] = '💡 Quick Tip: Add your mobile phone number in your profile settings to ensure you never miss urgent notifications.';
        }

        if (empty($tips)) {
            return null;
        }

        return implode("\n\n", $tips);
    }

    /**
     * Build tip footer for Telegram messages if phone number is missing.
     */
    protected function getTelegramTipFooter(object $notifiable): ?string
    {
        if (! ($notifiable instanceof User)) {
            return null;
        }

        if (empty($notifiable->routeNotificationForSms())) {
            return "\n\n💡 <i>Tip: Add your mobile phone number in your profile settings to complete your profile.</i>";
        }

        return '';
    }

    /**
     * Format appointment time nicely in Tashkent time (standard platform timezone).
     */
    protected function formatDateTime(\DateTimeInterface $dateTime): string
    {
        return Carbon::parse($dateTime)
            ->setTimezone('Asia/Tashkent')
            ->format('F j, Y \a\t g:i A (Tashkent time)');
    }
}

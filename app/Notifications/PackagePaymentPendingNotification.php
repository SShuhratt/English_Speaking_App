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
        $pupilId = $notifiable->short_id ?? ('PUPIL-'.strtoupper(substr((string) $notifiable->id, 0, 8)));
        $orderId = 'PKG-'.strtoupper(substr((string) $this->pupilPackage->id, 0, 8));
        $orderDate = $this->pupilPackage->created_at
            ? $this->pupilPackage->created_at->format('M j, Y, H:i')
            : now()->format('M j, Y, H:i');

        $basePrice = (int) ($this->pupilPackage->price_paid + ($this->pupilPackage->discount_amount ?? 0));
        $formattedBasePrice = number_format($basePrice, 0, '.', ' ')." so'm";
        $discountAmount = (int) ($this->pupilPackage->discount_amount ?? 0);
        $voucher = $this->pupilPackage->discountVoucher;

        $mail = (new MailMessage)
            ->subject("Package Order Received - {$orderId} - Complete Your Payment - ConvoMate")
            ->greeting("Hello {$notifiable->full_name}!")
            ->line("Thank you for ordering the **{$this->pupilPackage->package_title}** ({$hours} hours) with **{$teacherName}**.")
            ->line('### Order & Payment Summary:')
            ->line("**Order ID:** `{$orderId}`")
            ->line("**Order Date:** {$orderDate}")
            ->line("**Package:** {$this->pupilPackage->package_title} ({$hours} hours)")
            ->line("**Teacher:** {$teacherName}")
            ->line("**Base Price:** {$formattedBasePrice}");

        if ($discountAmount > 0) {
            $voucherCode = $voucher?->voucher_code ? " (`{$voucher->voucher_code}`)" : '';
            $formattedDiscount = number_format($discountAmount, 0, '.', ' ')." so'm";
            $mail->line("**Discount Applied{$voucherCode}:** -{$formattedDiscount}");
        }

        $mail->line("**Total Amount Due:** **{$formattedPrice}**")
            ->line('**Payment Status:** Pending Verification')
            ->line('### Payment Instructions:')
            ->line('1. Transfer the exact amount to the following card:')
            ->line('**Card:** `9860 1966 1940 4458` (HUMO / UZCARD - Zarnigor Mirsaidova)')
            ->line("2. Send your payment receipt, Order ID (**`{$orderId}`**), and Pupil ID (**{$pupilId}**) to our verification team on Telegram:")
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
        $teacherName = htmlspecialchars($this->pupilPackage->teacher?->full_name ?? 'your teacher', ENT_QUOTES, 'UTF-8');
        $packageTitle = htmlspecialchars($this->pupilPackage->package_title ?? 'Conversation Pack', ENT_QUOTES, 'UTF-8');
        $formattedPrice = number_format((float) ($this->pupilPackage->price_paid ?? 0), 0, '.', ' ')." so'm";
        $hours = round(((float) ($this->pupilPackage->total_minutes ?? 0)) / 60, 1);
        $pupilId = htmlspecialchars($notifiable->short_id ?? ('PUPIL-'.strtoupper(substr((string) $notifiable->id, 0, 8))), ENT_QUOTES, 'UTF-8');
        $orderId = 'PKG-'.strtoupper(substr((string) $this->pupilPackage->id, 0, 8));
        $orderDate = $this->pupilPackage->created_at
            ? $this->pupilPackage->created_at->format('M j, Y, H:i')
            : now()->format('M j, Y, H:i');

        $basePrice = (int) ($this->pupilPackage->price_paid + ($this->pupilPackage->discount_amount ?? 0));
        $formattedBasePrice = number_format($basePrice, 0, '.', ' ')." so'm";
        $discountAmount = (int) ($this->pupilPackage->discount_amount ?? 0);
        $voucher = $this->pupilPackage->discountVoucher;

        $message = "📦 <b>Package Order Received!</b>\n\n".
            "🔖 <b>Order ID:</b> <code>{$orderId}</code>\n".
            "📅 <b>Date:</b> {$orderDate}\n".
            "📦 <b>Package:</b> {$packageTitle} ({$hours}h)\n".
            "👨‍🏫 <b>Teacher:</b> {$teacherName}\n".
            "💵 <b>Base Price:</b> {$formattedBasePrice}\n";

        if ($discountAmount > 0) {
            $voucherCode = $voucher?->voucher_code ? " (<code>{$voucher->voucher_code}</code>)" : '';
            $formattedDiscount = number_format($discountAmount, 0, '.', ' ')." so'm";
            $message .= "🎟 <b>Discount{$voucherCode}:</b> -{$formattedDiscount}\n";
        }

        $message .= "💳 <b>Total Due:</b> <b>{$formattedPrice}</b>\n".
            "⏳ <b>Status:</b> Pending Verification\n\n".
            "<b>Payment Details:</b>\n".
            "💳 <b>Card:</b> <code>9860 1966 1940 4458</code> (HUMO/UZCARD - Zarnigor Mirsaidova)\n".
            "🆔 <b>Your Pupil ID:</b> <code>{$pupilId}</code>\n\n".
            "⚡ <b>Next Step:</b> Please make the transfer and send the receipt to our Telegram confirmation channel:\n".
            "👉 <a href=\"https://t.me/+Z9Gr0FnDDAFhOTky\">Send Receipt on Telegram</a>\n\n".
            '<i>Once approved by an admin, your hours will be credited immediately.</i>';

        $message .= $this->getTelegramTipFooter($notifiable);

        return $message;
    }
}

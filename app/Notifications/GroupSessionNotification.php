<?php

namespace App\Notifications;

use App\Models\GroupSession;
use App\Notifications\Channels\TelegramChannel;
use App\Notifications\Concerns\HasNotificationTips;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class GroupSessionNotification extends Notification implements ShouldQueue
{
    use HasNotificationTips, Queueable;

    public function __construct(
        public GroupSession $groupSession,
        public string $eventType,
        public ?string $extraMessage = null
    ) {}

    /**
     * Get notification channels.
     *
     * @return array<int, string>
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
     * Build the email representation.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $title = $this->groupSession->title;
        $timeStr = $this->formatDateTime($this->groupSession->start_at);
        $teacherName = $this->groupSession->teacher?->full_name ?? 'your teacher';

        $mail = match ($this->eventType) {
            'started' => (new MailMessage)
                ->subject("Group Session Starting Now: {$title}")
                ->greeting("Hello {$notifiable->full_name}!")
                ->line("Your group conversation **{$title}** with **{$teacherName}** has started.")
                ->action('Join Group Room', $this->groupSession->google_meet_link ?? url('/dashboard'))
                ->line('Join now to start speaking with your group!'),
            'reminder_5min' => (new MailMessage)
                ->subject("Group Session Starts in 5 Minutes: {$title}")
                ->greeting("Hello {$notifiable->full_name}!")
                ->line("Your group conversation **{$title}** starts in 5 minutes ({$timeStr}).")
                ->action('Open Dashboard', url('/dashboard'))
                ->line('Please prepare your microphone and a quiet space.'),
            'rescheduled' => (new MailMessage)
                ->subject("Group Session Rescheduled: {$title}")
                ->greeting("Hello {$notifiable->full_name}!")
                ->line("**{$teacherName}** rescheduled group conversation **{$title}** to **{$timeStr}**.")
                ->action('View Session', url('/dashboard')),
            'enrollment_confirmed' => (new MailMessage)
                ->subject("Seat Confirmed: {$title}")
                ->greeting("Hello {$notifiable->full_name}!")
                ->line("Your seat in **{$title}** with **{$teacherName}** ({$timeStr}) is confirmed!")
                ->action('View My Sessions', url('/pupil/bookings')),
            default => (new MailMessage)
                ->subject("Group Session Cancelled: {$title}")
                ->greeting("Hello {$notifiable->full_name}!")
                ->line("Group conversation **{$title}** scheduled for **{$timeStr}** was cancelled.")
                ->line($this->extraMessage ?: 'Any paid seat balance will be handled by support/admin.')
                ->action('Browse Open Sessions', url('/pupil/teachers')),
        };

        $footerTip = $this->getEmailTipFooter($notifiable);
        if ($footerTip) {
            $mail->line($footerTip);
        }

        return $mail;
    }

    /**
     * Build the Telegram notification text.
     */
    public function toTelegram(object $notifiable): string
    {
        $title = htmlspecialchars($this->groupSession->title, ENT_QUOTES, 'UTF-8');
        $teacherName = htmlspecialchars($this->groupSession->teacher?->full_name ?? 'Teacher', ENT_QUOTES, 'UTF-8');
        $timeStr = htmlspecialchars($this->formatDateTime($this->groupSession->start_at), ENT_QUOTES, 'UTF-8');
        $meetLink = $this->groupSession->google_meet_link;

        return match ($this->eventType) {
            'started' => "🎙 <b>Group Session Starting Now!</b>\n\n📚 <b>Topic:</b> {$title}\n👨‍🏫 <b>Teacher:</b> {$teacherName}"
                .($meetLink ? "\n🔗 <a href=\"{$meetLink}\">Join Google Meet</a>" : ''),
            'reminder_5min' => "⏰ <b>Starts in 5 Minutes:</b> {$title}\n👨‍🏫 <b>Teacher:</b> {$teacherName}\n🕒 {$timeStr}",
            'rescheduled' => "📅 <b>Group Session Rescheduled</b>\n\n📚 {$title}\n🕒 New time: {$timeStr}",
            'enrollment_confirmed' => "✅ <b>Group Seat Confirmed!</b>\n\n📚 {$title}\n👨‍🏫 {$teacherName}\n🕒 {$timeStr}",
            default => "❌ <b>Group Session Cancelled</b>\n\n📚 {$title}\n🕒 {$timeStr}"
                .($this->extraMessage ? "\nℹ️ ".htmlspecialchars($this->extraMessage, ENT_QUOTES, 'UTF-8') : ''),
        };
    }
}
